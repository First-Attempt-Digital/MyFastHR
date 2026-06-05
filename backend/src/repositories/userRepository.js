const db = require('../config/db');

class UserRepository {
    async findByIdentifier(identifier) {
        if (!identifier) return null;
        console.log(`[DB]: Searching for node with identifier: ${identifier}`);
        
        const user = await db('users')
            .join('roles', 'users.role_id', '=', 'roles.id')
            .leftJoin('employees', 'users.id', '=', 'employees.user_id')
            .select('users.*', 'roles.name as role_name', 'employees.id as employee_id')
            .where('users.email', '=', identifier)
            .orWhere('employees.email', '=', identifier)
            .orWhere('employees.phone', '=', identifier)
            .orWhere('employees.employee_id_number', '=', identifier)
            .first();

        if (user) {
            // Priority: 1. Company Specific Permissions, 2. Global Defaults
            let permissions = await db('role_permissions')
                .join('permissions', 'role_permissions.permission_id', '=', 'permissions.id')
                .where({ role_id: user.role_id, company_id: user.company_id })
                .select('permissions.name');
            
            if (permissions.length === 0) {
                permissions = await db('role_permissions')
                    .join('permissions', 'role_permissions.permission_id', '=', 'permissions.id')
                    .where({ role_id: user.role_id, company_id: null })
                    .select('permissions.name');
            }
            user.permissions = permissions.map(p => p.name);
        }
        return user;
    }

    async findByEmail(email) {
        return this.findByIdentifier(email);
    }

    async updateRefreshToken(userId, token) {
        return await db('users').where({ id: userId }).update({ refresh_token: token });
    }

    async updatePassword(userId, passwordHash) {
        return await db('users').where({ id: userId }).update({ password_hash: passwordHash });
    }

    async create(userData, trx = db) {
        return await trx('users').insert(userData);
    }

    async findById(id) {
        const user = await db('users')
            .join('roles', 'users.role_id', '=', 'roles.id')
            .leftJoin('employees', 'users.id', '=', 'employees.user_id')
            .select('users.*', 'roles.name as role_name', 'employees.id as employee_id')
            .where('users.id', id)
            .first();

        if (user) {
            // Priority: 1. Company Specific Permissions, 2. Global Defaults
            let permissions = await db('role_permissions')
                .join('permissions', 'role_permissions.permission_id', '=', 'permissions.id')
                .where({ role_id: user.role_id, company_id: user.company_id })
                .select('permissions.name');
            
            if (permissions.length === 0) {
                permissions = await db('role_permissions')
                    .join('permissions', 'role_permissions.permission_id', '=', 'permissions.id')
                    .where({ role_id: user.role_id, company_id: null })
                    .select('permissions.name');
            }
            user.permissions = permissions.map(p => p.name);
        }
        return user;
    }
}

module.exports = new UserRepository();
