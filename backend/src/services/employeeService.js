const db = require('../config/db');
const employeeRepository = require('../repositories/employeeRepository');
const userRepository = require('../repositories/userRepository');
const authService = require('./authService');
const mailService = require('./mailService');
const bcrypt = require('bcryptjs');

class EmployeeService {
    async getAllEmployees(user, filters) {
        return await employeeRepository.findAll(user, filters);
    }

    async search(query, companyId) {
        if (!query) return [];
        return await db('employees')
            .where('company_id', companyId)
            .andWhere(function() {
                this.where('first_name', 'like', `%${query}%`)
                    .orWhere('last_name', 'like', `%${query}%`)
                    .orWhere('employee_id_number', 'like', `%${query}%`);
            })
            .select('id', 'first_name', 'last_name', 'employee_id_number', 'designation')
            .limit(10);
    }

    async addEmployee(companyId, data) {
        // Normalize email to null if empty
        if (data.email) {
            data.email = data.email.trim();
            if (data.email === '') {
                data.email = null;
            }
        } else {
            data.email = null;
        }

        const result = await db.transaction(async (trx) => {
            // 1. Handle User account (Check for existing first)
            let userId = null;
            if (data.email) {
                const existingUser = await trx('users').where({ email: data.email }).first();
                
                if (existingUser) {
                    userId = existingUser.id;
                    // Optional: Update existing user status if needed
                    await trx('users').where({ id: userId }).update({ status: 'active' });
                } else {
                    const salt = await bcrypt.genSalt(10);
                    const passwordHash = await bcrypt.hash('Fast@123', salt);
                    const roleName = data.role_name || 'employee';
                    const role = await trx('roles').where({ name: roleName }).first();
                    
                    const [newUserId] = await trx('users').insert({
                        company_id: companyId,
                        email: data.email,
                        password_hash: passwordHash,
                        role_id: role.id,
                        status: 'active'
                    });
                    userId = newUserId;
                }
            }

            // 2. Handle Employee record
            // First check if an ACTIVE employee with this email already exists (only if email is provided)
            if (data.email) {
                const activeEmployee = await trx('employees')
                    .where({ email: data.email, status: 'active', company_id: companyId })
                    .first();

                if (activeEmployee) {
                    throw new Error('An active employee with this email already exists. Cannot create duplicate.');
                }
            }

            // Check if any employee (including inactive) exists to reuse
            const existingEmployee = data.email ? await trx('employees')
                .where(builder => {
                    builder.where({ email: data.email });
                    if (userId) builder.orWhere({ user_id: userId });
                })
                .andWhere({ company_id: companyId })
                .first() : null;

            const onboardingToken = `ONB-${Math.random().toString(36).slice(-10).toUpperCase()}`;
            let employeeId;

            if (existingEmployee) {
                employeeId = existingEmployee.id;
                // Reuse and reactivate the inactive employee
                const cleanData = employeeRepository._mapEmployeeData({
                    ...data,
                    status: 'active',
                    onboarding_token: onboardingToken,
                    onboarding_status: 'pending'
                });
                await trx('employees').where({ id: employeeId }).update(cleanData);
            } else {
                const employeeData = {
                    ...data,
                    user_id: userId,
                    company_id: companyId,
                    status: 'active',
                    onboarding_token: onboardingToken,
                    onboarding_status: 'pending'
                };
                const [newEmployeeId] = await employeeRepository.create(employeeData, trx);
                employeeId = newEmployeeId;
            }

            if (data.initial_leaves && typeof data.initial_leaves === 'object') {
                const leaveTypes = await trx('leave_types').where(function() {
                    this.whereNull('company_id').orWhere('company_id', companyId);
                }).andWhere('is_active', true);

                for (const lt of leaveTypes) {
                    const assignedDays = Number(data.initial_leaves[lt.id]);
                    if (isNaN(assignedDays)) continue;

                    const defaultDays = Number(lt.days_per_year);
                    const diff = assignedDays - defaultDays;

                    if (diff > 0) {
                        await trx('leave_adjustments').insert({
                            company_id: companyId,
                            employee_id: employeeId,
                            leave_type_id: lt.id,
                            adjustment_type: 'credit',
                            days: diff,
                            reason: 'Initial entitlement assignment during onboarding',
                            created_by: null
                        });
                    } else if (diff < 0) {
                        await trx('leave_adjustments').insert({
                            company_id: companyId,
                            employee_id: employeeId,
                            leave_type_id: lt.id,
                            adjustment_type: 'debit',
                            days: Math.abs(diff),
                            reason: 'Initial entitlement assignment during onboarding',
                            created_by: null
                        });
                    }
                }
            }

            // Fetch company name for email
            const company = await trx('companies').where('id', companyId).select('name').first();
            const companyName = (company ? company.name : 'MyFastHR').replace(' Enterprise', '');

            return { id: employeeId, token: onboardingToken, companyName };
        });

        // 3. Trigger Onboarding Email (Post-Transaction)
        if (result && data.email) {
            const onboardingLink = `${process.env.FRONTEND_URL}/public/onboarding/${result.token}`;
            const fullName = `${data.first_name || ''} ${data.last_name || ''}`.trim() || 'Employee';
            
            // Fire and forget email sending to not block the main flow
            mailService.sendOnboardingEmail(data.email, fullName, onboardingLink, result.companyName)
                .then(success => {
                    if (success) console.log(`>>> [ONBOARDING]: Email automation successful for ${data.email}`);
                    else console.error(`>>> [ONBOARDING]: Email automation failed for ${data.email}`);
                });
        }

        return result.id;
    }

    async getEmployee(id, user) {
        return await employeeRepository.findById(id, user);
    }

    async getManagers(companyId) {
        return await employeeRepository.findAllManagers(companyId);
    }

    async updateEmployee(id, companyId, data, user) {
        const { role_name, initial_leaves, ...employeeData } = data;
        
        return await db.transaction(async (trx) => {
            const currentEmployee = await trx('employees').where({ id, company_id: companyId }).first();
            if (!currentEmployee) {
                throw new Error('Employee not found');
            }

            // If employee_id_number is unchanged, remove it from update payload to prevent duplicate key errors
            if (employeeData.employee_id_number && currentEmployee.employee_id_number === employeeData.employee_id_number) {
                delete employeeData.employee_id_number;
            }

            // If email is unchanged, remove it from update payload to prevent duplicate key errors
            if (employeeData.email && currentEmployee.email === employeeData.email) {
                delete employeeData.email;
            }

            const updated = await employeeRepository.update(id, companyId, employeeData, trx);
            
            // Sync user email if it has changed
            if (employeeData.email) {
                const employee = await trx('employees').where({ id, company_id: companyId }).first();
                if (employee && employee.user_id) {
                    await trx('users').where({ id: employee.user_id }).update({ email: employeeData.email });
                }
            }
            
            if (role_name && ['company_admin', 'super_admin'].includes(user.role_name)) {
                if (['manager', 'employee'].includes(role_name)) {
                    const employee = await trx('employees').where({ id, company_id: companyId }).first();
                    if (employee) {
                        let userId = employee.user_id;
                        if (!userId) {
                            const email = employee.email || employeeData.email;
                            if (email) {
                                const existingUser = await trx('users').where({ email }).first();
                                if (existingUser) {
                                    userId = existingUser.id;
                                    await trx('employees').where({ id }).update({ user_id: userId });
                                } else {
                                    const salt = await bcrypt.genSalt(10);
                                    const passwordHash = await bcrypt.hash(`FAST@${Math.random().toString(36).slice(-5).toUpperCase()}`, salt);
                                    const role = await trx('roles').where({ name: role_name }).first();
                                    const [newUserId] = await trx('users').insert({
                                        company_id: companyId,
                                        email: email,
                                        password_hash: passwordHash,
                                        role_id: role ? role.id : 4,
                                        status: 'active'
                                     });
                                    userId = newUserId;
                                    await trx('employees').where({ id }).update({ user_id: userId });
                                }
                            }
                        }
                        
                        if (userId) {
                            const role = await trx('roles').where({ name: role_name }).first();
                            if (role) {
                                await trx('users').where({ id: userId }).update({ role_id: role.id });
                            }
                        }
                    }
                }
            }

            if (initial_leaves && typeof initial_leaves === 'object') {
                const leaveTypes = await trx('leave_types').where(function() {
                    this.whereNull('company_id').orWhere('company_id', companyId);
                }).andWhere('is_active', true);

                // Fetch current adjustments for this year to calculate current entitlement
                const currentYear = new Date().getFullYear();
                const adjustments = await trx('leave_adjustments')
                    .where({ employee_id: id, company_id: companyId })
                    .andWhereRaw('YEAR(created_at) = ?', [currentYear]);

                for (const lt of leaveTypes) {
                    const assignedDays = Number(initial_leaves[lt.id]);
                    if (isNaN(assignedDays)) continue;

                    const defaultDays = Number(lt.days_per_year);
                    const typeAdjusts = adjustments.filter(a => a.leave_type_id === lt.id);
                    const credits = typeAdjusts.filter(a => a.adjustment_type === 'credit').reduce((acc, curr) => acc + Number(curr.days), 0);
                    const debits = typeAdjusts.filter(a => a.adjustment_type === 'debit').reduce((acc, curr) => acc + Number(curr.days), 0);
                    
                    const currentEntitlement = defaultDays + credits - debits;
                    const diff = assignedDays - currentEntitlement;

                    if (diff > 0) {
                        await trx('leave_adjustments').insert({
                            company_id: companyId,
                            employee_id: id,
                            leave_type_id: lt.id,
                            adjustment_type: 'credit',
                            days: diff,
                            reason: 'Entitlement updated via employee profile edit',
                            created_by: user.id
                        });
                    } else if (diff < 0) {
                        await trx('leave_adjustments').insert({
                            company_id: companyId,
                            employee_id: id,
                            leave_type_id: lt.id,
                            adjustment_type: 'debit',
                            days: Math.abs(diff),
                            reason: 'Entitlement updated via employee profile edit',
                            created_by: user.id
                        });
                    }
                }
            }

            return updated;
        });
    }

    async ensureUserAccount(id, companyId) {
        const employee = await db('employees').where({ id, company_id: companyId }).first();
        if (!employee) throw new Error('Employee not found');
        
        let userId = employee.user_id;
        if (!userId) {
            let email = employee.email;
            if (!email) {
                const prefix = (employee.first_name || 'emp').toLowerCase().replace(/[^a-z0-9]/g, '');
                email = `${prefix || 'emp'}${id}@myfasthr.com`;
                await db('employees').where({ id }).update({ email });
            }
            
            const existingUser = await db('users').where({ email }).first();
            if (existingUser) {
                userId = existingUser.id;
                await db('employees').where({ id }).update({ user_id: userId });
            } else {
                const roleName = 'employee';
                const role = await db('roles').where({ name: roleName }).first();
                const tempPassword = `FAST-${Math.random().toString(36).slice(-6).toUpperCase()}`;
                const salt = await bcrypt.genSalt(10);
                const passwordHash = await bcrypt.hash(tempPassword, salt);
                
                const [newUserId] = await db('users').insert({
                    company_id: companyId,
                    email: email,
                    password_hash: passwordHash,
                    role_id: role ? role.id : 4,
                    status: 'active'
                });
                userId = newUserId;
                await db('employees').where({ id }).update({ user_id: userId });
            }
        }
        return userId;
    }

    async resetEmployeePassword(id, user) {
        const userId = await this.ensureUserAccount(id, user.company_id);
        return await authService.resetPassword(userId);
    }

    async fireEmployee(id, user) {
        await db('employees').where({ id, company_id: user.company_id }).update({ status: 'inactive' });
        const employee = await db('employees').where({ id }).first();
        if (employee.user_id) {
            await db('users').where({ id: employee.user_id }).update({ status: 'inactive' });
        }
    }

    async activateEmployee(id, user) {
        await db('employees').where({ id, company_id: user.company_id }).update({ status: 'active' });
        const employee = await db('employees').where({ id }).first();
        if (employee.user_id) {
            await db('users').where({ id: employee.user_id }).update({ status: 'active' });
        }
    }

    async getOptions(companyId, field) {
        const results = await db('employees')
            .where({ company_id: companyId })
            .distinct(field)
            .whereNotNull(field);
        return results.map(r => r[field]);
    }

    async updateProfilePhoto(id, companyId, photoPath) {
        return await db('employees').where({ id, company_id: companyId }).update({ photo: photoPath });
    }

    async deleteEmployee(id, user) {
        const employee = await db('employees').where({ id, company_id: user.company_id }).first();
        if (!employee) throw new Error('Employee not found');
        
        await db.transaction(async (trx) => {
            if (employee.user_id) {
                await trx('users').where({ id: employee.user_id }).delete();
            }
            await trx('employees').where({ id, company_id: user.company_id }).delete();
        });
    }

    async bulkDeleteEmployees(ids, user) {
        await db.transaction(async (trx) => {
            // Find user_ids first to delete from users table
            const employees = await trx('employees')
                .whereIn('id', ids)
                .where('company_id', user.company_id)
                .select('user_id');
            
            const userIds = employees.map(e => e.user_id).filter(Boolean);
            
            if (userIds.length > 0) {
                await trx('users').whereIn('id', userIds).delete();
            }
            
            await trx('employees')
                .whereIn('id', ids)
                .where('company_id', user.company_id)
                .delete();
        });
    }

    async generateOnboardingToken(id, companyId) {
        const token = `ONB-${Math.random().toString(36).slice(-10).toUpperCase()}`;
        await db('employees').where({ id, company_id: companyId }).update({ 
            onboarding_token: token,
            onboarding_token_created_at: db.fn.now(),
            onboarding_status: 'pending',
            onboarding_filled_fields: JSON.stringify([]) // Reset tracking for new link
        });
        return token;
    }

    async getEmployeeByToken(token) {
        const employee = await db('employees as e')
            .leftJoin('companies as c', 'e.company_id', 'c.id')
            .where('e.onboarding_token', token)
            .select('e.*', 'c.name as company_name')
            .first();
        
        if (employee) {
            // Auto-fix for legacy records missing the creation timestamp
            if (!employee.onboarding_token_created_at) {
                const now = new Date().toISOString();
                await db('employees').where('id', employee.id).update({ 
                    onboarding_token_created_at: db.fn.now() 
                });
                employee.onboarding_token_created_at = now;
            }

            // Parse JSON fields
            try {
                employee.onboarding_filled_fields = employee.onboarding_filled_fields ? 
                    (typeof employee.onboarding_filled_fields === 'string' ? 
                        JSON.parse(employee.onboarding_filled_fields) : 
                        employee.onboarding_filled_fields) : [];
            } catch (e) { employee.onboarding_filled_fields = []; }

            // Include education, courses, and documents
            employee.education = await db('employee_education').where('employee_id', employee.id);
            employee.courses = await db('employee_courses').where('employee_id', employee.id);
            employee.documents = await db('employee_documents').where('employee_id', employee.id);
        }
        return employee;
    }

    async updateOnboardingData(token, data) {
        const employee = await db('employees').where('onboarding_token', token).first();
        if (!employee) throw new Error('Invalid token');

        await db.transaction(async (trx) => {
            // Update main fields
            const mainFields = {};
            const possibleFields = [
                'aadhaar_number', 'pan_number', 'father_name', 'mother_name', 'spouse_name',
                'emergency_contact_name', 'emergency_contact_number', 'emergency_contact_relation',
                'emergency_email', 'emergency_contact_address', 'emergency_city',
                'payment_type', 'bank_name', 'bank_branch', 'account_number', 'ifsc_code', 'dd_payable_at',
                'uan_number', 'pf_excess_contribution',
                'nick_name', 'gender', 'first_name', 'last_name', 'phone', 'email', 'extension',
                'date_of_birth', 'blood_group', 'marital_status', 'marriage_date',
                'nationality', 'residential_status', 'birth_place', 'origin_country', 'religion', 'is_disabled',
                'personal_email', 'height', 'weight', 'id_mark', 'hobby', 'caste',
                'present_address', 'city', 'district', 'state', 'country', 'pincode',
                'permanent_address', 'permanent_city', 'permanent_country', 'permanent_pincode'
            ];
            
            // Check if any of the incoming fields are already finalized
            let filledFields = [];
            try {
                filledFields = employee.onboarding_filled_fields ? 
                    (typeof employee.onboarding_filled_fields === 'string' ? 
                        JSON.parse(employee.onboarding_filled_fields) : 
                        employee.onboarding_filled_fields) : [];
            } catch (e) { filledFields = []; }

            const updatedFields = [];
            possibleFields.forEach(f => {
                if (data[f] !== undefined) {
                    // One-time edit policy check
                    if (filledFields.includes(f)) {
                        console.warn(`>>> [ONBOARDING]: Rejecting update for already finalized field: ${f}`);
                        return; 
                    }
                    
                    let val = data[f];
                    if (f === 'is_disabled') val = val === 'Yes';
                    mainFields[f] = val;
                    updatedFields.push(f);
                }
            });

            if (Object.keys(mainFields).length > 0) {
                const newList = Array.from(new Set([...filledFields, ...updatedFields]));
                mainFields.onboarding_filled_fields = JSON.stringify(newList);

                await trx('employees').where('id', employee.id).update(mainFields);
                console.log(`>>> [ONBOARDING]: Successfully updated and finalized fields: ${updatedFields.join(', ')}`);
            }

            // Handle nested education
            if (data.education && Array.isArray(data.education)) {
                for (const edu of data.education) {
                    if (edu.id) {
                        await trx('employee_education').where({ id: edu.id, employee_id: employee.id }).update(edu);
                    } else {
                        await trx('employee_education').insert({ ...edu, employee_id: employee.id, company_id: employee.company_id });
                    }
                }
            }

            // Handle nested courses
            if (data.courses && Array.isArray(data.courses)) {
                for (const course of data.courses) {
                    if (course.id) {
                        await trx('employee_courses').where({ id: course.id, employee_id: employee.id }).update(course);
                    } else {
                        await trx('employee_courses').insert({ ...course, employee_id: employee.id, company_id: employee.company_id });
                    }
                }
            }
        });

        return true;
    }

    async uploadDocumentByToken(token, file, documentType, customName) {
        const employee = await db('employees').where('onboarding_token', token).first();
        if (!employee) throw new Error('Unauthorized upload attempt.');

        await db('employee_documents').insert({
            employee_id: employee.id,
            company_id: employee.company_id,
            document_type: documentType,
            file_name: file.originalname,
            file_path: file.filename,
            mime_type: file.mimetype,
            file_size: file.size,
            custom_name: customName,
            uploaded_by: 'employee',
            status: 'verified'
        });

        return true;
    }

    async deleteEducationByToken(token, eduId) {
        const employee = await db('employees').where('onboarding_token', token).first();
        if (!employee) throw new Error('Unauthorized.');
        return await db('employee_education').where({ id: eduId, employee_id: employee.id }).delete();
    }

    async deleteCourseByToken(token, courseId) {
        const employee = await db('employees').where('onboarding_token', token).first();
        if (!employee) throw new Error('Unauthorized.');
        return await db('employee_courses').where({ id: courseId, employee_id: employee.id }).delete();
    }

    async deleteDocumentByToken(token, docId) {
        const employee = await db('employees').where('onboarding_token', token).first();
        if (!employee) throw new Error('Unauthorized.');

        console.log(`>>> [DB]: Attempting to delete doc ${docId} for employee ${employee.id}`);

        // Safety: Only allow deleting documents UPLOADED BY EMPLOYEE
        const deletedCount = await db('employee_documents')
            .where({ id: parseInt(docId), employee_id: employee.id, uploaded_by: 'employee' })
            .delete();

        if (deletedCount === 0) {
            console.warn(`>>> [DB]: No matching employee document found or it was an Admin file.`);
        }

        return deletedCount;
    }

    async finalizeOnboardingSection(token, sectionName) {
        const employee = await db('employees').where('onboarding_token', token).first();
        if (!employee) throw new Error('Unauthorized.');

        let filledFields = [];
        try {
            filledFields = typeof employee.onboarding_filled_fields === 'string'
                ? JSON.parse(employee.onboarding_filled_fields)
                : (employee.onboarding_filled_fields || []);
        } catch (e) { filledFields = []; }

        if (!filledFields.includes(sectionName)) {
            filledFields.push(sectionName);
            await db('employees').where('id', employee.id).update({
                onboarding_filled_fields: JSON.stringify(filledFields)
            });
        }
        return true;
    }

    async confirmOnboardingData(token) {
        const employee = await db('employees').where('onboarding_token', token).first();
        if (!employee) throw new Error('Invalid token');

        console.log(`>>> [ONBOARDING]: Confirming submission for Employee ${employee.id}`);
        await db('employees').where('id', employee.id).update({
            onboarding_status: 'submitted'
        });
        console.log(`>>> [ONBOARDING]: Status updated to 'submitted' for Employee ${employee.id}`);
        return true;
    }

    async getPendingOnboarding(companyId, user = {}) {
        console.log(`>>> [ONBOARDING]: Fetching pending for Company ID: ${companyId}`);
        
        let query = db('employees').where('onboarding_status', 'submitted');
        
        // Temporarily comment out for debugging
        /*
        if (user.role_name !== 'super_admin') {
            query = query.where('company_id', companyId);
        }
        */
        
        const results = await query.select('*');
        console.log(`>>> [ONBOARDING]: Found ${results.length} pending records.`);
        return results;
    }

    async approveOnboarding(id, companyId) {
        const employee = await db('employees').where({ id, company_id: companyId }).first();
        if (!employee) throw new Error('Employee not found');

        const company = await db('companies').where('id', companyId).select('name').first();
        const companyName = (company ? company.name : 'MyFastHR').replace(' Enterprise', '');

        return await db.transaction(async (trx) => {
            // 1. Ensure User Account Exists
            let userId = employee.user_id;
            const email = employee.email || employee.personal_email;

            if (!userId && email) {
                const existingUser = await trx('users').where({ email }).first();
                if (existingUser) {
                    userId = existingUser.id;
                } else {
                    const salt = await bcrypt.genSalt(10);
                    const passwordHash = await bcrypt.hash(`FAST@${Math.random().toString(36).slice(-5).toUpperCase()}`, salt);
                    const role = await trx('roles').where({ name: 'employee' }).first();
                    
                    const [newUserId] = await trx('users').insert({
                        company_id: companyId,
                        email: email,
                        password_hash: passwordHash,
                        role_id: role.id,
                        status: 'active'
                    });
                    userId = newUserId;
                }
            } else if (userId && email) {
                // Sync email to users table if it changed during onboarding
                await trx('users').where({ id: userId }).update({ email });
            }

            // 2. Update Employee Status
            await trx('employees').where({ id }).update({
                user_id: userId,
                onboarding_status: 'approved',
                onboarding_token: null,
                status: 'active' // Ensure employee is active
            });

            // 3. Generate Password Setup Link
            const token = authService.generatePasswordSetupToken(userId);
            const setPasswordLink = `${process.env.FRONTEND_URL}/set-password?token=${token}`;
            const fullName = `${employee.first_name} ${employee.last_name}`;

            // 4. Send Approval Email (Template requested by user)
            await mailService.sendApprovalEmail(
                email, 
                fullName, 
                employee.employee_id_number || id, 
                email, 
                setPasswordLink, 
                companyName
            );

            return true;
        });
    }

    async rejectOnboarding(id, companyId, reason) {
        const employee = await db('employees').where({ id, company_id: companyId }).first();
        if (!employee) throw new Error('Employee not found');

        const company = await db('companies').where('id', companyId).select('name').first();
        const companyName = (company ? company.name : 'MyFastHR').replace(' Enterprise', '');

        // Send Rejection Email (requested by user)
        const email = employee.email || employee.personal_email;
        const fullName = `${employee.first_name} ${employee.last_name}`;
        await mailService.sendRejectionEmail(email, fullName, reason, companyName);

        await db.transaction(async (trx) => {
            if (employee.user_id) {
                await trx('users').where({ id: employee.user_id }).delete();
            }
            await trx('employees').where({ id, company_id: companyId }).delete();
            // Also cleanup related data
            await trx('employee_education').where({ employee_id: id }).delete();
            await trx('employee_courses').where({ employee_id: id }).delete();
            await trx('employee_documents').where({ employee_id: id }).delete();
            await trx('employee_assets').where({ employee_id: id }).delete();
        });
        return true;
    }

    async resendOnboarding(id, companyId) {
        const employee = await db('employees').where({ id, company_id: companyId }).first();
        if (!employee) throw new Error('Employee not found');

        const token = `ONB-${Math.random().toString(36).slice(-10).toUpperCase()}`;
        await db('employees').where({ id, company_id: companyId }).update({
            onboarding_token: token,
            onboarding_token_created_at: db.fn.now(),
            onboarding_status: 'pending',
            onboarding_filled_fields: JSON.stringify([]) // Reset edit tracking for the new link session
        });

        const onboardingLink = `${process.env.FRONTEND_URL}/public/onboarding/${token}`;
        const fullName = `${employee.first_name} ${employee.last_name}`;
        
        const company = await db('companies').where('id', companyId).select('name').first();
        const companyName = (company ? company.name : 'MyFastHR').replace(' Enterprise', '');

        await mailService.sendReOnboardingEmail(employee.email || employee.personal_email, fullName, onboardingLink, companyName);
        return token;
    }

    // Asset Management
    async getAssets(employeeId, companyId) {
        return await db('employee_assets').where({ employee_id: employeeId, company_id: companyId });
    }

    async addAsset(employeeId, companyId, data) {
        return await db('employee_assets').insert({ ...data, employee_id: employeeId, company_id: companyId });
    }

    async deleteAsset(assetId, employeeId, companyId) {
        return await db('employee_assets').where({ id: assetId, employee_id: employeeId, company_id: companyId }).delete();
    }

    async updateAsset(assetId, employeeId, companyId, data) {
        return await db('employee_assets').where({ id: assetId, employee_id: employeeId, company_id: companyId }).update(data);
    }

    // Education (Admin)
    async addEducation(employeeId, companyId, data) {
        return await db('employee_education').insert({ ...data, employee_id: employeeId, company_id: companyId });
    }

    async updateEducation(eduId, employeeId, companyId, data) {
        return await db('employee_education').where({ id: eduId, employee_id: employeeId, company_id: companyId }).update(data);
    }

    async deleteEducation(eduId, employeeId, companyId) {
        return await db('employee_education').where({ id: eduId, employee_id: employeeId, company_id: companyId }).delete();
    }

    // Courses (Admin)
    async addCourse(employeeId, companyId, data) {
        return await db('employee_courses').insert({ ...data, employee_id: employeeId, company_id: companyId });
    }

    async updateCourse(courseId, employeeId, companyId, data) {
        return await db('employee_courses').where({ id: courseId, employee_id: employeeId, company_id: companyId }).update(data);
    }

    async deleteCourse(courseId, employeeId, companyId) {
        return await db('employee_courses').where({ id: courseId, employee_id: employeeId, company_id: companyId }).delete();
    }

    async bulkImport(companyId, dataRows) {
        const headerMap = {
            'first name': 'first_name',
            'firstname': 'first_name',
            'first_name': 'first_name',
            
            'last name': 'last_name',
            'lastname': 'last_name',
            'last_name': 'last_name',
            
            'email': 'email',
            'email address': 'email',
            'email_address': 'email',
            
            'employee id': 'employee_id_number',
            'employee code': 'employee_id_number',
            'employee_id_number': 'employee_id_number',
            'employee id number': 'employee_id_number',
            'employee_code': 'employee_id_number',
            
            'designation': 'designation',
            
            'department': 'department',
            'department name': 'department',
            'department_name': 'department',
            
            'shift': 'shift',
            'shift name': 'shift',
            'shift_name': 'shift',
            
            'phone': 'phone',
            'mobile': 'phone',
            'phone number': 'phone',
            'mobile number': 'phone',
            
            'gender': 'gender',
            
            'date of birth': 'date_of_birth',
            'dob': 'date_of_birth',
            'date_of_birth': 'date_of_birth',
            
            'joining date': 'joining_date',
            'joining_date': 'joining_date',
            'date of joining': 'joining_date',

            'location': 'office_location',
            'branch': 'office_location',
            'outlet': 'office_location',
            'office location': 'office_location',
            'office_location': 'office_location',
            'location/outlet': 'office_location',
            'location/branch': 'office_location',
            'location / outlet': 'office_location',
            'location / branch': 'office_location',
            'branch/location/outlet': 'office_location',
            'branch/outlet': 'office_location',
            'branch or outlet': 'office_location',

            // Personal / Parent Names
            'father name': 'father_name',
            'father_name': 'father_name',
            'father\'s name': 'father_name',
            'mother name': 'mother_name',
            'mother_name': 'mother_name',
            'mother\'s name': 'mother_name',
            'spouse name': 'spouse_name',
            'spouse_name': 'spouse_name',
            
            // Identity / Statutory Details
            'aadhaar': 'aadhaar_number',
            'aadhaar number': 'aadhaar_number',
            'aadhaar_number': 'aadhaar_number',
            'aadhar': 'aadhaar_number',
            'aadhar number': 'aadhaar_number',
            'aadhar_number': 'aadhaar_number',
            'pan': 'pan_number',
            'pan number': 'pan_number',
            'pan_number': 'pan_number',
            'uan': 'uan_number',
            'uan number': 'uan_number',
            'uan_number': 'uan_number',
            'pf number': 'pf_number',
            'pf_number': 'pf_number',
            'pf account': 'pf_number',
            'esi number': 'esi_number',
            'esi_number': 'esi_number',
            'esi account': 'esi_number',
            
            'include pf': 'include_pf',
            'include_pf': 'include_pf',
            'pf active': 'include_pf',
            'include esi': 'include_esi',
            'include_esi': 'include_esi',
            'esi active': 'include_esi',
            'include lwf': 'include_lwf',
            'include_lwf': 'include_lwf',
            'lwf active': 'include_lwf',
            'include gratuity': 'include_gratuity',
            'include_gratuity': 'include_gratuity',
            'gratuity active': 'include_gratuity',

            // Bank / Payment Details
            'payment type': 'payment_type',
            'payment_type': 'payment_type',
            'payment mode': 'payment_type',
            'payment_mode': 'payment_type',
            'bank name': 'bank_name',
            'bank_name': 'bank_name',
            'bank branch': 'bank_branch',
            'bank_branch': 'bank_branch',
            'account number': 'account_number',
            'account_number': 'account_number',
            'bank account': 'account_number',
            'bank account number': 'account_number',
            'ifsc': 'ifsc_code',
            'ifsc code': 'ifsc_code',
            'ifsc_code': 'ifsc_code',
            
            // Onboarding Info
            'status': 'status',
            'probation period': 'probation_period',
            'probation_period': 'probation_period',
            'probation days': 'probation_period',
            'confirmation date': 'confirmation_date',
            'confirmation_date': 'confirmation_date',
            
            // Emergency Contacts
            'emergency contact name': 'emergency_contact_name',
            'emergency_contact_name': 'emergency_contact_name',
            'emergency name': 'emergency_contact_name',
            'emergency contact number': 'emergency_contact_number',
            'emergency_contact_number': 'emergency_contact_number',
            'emergency phone': 'emergency_contact_number',
            'emergency mobile': 'emergency_contact_number',

            // Reporting Manager
            'manager': 'manager_value',
            'manager name': 'manager_value',
            'reporting manager': 'manager_value',
            'manager_name': 'manager_value',
            'manager email': 'manager_value',
            'manager_email': 'manager_value',
            'manager id': 'manager_value',
            'manager_id': 'manager_value'
        };

        // Fetch depts, shifts, and active employees to resolve relationship/matching mappings
        const departments = await db('departments').where({ company_id: companyId }).select('id', 'name');
        const shifts = await db('shifts').where({ company_id: companyId }).select('id', 'name');
        const employeesList = await db('employees')
            .where({ company_id: companyId, status: 'active' })
            .select('id', 'first_name', 'last_name', 'email', 'employee_id_number');

        // Helper functions
        const normalizeDate = (d) => {
            if (!d) return null;
            const clean = String(d).trim();
            if (clean === '') return null;

            // 1. YYYY-MM-DD
            if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) return clean;

            // 2. YYYY/MM/DD
            if (/^\d{4}\/\d{2}\/\d{2}$/.test(clean)) {
                return clean.replace(/\//g, '-');
            }

            // 3. DD-MM-YYYY
            if (/^\d{2}-\d{2}-\d{4}$/.test(clean)) {
                const [day, month, year] = clean.split('-');
                return `${year}-${month}-${day}`;
            }

            // 4. DD/MM/YYYY
            if (/^\d{2}\/\d{2}\/\d{4}$/.test(clean)) {
                const [day, month, year] = clean.split('/');
                return `${year}-${month}-${day}`;
            }

            // Fallback JS Date parse
            try {
                const parsed = new Date(clean);
                if (!isNaN(parsed.getTime())) {
                    const y = parsed.getFullYear();
                    const m = String(parsed.getMonth() + 1).padStart(2, '0');
                    const day = String(parsed.getDate()).padStart(2, '0');
                    return `${y}-${m}-${day}`;
                }
            } catch (err) {}

            return null;
        };

        const parseBoolean = (val) => {
            if (!val) return false;
            const str = String(val).trim().toLowerCase();
            return ['yes', 'true', '1', 'y', 'active', 'include'].includes(str);
        };

        const resolveManager = (value) => {
            if (!value) return null;
            const valStr = String(value).trim().toLowerCase();
            if (valStr === '') return null;

            // Match by employee ID number
            let match = employeesList.find(e => e.employee_id_number && e.employee_id_number.trim().toLowerCase() === valStr);
            if (match) return match.id;

            // Match by email
            match = employeesList.find(e => e.email && e.email.trim().toLowerCase() === valStr);
            if (match) return match.id;

            // Match by full name (first_name + last_name)
            match = employeesList.find(e => {
                const fullName = `${e.first_name || ''} ${e.last_name || ''}`.trim().toLowerCase();
                return fullName === valStr;
            });
            if (match) return match.id;

            // Match by first name
            match = employeesList.find(e => e.first_name && e.first_name.trim().toLowerCase() === valStr);
            if (match) return match.id;

            return null;
        };

        let successCount = 0;
        let failedCount = 0;
        const errors = [];
        const processedEmails = new Set();

        for (const rowObj of dataRows) {
            const { rowIndex, data: rawData } = rowObj;
            
            try {
                // Skip empty rows with no data
                const hasAnyData = Object.values(rawData).some(val => val && val.trim() !== '');
                if (!hasAnyData) {
                    continue;
                }

                // Map the keys using headerMap
                const employeeData = {};
                Object.keys(rawData).forEach(key => {
                    const normalizedKey = key.trim().toLowerCase();
                    const targetKey = headerMap[normalizedKey];
                    if (targetKey) {
                        employeeData[targetKey] = rawData[key];
                    }
                });

                // Auto-detect and fix shifted columns (e.g. Phone number ends up in office_location, Gender in phone, Location in date fields)
                const originalLoc = (employeeData.office_location || '').trim();
                const originalPhone = (employeeData.phone || '').trim();
                
                const isLocPhone = /^\d{8,12}$/.test(originalLoc);
                const isPhoneGen = ['male', 'female'].includes(originalPhone.toLowerCase());

                if (isLocPhone || isPhoneGen) {
                    if (isPhoneGen) {
                        employeeData.gender = originalPhone;
                    }
                    if (isLocPhone) {
                        employeeData.phone = originalLoc;
                    }

                    // Find where the location ("lhs", "rhs", etc.) was misplaced in rawData
                    let detectedLocation = null;
                    Object.keys(rawData).forEach(k => {
                        const val = rawData[k];
                        if (val && typeof val === 'string') {
                            const lowerVal = val.toLowerCase().trim();
                            if (lowerVal === 'lhs' || lowerVal === 'rhs' || lowerVal.includes('rhs/') || lowerVal.includes('lhs/') || lowerVal.includes('/lhs') || lowerVal.includes('/rhs') || lowerVal.includes(' lhs') || lowerVal.includes(' rhs')) {
                                detectedLocation = val.trim();
                            }
                        }
                    });

                    if (detectedLocation) {
                        employeeData.office_location = detectedLocation;
                    } else {
                        employeeData.office_location = 'Rhs';
                    }

                    // Shift dates: The joining date was shifted to date_of_birth column
                    if (employeeData.date_of_birth) {
                        employeeData.joining_date = employeeData.date_of_birth;
                        employeeData.date_of_birth = null;
                    }
                }

                // Clean and normalize names
                employeeData.first_name = (employeeData.first_name || '').trim();
                employeeData.last_name = (employeeData.last_name || '').trim();
                employeeData.employee_id_number = (employeeData.employee_id_number || '').trim();

                // Validate mandatory fields: only employee name and employee ID
                if (!employeeData.first_name) {
                    throw new Error('Employee Name (First Name) is missing or empty.');
                }
                if (!employeeData.employee_id_number) {
                    throw new Error('Employee ID is missing or empty.');
                }

                employeeData.designation = (employeeData.designation || 'Staff').trim() || 'Staff';

                // Normalize email to null if empty
                if (employeeData.email) {
                    employeeData.email = employeeData.email.trim();
                    if (employeeData.email === '') {
                        employeeData.email = null;
                    }
                } else {
                    employeeData.email = null;
                }

                // Only run email checks if email is provided
                if (employeeData.email) {
                    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                    if (!emailRegex.test(employeeData.email)) {
                        throw new Error(`Invalid email format: ${employeeData.email}`);
                    }

                    const emailLower = employeeData.email.toLowerCase();
                    if (processedEmails.has(emailLower)) {
                        throw new Error(`Duplicate email in CSV file: ${employeeData.email}`);
                    }
                    processedEmails.add(emailLower);

                    const activeEmployee = await db('employees')
                        .where({ email: employeeData.email, status: 'active', company_id: companyId })
                        .first();
                    if (activeEmployee) {
                        throw new Error(`Active employee with this email already exists: ${employeeData.email}`);
                    }
                }

                // Parse dates safely
                employeeData.date_of_birth = normalizeDate(employeeData.date_of_birth);
                employeeData.joining_date = normalizeDate(employeeData.joining_date);
                employeeData.confirmation_date = normalizeDate(employeeData.confirmation_date);

                // Parse booleans safely
                employeeData.include_pf = parseBoolean(employeeData.include_pf);
                employeeData.include_esi = parseBoolean(employeeData.include_esi);
                employeeData.include_lwf = parseBoolean(employeeData.include_lwf);
                employeeData.include_gratuity = parseBoolean(employeeData.include_gratuity);

                // Resolve Reporting Manager relationship
                if (employeeData.manager_value) {
                    const resolvedManagerId = resolveManager(employeeData.manager_value);
                    if (resolvedManagerId) {
                        employeeData.manager_id = resolvedManagerId;
                    }
                    delete employeeData.manager_value;
                }

                // Resolve department (Create on the fly if not exists)
                if (employeeData.department) {
                    const deptName = employeeData.department.trim();
                    if (deptName !== '') {
                        let matchedDept = departments.find(d => d.name.trim().toLowerCase() === deptName.toLowerCase());
                        if (!matchedDept) {
                            const [newDeptId] = await db('departments').insert({
                                company_id: companyId,
                                name: deptName
                            });
                            matchedDept = { id: newDeptId, name: deptName };
                            departments.push(matchedDept);
                            console.log(`>>> [BULK-IMPORT]: Created new department "${deptName}" with ID ${newDeptId}`);
                        }
                        employeeData.department_id = matchedDept.id;
                        employeeData.department = matchedDept.name;
                    }
                }

                // Resolve shift
                if (employeeData.shift) {
                    const shiftName = employeeData.shift;
                    const matchedShift = shifts.find(s => s.name.trim().toLowerCase() === shiftName.trim().toLowerCase());
                    if (matchedShift) {
                        employeeData.shift_id = matchedShift.id;
                        employeeData.shift = matchedShift.name;
                    }
                }

                // Call addEmployee to trigger user account, database record, and onboarding email!
                await this.addEmployee(companyId, employeeData);
                successCount++;
            } catch (rowError) {
                failedCount++;
                let errorMsg = rowError.sqlMessage || rowError.message || 'Unknown database error';
                if (errorMsg.includes(' - ') && errorMsg.includes('insert into')) {
                    errorMsg = errorMsg.split(' - ').pop();
                }
                errorMsg = errorMsg.replace(/^error:\s*/i, '');

                // Format duplicate database entry errors to be human readable
                if (errorMsg.includes('Duplicate entry')) {
                    const match = errorMsg.match(/Duplicate entry '(.*?)' for key '(.*?)'/i);
                    if (match) {
                        const val = match[1];
                        const key = match[2];
                        if (key.includes('employee_id_number')) {
                            errorMsg = `Employee ID '${val}' is already assigned to another employee.`;
                        } else if (key.includes('email')) {
                            errorMsg = `Email '${val}' is already registered.`;
                        } else if (key.includes('phone')) {
                            errorMsg = `Phone number '${val}' is already registered.`;
                        } else {
                            errorMsg = `'${val}' is already registered in the system (Duplicate Entry).`;
                        }
                    }
                }

                // Resolve a human friendly identifier (Name or Email) for display
                const firstNameVal = rawData['first name'] || rawData['firstname'] || rawData['first_name'] || '';
                const lastNameVal = rawData['last name'] || rawData['lastname'] || rawData['last_name'] || '';
                const fullName = `${firstNameVal} ${lastNameVal}`.trim();
                const empIdentifier = fullName ? fullName : (rawData.email || rawData['email address'] || rawData['email_address'] || 'No Name/Email');

                errors.push(`Row ${rowIndex} (${empIdentifier}): ${errorMsg}`);
            }
        }

        return { successCount, failedCount, errors };
    }

    async updateStatutorySettings(id, companyId, data) {
        const updateData = {};
        if (data.include_pf !== undefined) updateData.include_pf = data.include_pf ? 1 : 0;
        if (data.include_esi !== undefined) updateData.include_esi = data.include_esi ? 1 : 0;
        if (data.include_lwf !== undefined) updateData.include_lwf = data.include_lwf ? 1 : 0;
        if (data.include_gratuity !== undefined) updateData.include_gratuity = data.include_gratuity ? 1 : 0;

        return await db('employees')
            .where({ id, company_id: companyId })
            .update(updateData);
    }
}

module.exports = new EmployeeService();
