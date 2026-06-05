const db = require('../config/db');

class CompanyRepository {
    async findAll() {
        return await db('companies').select('*').orderBy('created_at', 'desc');
    }

    async findById(id) {
        return await db('companies').where({ id }).first();
    }

    async create(companyData, trx = db) {
        const [id] = await trx('companies').insert(companyData);
        return id;
    }

    async update(id, data) {
        return await db('companies').where({ id }).update(data);
    }

    async getPlatformStats() {
        const companies = await db('companies').count('id as count').first();
        const employees = await db('employees').count('id as count').first();
        const users = await db('users').count('id as count').first();
        
        return {
            total_companies: companies.count,
            total_employees: employees.count,
            total_users: users.count
        };
    }
}

module.exports = new CompanyRepository();
