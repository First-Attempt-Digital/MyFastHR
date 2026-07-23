const roleRepository = require('../repositories/roleRepository');
const workingRulesRepository = require('../repositories/workingRulesRepository');
const holidayRepository = require('../repositories/holidayRepository');
const db = require('../config/db');

async function getResolveCompanyId(req) {
    let companyId = req.company_id || (req.user ? req.user.company_id : null);
    if (!companyId || companyId === 1) {
        const companyExists = companyId ? await db('companies').where({ id: companyId }).first() : null;
        if (!companyExists) {
            const firstCompany = await db('companies').orderBy('id', 'asc').first();
            return firstCompany ? firstCompany.id : 1;
        }
    }
    return companyId;
}

async function resolveCompanyIdFromUrl(url) {
    if (!url) return null;
    let cleanPath = url.split('?')[0]; // Remove query params
    if (cleanPath.startsWith('http://') || cleanPath.startsWith('https://')) {
        try {
            const urlObj = new URL(cleanPath);
            cleanPath = urlObj.pathname;
        } catch (e) {
            // ignore
        }
    }
    const parts = cleanPath.split('/');
    const cleanParts = parts.filter(p => p && p !== 'api');
    const resourceType = cleanParts[0];
    const resourceId = cleanParts[1];
    
    if (resourceId && !isNaN(resourceId)) {
        try {
            if (resourceType === 'employees') {
                const emp = await db('employees').where({ id: resourceId }).first();
                if (emp) return emp.company_id;
            } else if (resourceType === 'leaves') {
                const lv = await db('leaves').where({ id: resourceId }).first();
                if (lv) return lv.company_id;
            } else if (resourceType === 'departments' || resourceType === 'org') {
                const dept = await db('departments').where({ id: resourceId }).first();
                if (dept) return dept.company_id;
            } else if (resourceType === 'holidays' || resourceType === 'settings') {
                const hol = await db('holidays').where({ id: resourceId }).first();
                if (hol) return hol.company_id;
            } else if (resourceType === 'companies') {
                return parseInt(resourceId);
            }
        } catch (err) {
            console.error('Error resolving company ID from URL in SettingsController:', err);
        }
    }
    return null;
}

class SettingsController {
    async getRoleMatrix(req, res) {
        try {
            const companyId = await getResolveCompanyId(req);
            
            // 1. Get all roles relevant to company (NULL or current company)
            // Filter: Only Company Admin can manage Manager and Employee roles
            let roles = await roleRepository.findAll(companyId);
            roles = roles.filter(r => ['manager', 'employee'].includes(r.name));

            // 2. Get all system permissions
            const allPermissions = await roleRepository.findAllPermissions();

            // 3. For each role, get its current permissions
            const matrix = await Promise.all(roles.map(async (role) => {
                const permissionIds = await roleRepository.findRolePermissions(role.id, companyId);
                return {
                    id: role.id,
                    name: role.name,
                    permissions: permissionIds
                };
            }));

            res.json({
                roles: matrix,
                allPermissions: allPermissions
            });
        } catch (err) {
            res.status(500).json({ message: err.message });
        }
    }

    async updatePermissions(req, res) {
        try {
            const { roleId, permissionIds } = req.body;
            const companyId = await getResolveCompanyId(req);

            // Security Check: Only allow editing non-admin roles for the company context
            // We'll fetch the role to ensure it's not a super_admin or company_admin
            const role = await db('roles').where({ id: roleId }).first();
            
            if (role && ['super_admin', 'company_admin'].includes(role.name)) {
                return res.status(403).json({ message: 'Security Breach: System core roles are immutable.' });
            }

            await roleRepository.updatePermissions(roleId, permissionIds, companyId);
            res.json({ message: 'Role permissions synchronized successfully.' });
        } catch (err) {
            res.status(500).json({ message: err.message });
        }
    }

    async getWorkingRules(req, res) {
        try {
            const companyId = await getResolveCompanyId(req);

            const rules = await workingRulesRepository.findByCompany(companyId);
            
            // Return defaults if not set
            res.json(rules || {
                shift_start: '09:00',
                shift_end: '18:00',
                grace_period: 15,
                weekoffs: [],
                half_day_hours: 4,
                late_marks_for_half_day: 3,
                max_late_allowed: 3,
                late_deduction_type: 'half_day',
                late_deduction_value: 0,
                late_penalty_effective_date: null,
                ot_enabled: false,
                ot_min_minutes: 60,
                ot_rate_multiplier: 1.5,
                max_missed_punches: 2
            });
        } catch (err) {
            res.status(500).json({ message: err.message });
        }
    }

    async updateWorkingRules(req, res) {
        try {
            const companyId = await getResolveCompanyId(req);

            await workingRulesRepository.upsert(companyId, req.body);
            res.json({ message: 'Business policies updated successfully.' });
        } catch (err) {
            res.status(500).json({ message: err.message });
        }
    }

    async getHolidays(req, res) {
        try {
            const { month, year } = req.query;
            const companyId = await getResolveCompanyId(req);
            const holidays = await holidayRepository.getByMonth(companyId, month, year, req.user);
            res.json(holidays);
        } catch (err) {
            res.status(500).json({ message: err.message });
        }
    }

    async addHoliday(req, res) {
        try {
            const { name, date, type, location } = req.body;
            const companyId = await getResolveCompanyId(req);
            await holidayRepository.add(companyId, name, date, type, req.user.id, location);
            res.json({ message: 'Holiday added successfully' });
        } catch (err) {
            res.status(500).json({ message: err.message });
        }
    }

    async deleteHoliday(req, res) {
        try {
            const { id } = req.params;
            const companyId = await getResolveCompanyId(req);
            await holidayRepository.delete(id, companyId);
            res.json({ message: 'Holiday deleted' });
        } catch (err) {
            res.status(500).json({ message: err.message });
        }
    }

    async updateHoliday(req, res) {
        try {
            const { id } = req.params;
            const { name, date, type, location } = req.body;
            const companyId = await getResolveCompanyId(req);
            await holidayRepository.update(id, companyId, { name, date, type, location });
            res.json({ message: 'Holiday updated successfully' });
        } catch (err) {
            res.status(500).json({ message: err.message });
        }
    }

    async getNumberSeries(req, res) {
        try {
            const companyId = await getResolveCompanyId(req);
            
            // 1. Ensure Table Exists
            const hasTable = await db.schema.hasTable('employee_number_series');
            if (!hasTable) {
                console.log('[INIT]: Creating employee_number_series table...');
                await db.schema.createTable('employee_number_series', table => {
                    table.increments('id').primary();
                    table.integer('company_id').nullable();
                    table.string('name').notNullable();
                    table.string('prefix').defaultTo('');
                    table.string('suffix').defaultTo('');
                    table.integer('current_number').defaultTo(0);
                    table.integer('padding').defaultTo(4);
                    table.string('format').defaultTo('{prefix}{number}');
                    table.boolean('is_active').defaultTo(true);
                    table.timestamps(true, true);
                });
            }

            // 2. Ensure Column in Employees exists
            try {
                const hasColumn = await db.schema.hasColumn('employees', 'number_series');
                if (!hasColumn) {
                    await db.schema.table('employees', table => {
                        table.string('number_series').nullable();
                    });
                }
            } catch (colErr) {
                console.error('[INIT]: Column sync error:', colErr.message);
            }
            
            // 3. Seed if empty for this company
            const seriesCount = await db('employee_number_series')
                .where({ company_id: companyId })
                .count('id as count')
                .first();
            
            const actualCount = seriesCount ? (seriesCount.count || 0) : 0;

            if (actualCount === 0) {
                console.log('[INIT]: Seeding default series for CID:', companyId);
                await db('employee_number_series').insert([
                    { company_id: companyId, name: 'Permanent Employees', prefix: 'P', padding: 8, format: 'P{number}' },
                    { company_id: companyId, name: 'Temporary Employees', prefix: 'T', padding: 8, format: 'T{number}' },
                    { company_id: companyId, name: 'Manual Entry', prefix: '', padding: 0, format: '{number}' }
                ]);
            }
            
            let series = await db('employee_number_series')
                .where({ company_id: companyId });

            // If still empty (e.g. companyId issue), get any available or use hardcoded defaults
            if (series.length === 0) {
                series = await db('employee_number_series').limit(3);
            }
            
            const results = await Promise.all(series.map(async (s) => {
                const countResult = await db('employees')
                    .where({ company_id: companyId, number_series: s.name })
                    .count('id as count')
                    .first();
                
                return {
                    ...s,
                    current_count: countResult ? (countResult.count || 0) : 0
                };
            }));
            
            res.json(results);
        } catch (err) {
            console.error('getNumberSeries Fatal Error:', err);
            // Emergency fallback to prevent empty UI
            res.json([
                { id: 999, name: 'Permanent Employees', prefix: 'P', padding: 8, format: 'P{number}', current_count: 0 },
                { id: 998, name: 'Temporary Employees', prefix: 'T', padding: 8, format: 'T{number}', current_count: 0 },
                { id: 997, name: 'Manual Entry', prefix: '', padding: 0, format: '{number}', current_count: 0 }
            ]);
        }
    }

    async updateNumberSeries(req, res) {
        const { id } = req.params;
        try {
            const companyId = await getResolveCompanyId(req);
            
            const updateData = {
                prefix: req.body.prefix || '',
                padding: parseInt(req.body.padding) || 0,
                format: req.body.format || '{prefix}{number}',
                updated_at: db.fn.now()
            };

            // If a custom starting number was provided
            if (req.body.current_number !== undefined) {
                updateData.current_number = parseInt(req.body.current_number) || 0;
            }
            
            // Check if it's one of our fallback IDs
            if (parseInt(id) > 900) {
                const { name } = req.body;
                const realSeries = await db('employee_number_series')
                    .where({ company_id: companyId, name })
                    .first();
                
                if (realSeries) {
                    await db('employee_number_series')
                        .where({ id: realSeries.id })
                        .update(updateData);
                } else {
                    await db('employee_number_series').insert({
                        company_id: companyId,
                        name: req.body.name,
                        ...updateData
                    });
                }
            } else {
                await db('employee_number_series')
                    .where({ id, company_id: companyId })
                    .update(updateData);
            }
            
            res.json({ message: 'Series updated successfully' });
        } catch (err) {
            console.error('updateNumberSeries Fatal Error:', err);
            res.status(500).json({ message: err.message });
        }
    }

    async verifyDeleteKey(req, res) {
        try {
            const { key, pin, url } = req.body;
            const inputKey = key || pin;

            if (!inputKey) {
                return res.status(400).json({ message: 'Security key is required' });
            }

            let companyId = req.company_id || (req.user ? req.user.company_id : null);
            const isSuperAdmin = req.user && req.user.role_name === 'super_admin';
            
            // Resolve company context from resource URL if available
            if ((!companyId || isSuperAdmin) && url) {
                const resolvedId = await resolveCompanyIdFromUrl(url);
                if (resolvedId) {
                    companyId = resolvedId;
                }
            }

            // Fetch the platform global key (no hardcoded default — unconfigured must fail closed)
            let globalKey = null;
            const globalKeySetting = await db('system_settings').where({ key_name: 'global_delete_security_key' }).first();
            if (globalKeySetting && globalKeySetting.value_text) {
                globalKey = globalKeySetting.value_text;
            }

            // If super admin and verifying their own configuration key (no URL context)
            if (isSuperAdmin && !url) {
                if (!globalKey) {
                    return res.status(400).json({ code: 'DELETE_KEY_NOT_CONFIGURED', message: 'No platform delete security key is configured. Set one before verifying.' });
                }
                if (globalKey !== inputKey) {
                    return res.status(400).json({ message: 'Invalid delete security key' });
                }
                return res.json({ success: true, message: 'Security key verified successfully' });
            }

            if (!companyId || companyId === 1) {
                const firstCompany = await db('companies').orderBy('id', 'asc').first();
                companyId = firstCompany ? firstCompany.id : 1;
            }

            const company = await db('companies').where({ id: companyId }).first();
            const companyKey = company && company.delete_security_key ? company.delete_security_key : null;

            // Fail closed if neither a company key nor (for super admins) a global key is configured.
            if (!companyKey && !(isSuperAdmin && globalKey)) {
                return res.status(400).json({ code: 'DELETE_KEY_NOT_CONFIGURED', message: 'No delete security key is configured for this company. Set one in Settings first.' });
            }

            // Super admins are allowed to verify using either the specific company key OR the global master key
            const isMatched = (!!companyKey && companyKey === inputKey) || (isSuperAdmin && !!globalKey && globalKey === inputKey);

            if (!isMatched) {
                return res.status(400).json({ message: 'Invalid delete security key' });
            }

            res.json({ success: true, message: 'Security key verified successfully' });
        } catch (err) {
            res.status(500).json({ message: err.message });
        }
    }

    async updateDeleteKey(req, res) {
        try {
            const { oldKey, newKey } = req.body;

            if (!oldKey || !newKey) {
                return res.status(400).json({ message: 'Both current key and new key are required' });
            }

            if (!/^\d{6}$/.test(newKey)) {
                return res.status(400).json({ message: 'New key must be a 6-digit numeric code' });
            }

            if (req.user.role_name === 'super_admin') {
                // Super admin updating global delete security key
                const globalKeySetting = await db('system_settings').where({ key_name: 'global_delete_security_key' }).first();
                const expectedKey = globalKeySetting && globalKeySetting.value_text ? globalKeySetting.value_text : null;

                // If a key already exists, require the correct current key. If none is
                // configured yet, allow first-time setup (no hardcoded default to match).
                if (expectedKey && expectedKey !== oldKey) {
                    return res.status(400).json({ message: 'Current security key is incorrect' });
                }

                if (globalKeySetting) {
                    await db('system_settings').where({ key_name: 'global_delete_security_key' }).update({
                        value_text: newKey,
                        updated_at: db.fn.now()
                    });
                } else {
                    await db('system_settings').insert({
                        key_name: 'global_delete_security_key',
                        value_text: newKey,
                        created_at: db.fn.now(),
                        updated_at: db.fn.now()
                    });
                }

                return res.json({ success: true, message: 'Platform delete security key updated successfully' });
            }

            if (req.user.role_name !== 'company_admin') {
                return res.status(403).json({ message: 'Only the company administrator can modify the delete security key.' });
            }

            const companyId = req.user.company_id;
            const company = await db('companies').where({ id: companyId }).first();

            if (!company) {
                return res.status(404).json({ message: 'Company not found' });
            }

            // If a key already exists, require the correct current key; otherwise allow first-time setup.
            if (company.delete_security_key && company.delete_security_key !== oldKey) {
                return res.status(400).json({ message: 'Current security key is incorrect' });
            }

            await db('companies').where({ id: companyId }).update({
                delete_security_key: newKey,
                updated_at: db.fn.now()
            });

            res.json({ success: true, message: 'Security key updated successfully' });
        } catch (err) {
            res.status(500).json({ message: err.message });
        }
    }

    async requestDeleteKeyReset(req, res) {
        try {
            const jwt = require('jsonwebtoken');
            const mailService = require('../services/mailService');

            if (req.user.role_name === 'super_admin') {
                // Request reset for super admin global key
                const adminEmail = req.user.email || 'superadmin@myfasthr.com';
                const token = jwt.sign(
                    { purpose: 'reset_global_delete_key' },
                    process.env.JWT_SECRET,
                    { expiresIn: '1h' }
                );
                const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
                const resetLink = `${frontendUrl}/settings?reset_delete_key_token=${token}`;

                const emailSent = await mailService.sendDeleteKeyResetEmail(
                    adminEmail,
                    'Super Administrator',
                    resetLink,
                    'Platform Admin'
                );

                if (!emailSent) {
                    return res.status(500).json({ message: 'Failed to send verification email' });
                }

                return res.json({ success: true, message: `Verification email sent to super admin: ${adminEmail}` });
            }

            if (req.user.role_name !== 'company_admin') {
                return res.status(403).json({ message: 'Only the company administrator can request a delete key reset.' });
            }

            const companyId = req.user.company_id;
            const company = await db('companies').where({ id: companyId }).first();
            if (!company) {
                return res.status(404).json({ message: 'Company not found' });
            }

            // Find an admin email
            let adminEmail = null;
            let adminName = 'Administrator';

            if (req.user && req.user.role_name === 'company_admin') {
                const user = await db('users').where({ id: req.user.id }).first();
                if (user) {
                    adminEmail = user.email;
                }
            }

            if (!adminEmail) {
                const adminUser = await db('users')
                    .join('roles', 'users.role_id', '=', 'roles.id')
                    .where('users.company_id', companyId)
                    .andWhere('roles.name', 'company_admin')
                    .select('users.email')
                    .first();
                
                if (adminUser) {
                    adminEmail = adminUser.email;
                }
            }

            // Fallback to current logged in user email if no admin found
            if (!adminEmail && req.user) {
                const currentUser = await db('users').where({ id: req.user.id }).first();
                if (currentUser) {
                    adminEmail = currentUser.email;
                }
            }

            if (!adminEmail) {
                return res.status(400).json({ message: 'No registered administrator email found for this company' });
            }

            // Find name from employees
            const employee = await db('employees').where({ company_id: companyId, email: adminEmail }).first();
            if (employee) {
                adminName = `${employee.first_name} ${employee.last_name}`;
            }

            const token = jwt.sign(
                { company_id: companyId, purpose: 'reset_delete_key' },
                process.env.JWT_SECRET,
                { expiresIn: '1h' }
            );

            const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
            const resetLink = `${frontendUrl}/settings?reset_delete_key_token=${token}`;

            const emailSent = await mailService.sendDeleteKeyResetEmail(
                adminEmail,
                adminName,
                resetLink,
                company.name
            );

            if (!emailSent) {
                return res.status(500).json({ message: 'Failed to send verification email' });
            }

            res.json({ success: true, message: `Verification email sent to admin: ${adminEmail}` });
        } catch (err) {
            res.status(500).json({ message: err.message });
        }
    }

    async resetDeleteKey(req, res) {
        try {
            const { token, newKey } = req.body;

            if (!token || !newKey) {
                return res.status(400).json({ message: 'Token and new key are required' });
            }

            if (!/^\d{6}$/.test(newKey)) {
                return res.status(400).json({ message: 'New key must be a 6-digit numeric code' });
            }

            const jwt = require('jsonwebtoken');

            let decoded;
            try {
                decoded = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] });
            } catch (jwtErr) {
                return res.status(401).json({ message: 'Invalid or expired reset token' });
            }

            if (decoded.purpose === 'reset_global_delete_key') {
                const globalKeySetting = await db('system_settings').where({ key_name: 'global_delete_security_key' }).first();
                if (globalKeySetting) {
                    await db('system_settings').where({ key_name: 'global_delete_security_key' }).update({
                        value_text: newKey,
                        updated_at: db.fn.now()
                    });
                } else {
                    await db('system_settings').insert({
                        key_name: 'global_delete_security_key',
                        value_text: newKey,
                        created_at: db.fn.now(),
                        updated_at: db.fn.now()
                    });
                }
                return res.json({ success: true, message: 'Platform delete security key reset successfully' });
            }

            if (decoded.purpose !== 'reset_delete_key') {
                return res.status(400).json({ message: 'Invalid token purpose' });
            }

            const companyId = decoded.company_id;
            const company = await db('companies').where({ id: companyId }).first();
            if (!company) {
                return res.status(404).json({ message: 'Company not found' });
            }

            await db('companies').where({ id: companyId }).update({
                delete_security_key: newKey,
                updated_at: db.fn.now()
            });

            res.json({ success: true, message: 'Security key reset successfully' });
        } catch (err) {
            res.status(500).json({ message: err.message });
        }
    }
}

module.exports = new SettingsController();
