const db = require('../config/db');

class DepartmentRepository {
    async findByCompany(companyId) {
        return await db('departments as d')
            .leftJoin('users as u', 'd.manager_id', 'u.id')
            .leftJoin('employees as e', 'u.id', 'e.user_id')
            .where('d.company_id', companyId)
            .select(
                'd.*',
                'e.first_name as manager_first_name',
                'e.last_name as manager_last_name'
            )
            .orderBy('d.name', 'asc');
    }

    async create(data) {
        const [id] = await db('departments').insert(data);
        return id;
    }

    async update(id, companyId, data) {
        return await db('departments')
            .where({ id, company_id: companyId })
            .update(data);
    }

    async delete(id, companyId) {
        await db('employees')
            .where({ department_id: id, company_id: companyId })
            .update({ department_id: null });

        return await db('departments')
            .where({ id, company_id: companyId })
            .del();
    }

    async getEmployeeCount(companyId) {
        return await db('employees')
            .where('company_id', companyId)
            .groupBy('department_id')
            .select('department_id')
            .count('id as count');
    }
}

module.exports = new DepartmentRepository();
