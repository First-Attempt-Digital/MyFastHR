const db = require('../config/db');

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
        try {
            return await db('notifications')
                .where({ user_id: userId, company_id: companyId })
                .orderBy('created_at', 'desc')
                .limit(20);
        } catch (err) {
            // Fallback for cases where company_id column might be missing
            return await db('notifications')
                .where({ user_id: userId })
                .orderBy('created_at', 'desc')
                .limit(20);
        }
    }

    async markAsRead(notificationId, userId, companyId) {
        return await db('notifications')
            .where({ id: notificationId, user_id: userId, company_id: companyId })
            .update({ is_read: true });
    }

    async markAllAsRead(userId, companyId) {
        return await db('notifications')
            .where({ user_id: userId, company_id: companyId })
            .update({ is_read: true });
    }

    async getUnreadCount(userId, companyId) {
        try {
            const result = await db('notifications')
                .where({ user_id: userId, company_id: companyId, is_read: false })
                .count('id as count')
                .first();
            return result?.count || 0;
        } catch (err) {
            const result = await db('notifications')
                .where({ user_id: userId, is_read: false })
                .count('id as count')
                .first();
        }
    }

    async notifyAction(actorUser, targetEmployeeId, actionType, details) {
        try {
            // Find target employee
            const employee = await db('employees').where('id', targetEmployeeId).first();
            if (!employee) return;

            const actorUserId = actorUser.id;
            const actorRole = actorUser.role_name;

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
