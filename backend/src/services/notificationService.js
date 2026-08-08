const db = require('../config/db');

/**
 * Applies the per-user key plus, when we have one, the tenant scope.
 * A null companyId means "this caller has no tenant context" (unimpersonating
 * super_admin) — scope by user_id alone rather than inventing a company.
 */
const scopeToUser = (query, userId, companyId) => {
    query.where('user_id', userId);
    if (companyId) query.andWhere('company_id', companyId);
    return query;
};

class NotificationService {
    async createNotification(userId, companyId, title, message, type = 'info') {
        return await db('notifications').insert({
            user_id: userId,
            company_id: companyId,
            title,
            message,
            type
        });
    }

    async getNotifications(userId, companyId) {
        // The previous catch-all here silently re-ran the query *without* the company
        // filter, so any transient DB error turned into a cross-tenant read. Errors now
        // propagate to the route's handler (and errorResponseSanitizer) instead.
        return await scopeToUser(db('notifications'), userId, companyId)
            .orderBy('created_at', 'desc')
            .limit(20);
    }

    async markAsRead(notificationId, userId, companyId) {
        return await scopeToUser(db('notifications'), userId, companyId)
            .andWhere('id', notificationId)
            .update({ is_read: true });
    }

    async markAllAsRead(userId, companyId) {
        return await scopeToUser(db('notifications'), userId, companyId)
            .update({ is_read: true });
    }

    async getUnreadCount(userId, companyId) {
        // The old fallback branch computed `result` but never returned it, so any error
        // here produced `undefined` -> res.json({ count: undefined }) -> `{}` on the wire,
        // and the AppShell badge silently went blank.
        const result = await scopeToUser(db('notifications'), userId, companyId)
            .andWhere('is_read', false)
            .count('id as count')
            .first();
        return Number(result?.count) || 0;
    }

    async notifyAction(actorUser, targetEmployeeId, actionType, details) {
        try {
            // Find target employee
            const employee = await db('employees').where('id', targetEmployeeId).first();
            if (!employee) return;

            // Don't emit notifications into another tenant. Deliberately conservative — it
            // only suppresses when BOTH sides carry a company and they genuinely differ:
            //  - super_admin is exempt; it legitimately acts across companies.
            //  - a NULL employees.company_id is NOT treated as foreign. Employees created by
            //    a super_admin get company_id NULL (employeeController.create passes
            //    req.user.company_id), and suppressing those would silently stop notifying
            //    real people whose profiles their own admin edits.
            //  - compared numerically, so a company_id stored as VARCHAR in a drifted schema
            //    ("7" vs 7) can't suppress every notification tenant-wide.
            const actorRole = actorUser.role_name;
            const actorCompanyId = actorUser.company_id;
            const targetCompanyId = employee.company_id;
            if (actorRole !== 'super_admin' && actorCompanyId && targetCompanyId
                && Number(targetCompanyId) !== Number(actorCompanyId)) {
                return;
            }

            // 1. If actor is NOT the target employee (meaning it is a manager or admin performing action on employee profile)
            if (actorUser.employee_id !== employee.id) {
                if (employee.user_id) {
                    await this.createNotification(
                        employee.user_id,
                        employee.company_id,
                        'Profile Updated',
                        `Your profile details (${actionType}: ${details}) have been updated by the ${actorRole === 'company_admin' ? 'Admin' : 'Manager'}.`,
                        'info'
                    );
                }
            } else {
                // 2. If the actor IS the employee themselves updating their profile
                // Notify their Manager
                if (employee.manager_id) {
                    const manager = await db('employees').where('id', employee.manager_id).first();
                    if (manager && manager.user_id) {
                        await this.createNotification(
                            manager.user_id,
                            employee.company_id,
                            'Employee Update',
                            `${employee.first_name} ${employee.last_name} updated their ${actionType}: ${details}.`,
                            'info'
                        );
                    }
                }
                // Notify Company Admins
                const admins = await db('users')
                    .join('roles', 'users.role_id', 'roles.id')
                    .where({ 'users.company_id': employee.company_id, 'roles.name': 'company_admin' })
                    .select('users.id');
                for (const admin of admins) {
                    await this.createNotification(
                        admin.id,
                        employee.company_id,
                        'Employee Update',
                        `${employee.first_name} ${employee.last_name} updated their ${actionType}: ${details}.`,
                        'info'
                    );
                }
            }
        } catch (err) {
            console.error('Failed to send employee update notifications:', err.message);
        }
    }
}

module.exports = new NotificationService();
