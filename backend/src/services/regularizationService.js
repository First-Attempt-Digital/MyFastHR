const db = require('../config/db');
const notificationService = require('./notificationService');

/**
 * Resolves the tenant a request must be scoped to.
 * `companyId` comes from tenantFilter (req.company_id), which already honours
 * super_admin impersonation via ?company_id=. Falls back to the JWT claim so
 * callers that don't pass it keep working. Null means "unscoped super_admin".
 */
const resolveScope = (user, companyId) => {
    const scoped = companyId || user.company_id || null;
    const isSuperAdmin = user.role_name === 'super_admin';
    // super_admin has always had unfiltered reach on updateStatus; narrowing that would
    // break approvals for any super_admin whose users row carries a non-null company_id.
    // It is only pinned when it is explicitly impersonating a *different* tenant.
    const impersonating = isSuperAdmin && !!companyId && companyId !== user.company_id;
    return { scoped, isGlobal: isSuperAdmin && !impersonating };
};

class RegularizationService {
    async applyRegularization(user, data, companyId) {
        const { date, check_in, check_out, reason, regularization_type } = data;
        if (!date || !reason) throw new Error('Date and Reason are required');

        // Resolve employee ID
        const employee = await db('employees').where({ user_id: user.id }).first();
        if (!employee) throw new Error('Employee record not found');

        // Check if there is already a pending regularization for this date
        const existingPending = await db('attendance_regularizations')
            .where({ employee_id: employee.id, date, status: 'pending' })
            .first();
        if (existingPending) {
            throw new Error('A pending regularization request already exists for this date.');
        }

        // The employee row is the authoritative tenant for this request — user.company_id
        // is null for super_admin, which used to persist rows with company_id = NULL that
        // listReviewRequests could then never match.
        const requestCompanyId = employee.company_id || companyId || user.company_id;

        // Insert regularization request
        const [id] = await db('attendance_regularizations').insert({
            employee_id: employee.id,
            company_id: requestCompanyId,
            date,
            check_in: check_in || null,
            check_out: check_out || null,
            reason,
            status: 'pending',
            regularization_type: regularization_type || 'full_day',
            created_at: db.fn.now(),
            updated_at: db.fn.now()
        });

        // Notify Manager and Admin
        try {
            const recipientUsers = [];
            
            // Add manager
            if (employee.manager_id) {
                const manager = await db('employees').where('id', employee.manager_id).first();
                if (manager && manager.user_id) recipientUsers.push(manager.user_id);
            }

            // Add admins
            const admins = await db('users')
                .join('roles', 'users.role_id', 'roles.id')
                .where('users.company_id', requestCompanyId)
                .whereIn('roles.name', ['company_admin', 'super_admin'])
                .select('users.id as id');

            admins.forEach(a => {
                if (!recipientUsers.includes(a.id)) {
                    recipientUsers.push(a.id);
                }
            });

            for (const rId of recipientUsers) {
                await notificationService.createNotification(
                    rId,
                    requestCompanyId,
                    'Regularization Request',
                    `${employee.first_name} requested attendance regularization for ${date}.`,
                    'info'
                );
            }
        } catch (err) {
            console.error('Regularization notification failed', err);
        }

        return id;
    }

    async listMyRequests(user) {
        const employee = await db('employees').where({ user_id: user.id }).first();
        if (!employee) return [];

        return await db('attendance_regularizations')
            .where({ employee_id: employee.id })
            .orderBy('date', 'desc');
    }

    async listReviewRequests(user, companyId) {
        const employee = await db('employees').where({ user_id: user.id }).first();
        const isAdmin = ['company_admin', 'super_admin'].includes(user.role_name);
        const { scoped } = resolveScope(user, companyId);

        // Deliberately ALWAYS filtered, with the same call shape as before — this list has no
        // status filter and no LIMIT, so letting an unimpersonating super_admin through
        // unscoped would return every regularization row of every tenant, on a screen whose
        // rows carry no company column (RegularizationView renders the whole array). The fix
        // here is only that `scoped` now honours super_admin's ?company_id= impersonation,
        // which user.company_id silently ignored.
        let query = db('attendance_regularizations as r')
            .join('employees as e', 'r.employee_id', 'e.id')
            .where('r.company_id', scoped);

        if (!isAdmin) {
            // Manager role: can see requests of subordinates
            if (!employee) return [];
            query = query.where('e.manager_id', employee.id);
        }

        return await query.select(
            'r.*',
            'e.first_name',
            'e.last_name',
            'e.employee_id_number as employee_code'
        ).orderBy('r.created_at', 'desc');
    }

    async updateStatus(id, user, status, companyId) {
        if (!['approved', 'rejected'].includes(status)) {
            throw new Error('Invalid status value');
        }

        const { scoped, isGlobal } = resolveScope(user, companyId);

        // Tenant scoping: without this a company_admin could approve/reject any request id,
        // and approving writes an attendance row for the *other* tenant's employee.
        // The admin branch below skips the manager-ownership check, so this query was the
        // only thing standing between an id guess and a cross-tenant write.
        let requestQuery = db('attendance_regularizations').where({ id });
        if (!isGlobal) {
            requestQuery = requestQuery.andWhere({ company_id: scoped });
        }
        const request = await requestQuery.first();
        if (!request) throw new Error('Regularization request not found');

        const isAdmin = ['company_admin', 'super_admin'].includes(user.role_name);
        const employee = await db('employees').where({ user_id: user.id }).first();

        if (!isAdmin) {
            // Manager check
            const targetEmployee = await db('employees').where({ id: request.employee_id }).first();
            if (!targetEmployee || !employee || targetEmployee.manager_id !== employee.id) {
                throw new Error('Unauthorized to approve this request');
            }
        }

        // Status flip + attendance upsert must be all-or-nothing: previously a failure in the
        // upsert left the request marked 'approved' with no attendance record behind it.
        await db.transaction(async (trx) => {
            // Update regularization request status
            await trx('attendance_regularizations')
                .where({ id })
                .update({
                    status,
                    approved_by: user.id,
                    updated_at: trx.fn.now()
                });

            // If approved, upsert attendance record
            if (status !== 'approved') return;

            let dateStr = request.date;
            if (dateStr instanceof Date) {
                const year = dateStr.getFullYear();
                const month = String(dateStr.getMonth() + 1).padStart(2, '0');
                const day = String(dateStr.getDate()).padStart(2, '0');
                dateStr = `${year}-${month}-${day}`;
            } else if (typeof dateStr === 'string') {
                if (dateStr.includes('T')) {
                    dateStr = dateStr.split('T')[0];
                } else if (dateStr.includes(' ')) {
                    const parsed = new Date(dateStr);
                    if (!isNaN(parsed.getTime())) {
                        const year = parsed.getFullYear();
                        const month = String(parsed.getMonth() + 1).padStart(2, '0');
                        const day = String(parsed.getDate()).padStart(2, '0');
                        dateStr = `${year}-${month}-${day}`;
                    }
                }
            }

            const checkInTime = request.check_in ? `${dateStr} ${request.check_in}` : `${dateStr} 12:00:00`;
            const checkOutTime = request.check_out ? `${dateStr} ${request.check_out}` : `${dateStr} 18:00:00`;
            const attendanceStatus = request.regularization_type === 'half_day' ? 'half-day' : 'present';

            // Deliberately keyed on employee_id + date only: employees.id is a global primary
            // key, so employee_id is already tenant-unique. Adding company_id here would miss
            // legacy attendance rows carrying a NULL/mismatched company_id and insert a
            // duplicate row for the same day instead of updating it.
            const existingAtt = await trx('attendance')
                .where({ employee_id: request.employee_id })
                .whereRaw('DATE(check_in) = ?', [dateStr])
                .first();

            if (existingAtt) {
                await trx('attendance')
                    .where({ id: existingAtt.id })
                    .update({
                        check_in: checkInTime,
                        check_out: checkOutTime,
                        status: attendanceStatus,
                        punch_source: 'regularization',
                        updated_at: trx.fn.now()
                    });
            } else {
                await trx('attendance').insert({
                    employee_id: request.employee_id,
                    company_id: request.company_id,
                    check_in: checkInTime,
                    check_out: checkOutTime,
                    status: attendanceStatus,
                    punch_source: 'regularization',
                    created_at: trx.fn.now(),
                    updated_at: trx.fn.now()
                });
            }
        });

        // Notify Employee (best-effort, deliberately outside the transaction)
        try {
            const targetEmployee = await db('employees').where('id', request.employee_id).first();
            if (targetEmployee && targetEmployee.user_id) {
                await notificationService.createNotification(
                    targetEmployee.user_id,
                    request.company_id,
                    `Regularization Request ${status === 'approved' ? 'Approved' : 'Rejected'}`,
                    `Your request for ${request.date} has been ${status}.`,
                    status === 'approved' ? 'success' : 'error'
                );
            }
        } catch (err) {
            console.error('Regularization status notification failed', err);
        }

        return { message: `Regularization request ${status} successfully` };
    }
}

module.exports = new RegularizationService();
