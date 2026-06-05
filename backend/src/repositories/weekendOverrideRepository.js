const db = require('../config/db');

class WeekendOverrideRepository {
    async getAll(companyId, month, year) {
        let query = db('weekend_overrides as wo')
            .join('employees as e', 'wo.employee_id', 'e.id')
            .where({ 'wo.company_id': companyId });

        if (month && year) {
            query = query.whereRaw('MONTH(wo.override_date) = ? AND YEAR(wo.override_date) = ?', [month, year]);
        } else if (year) {
            query = query.whereRaw('YEAR(wo.override_date) = ?', [year]);
        }

        return await query
            .select(
                'wo.id',
                'wo.employee_id',
                'e.first_name',
                'e.last_name',
                'e.employee_id_number',
                'e.office_location',
                'wo.override_date',
                'wo.override_type',
                'wo.reason',
                'wo.created_by',
                'wo.created_at'
            )
            .orderBy('wo.override_date', 'asc');
    }

    async getByEmployee(companyId, employeeId) {
        return await db('weekend_overrides')
            .where({ company_id: companyId, employee_id: employeeId })
            .orderBy('override_date', 'asc');
    }

    async create(companyId, data) {
        const [id] = await db('weekend_overrides').insert({
            company_id: companyId,
            employee_id: data.employee_id,
            override_date: data.override_date,
            override_type: data.override_type || 'working',
            reason: data.reason || null,
            created_by: data.created_by || null,
            created_at: db.fn.now(),
            updated_at: db.fn.now()
        });
        return { id, ...data };
    }

    async delete(id, companyId) {
        return await db('weekend_overrides').where({ id, company_id: companyId }).del();
    }
}

module.exports = new WeekendOverrideRepository();
