const db = require('../config/db');

class PayrollRepository {
    async getSalaryStructure(employeeId, companyId) {
        return await db('salary_structures')
            .where({ employee_id: employeeId, company_id: companyId })
            .first();
    }

    async upsertSalaryStructure(employeeId, companyId, data) {
        const existing = await this.getSalaryStructure(employeeId, companyId);
        
        const payload = {
            employee_id: employeeId,
            company_id: companyId,
            base_salary: data.base_salary,
            allowances: typeof data.allowances === 'string' ? data.allowances : JSON.stringify(data.allowances || []),
            deductions: typeof data.deductions === 'string' ? data.deductions : JSON.stringify(data.deductions || [])
        };

        if (existing) {
            return await db('salary_structures')
                .where({ id: existing.id })
                .update(payload);
        } else {
            return await db('salary_structures').insert(payload);
        }
    }

    async savePayroll(data) {
        // data contains employee_id, company_id, month, year, net_salary, etc.
        return await db('payrolls')
            .insert(data)
            .onConflict(['employee_id', 'month', 'year'])
            .merge();
    }

    async getMonthlyStatements(companyId, month, year) {
        return await db('payrolls as p')
            .join('employees as e', 'p.employee_id', 'e.id')
            .where({ 'p.company_id': companyId, 'p.month': month, 'p.year': year })
            .select('p.*', 'e.first_name', 'e.last_name', 'e.employee_id_number', 'e.designation');
    }
}

module.exports = new PayrollRepository();
