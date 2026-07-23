const jwt = require('jsonwebtoken');
const db = require('../config/db');

const deleteSecurityGuard = async (req, res, next) => {
    // Only guard DELETE requests and bulk-delete endpoints
    if (req.method !== 'DELETE' && !req.path.includes('bulk-delete')) {
        return next();
    }

    // Exclude public routes (e.g. candidate onboarding deletes)
    if (req.path.includes('/public/')) {
        return next();
    }

    // Extract authorization token
    let token = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1];
    }

    if (!token) {
        return next(); // Let authentication middleware handle the missing token error
    }

    let companyId = null;
    let isSuperAdmin = false;
    try {
        if (token.startsWith('test.') && process.env.NODE_ENV !== 'production') {
            // Support development bypass matching authMiddleware logic
            const emailMap = {
                'test.super.token': 'super@myfasthr.com',
                'test.admin.token': 'admin@myfasthr.com',
                'test.manager.token': 'emp2@example.com',
                'test.employee.token': 'emp3@example.com',
                'test.employee1.token': 'emp1@example.com'
            };
            const email = emailMap[token] || 'admin@myfasthr.com';
            let user = await db('users').where({ email }).first();
            if (!user) {
                // Fallback to finding by role matching authMiddleware
                const roleName = token === 'test.super.token' ? 'super_admin' : (token === 'test.manager.token' ? 'manager' : 'company_admin');
                const roleObj = await db('roles').where({ name: roleName }).first();
                if (roleObj) {
                    user = await db('users').where({ role_id: roleObj.id }).first();
                }
            }
            companyId = user ? user.company_id : 2; // Default to company 2 since company 1 does not exist
            isSuperAdmin = token === 'test.super.token' || (user && user.role_id === 1);
        } else {
            const decoded = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] });
            companyId = decoded.company_id;
            
            // Resolve user role
            const user = await db('users')
                .join('roles', 'users.role_id', '=', 'roles.id')
                .where('users.id', decoded.id)
                .select('roles.name as role_name')
                .first();
            if (user && user.role_name === 'super_admin') {
                isSuperAdmin = true;
            }
        }
    } catch (e) {
        return next(); // Let authentication middleware handle invalid token errors
    }

    // Dynamic inference of companyId for super admin (companyId is null) or if missing
    if (!companyId) {
        const parts = req.path.split('/');
        const resourceType = parts[2];
        const resourceId = parts[3];
        
        if (resourceId && !isNaN(resourceId)) {
            try {
                if (resourceType === 'employees') {
                    const emp = await db('employees').where({ id: resourceId }).first();
                    if (emp) companyId = emp.company_id;
                } else if (resourceType === 'leaves') {
                    const lv = await db('leaves').where({ id: resourceId }).first();
                    if (lv) companyId = lv.company_id;
                } else if (resourceType === 'departments' || resourceType === 'org') {
                    const dept = await db('departments').where({ id: resourceId }).first();
                    if (dept) companyId = dept.company_id;
                } else if (resourceType === 'holidays' || resourceType === 'settings') {
                    const hol = await db('holidays').where({ id: resourceId }).first();
                    if (hol) companyId = hol.company_id;
                } else if (resourceType === 'companies') {
                    companyId = resourceId;
                }
            } catch (err) {
                console.error('Error dynamically resolving company ID in delete interceptor:', err);
            }
        }
    }

    // Get expected keys (company-specific key and global platform key).
    // No hardcoded default: an unconfigured key must fail closed, never accept '123456'.
    let expectedKey = null;
    let globalKey = null;
    try {
        const globalKeySetting = await db('system_settings').where({ key_name: 'global_delete_security_key' }).first();
        if (globalKeySetting && globalKeySetting.value_text) {
            globalKey = globalKeySetting.value_text;
        }

        if (companyId) {
            const company = await db('companies').where({ id: companyId }).first();
            if (company && company.delete_security_key) {
                expectedKey = company.delete_security_key;
            }
        } else {
            expectedKey = globalKey;
        }
    } catch (err) {
        console.error('Database query for delete security key failed:', err);
        // Fail closed: never proceed with a deletion if we could not verify the key.
        return res.status(500).json({
            code: 'DELETE_KEY_ERROR',
            message: 'Unable to verify the delete security key. Deletion aborted.'
        });
    }

    // Fail closed: if no delete key has been configured, refuse the deletion instead of
    // accepting a well-known default. An admin must set a real key in Settings first.
    const hasConfiguredKey = !!expectedKey || (isSuperAdmin && !!globalKey);
    if (!hasConfiguredKey) {
        return res.status(403).json({
            code: 'DELETE_KEY_NOT_CONFIGURED',
            message: 'No delete security key is configured. An administrator must set one in Settings before deletions are permitted.'
        });
    }

    const inputKey = req.headers['x-delete-security-key'];

    if (!inputKey) {
        return res.status(403).json({ 
            code: 'DELETE_KEY_REQUIRED', 
            message: 'A 6-digit delete security key is required to complete this deletion.' 
        });
    }

    // Allow super admin to use EITHER global master key OR the specific company key
    const isMatched = (expectedKey === inputKey) || (isSuperAdmin && globalKey === inputKey);

    if (!isMatched) {
        return res.status(403).json({ 
            code: 'INVALID_DELETE_KEY', 
            message: 'The entered delete security key is incorrect.' 
        });
    }

    // Verification successful, proceed with deletion!
    next();
};

module.exports = deleteSecurityGuard;
