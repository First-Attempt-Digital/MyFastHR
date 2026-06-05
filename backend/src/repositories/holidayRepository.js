const db = require('../config/db');

class HolidayRepository {
    async add(companyId, name, date, type = 'fixed', createdBy = null, location = null) {
        return await db('holidays').insert({
            company_id: companyId,
            name,
            date,
            type,
            location,
            created_by: createdBy
        });
    }

    async getByMonth(companyId, month, year, user = null) {
        let query = db('holidays')
            .where({ company_id: companyId });

        // Only filter by month/year if provided
        if (month && year) {
            query = query.whereRaw('MONTH(date) = ? AND YEAR(date) = ?', [month, year]);
        } else if (year) {
            query = query.whereRaw('YEAR(date) = ?', [year]);
        }

        if (user && user.role_name === 'employee') {
            // Find employee's assigned manager
            const employee = await db('employees').where('id', user.employee_id).first();
            let managerUserId = null;
            if (employee && employee.manager_id) {
                const manager = await db('employees').where('id', employee.manager_id).first();
                if (manager) managerUserId = manager.user_id;
            }

            // Find all admin user IDs
            const admins = await db('users')
                .join('roles', 'users.role_id', 'roles.id')
                .where('users.company_id', companyId)
                .whereIn('roles.name', ['company_admin', 'super_admin'])
                .select('users.id as id');
            
            const allowedUserIds = admins.map(a => a.id);
            if (managerUserId) allowedUserIds.push(managerUserId);

            query = query.where(function() {
                this.whereNull('created_by')
                    .orWhereIn('created_by', allowedUserIds);
            });
        }

        return await query.orderBy('date', 'asc');
    }

    async delete(id, companyId) {
        return await db('holidays').where({ id, company_id: companyId }).del();
    }

    async update(id, companyId, data) {
        return await db('holidays').where({ id, company_id: companyId }).update(data);
    }
}

module.exports = new HolidayRepository();
