const db = require('../config/db');

class RoleRepository {
    async findAll(companyId) {
        return await db('roles')
            .orderBy('id', 'asc');
    }

    async findAllPermissions() {
        return await db('permissions').select('*');
    }

    async findRolePermissions(roleId, companyId) {
        // Try company specific first
        let perms = await db('role_permissions')
            .where({ role_id: roleId, company_id: companyId })
            .select('permission_id');
        
        if (perms.length === 0) {
            // Fallback to global
            perms = await db('role_permissions')
                .where({ role_id: roleId, company_id: null })
                .select('permission_id');
        }
        
        return perms.map(p => p.permission_id);
    }

    async updatePermissions(roleId, permissionIds, companyId) {
        return await db.transaction(async (trx) => {
            // Remove existing company-specific overrides
            await trx('role_permissions')
                .where({ role_id: roleId, company_id: companyId })
                .del();
            
            // Insert new overrides
            if (permissionIds.length > 0) {
                const inserts = permissionIds.map(pid => ({
                    role_id: roleId,
                    permission_id: pid,
                    company_id: companyId
                }));
                await trx('role_permissions').insert(inserts);
            }
        });
    }
}

module.exports = new RoleRepository();
