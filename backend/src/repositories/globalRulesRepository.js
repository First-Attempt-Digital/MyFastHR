const db = require('../config/db');

class GlobalRulesRepository {
    async findAll(companyId) {
        return await db('global_payroll_rules')
            .where({ company_id: companyId })
            .orderBy('id', 'asc');
    }

    async findActive(companyId) {
        return await db('global_payroll_rules')
            .where({ company_id: companyId, is_active: true })
            .orderBy('id', 'asc');
    }

    async findById(id, companyId) {
        return await db('global_payroll_rules')
            .where({ id, company_id: companyId })
            .first();
    }

    async create(companyId, data) {
        const payload = {
            company_id: companyId,
            rule_name: data.rule_name,
            employee_percentage: parseFloat(data.employee_percentage) || 0,
            employer_percentage: parseFloat(data.employer_percentage) || 0,
            base_on: data.base_on || 'base_salary',
            is_active: data.is_active !== undefined ? data.is_active : true,
            created_at: db.fn.now(),
            updated_at: db.fn.now()
        };
        const [id] = await db('global_payroll_rules').insert(payload);
        return await this.findById(id, companyId);
    }

    async update(id, companyId, data) {
        const payload = {
            rule_name: data.rule_name,
            employee_percentage: parseFloat(data.employee_percentage) || 0,
            employer_percentage: parseFloat(data.employer_percentage) || 0,
            base_on: data.base_on || 'base_salary',
            is_active: data.is_active !== undefined ? data.is_active : true,
            updated_at: db.fn.now()
        };
        await db('global_payroll_rules')
            .where({ id, company_id: companyId })
            .update(payload);
        return await this.findById(id, companyId);
    }

    async delete(id, companyId) {
        return await db('global_payroll_rules')
            .where({ id, company_id: companyId })
            .del();
    }
}

module.exports = new GlobalRulesRepository();
