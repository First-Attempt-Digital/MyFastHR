const jwt = require('jsonwebtoken');

/**
 * Verifies JWT and attaches user to request
 */
const authenticate = async (req, res, next) => {
    let token = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1];
    }

    if (!token) {
        return res.status(401).json({ message: 'Authentication required' });
    }

    // Development Bypass for Multi-Role Demo — disabled in production
    if (token.startsWith('test.')) {
        if (process.env.NODE_ENV === 'production') {
            return res.status(403).json({ message: 'Invalid or expired token' });
        }
        // Deterministic Mapping for Demo Stability
        const demoContexts = {
            'test.super.token': { email: 'super@myfasthr.com', role_name: 'super_admin', permissions: ['view_global_analytics', 'manage_tenants', 'configure_organization', 'manage_staff', 'process_payroll', 'approve_attendance', 'approve_leaves', 'view_self'] },
            'test.admin.token': { email: 'admin@myfasthr.com', role_name: 'company_admin', permissions: ['configure_organization', 'manage_staff', 'process_payroll', 'approve_attendance', 'approve_leaves', 'view_global_analytics', 'view_self'] },
            'test.manager.token': { email: 'emp2@example.com', role_name: 'manager', permissions: ['manage_staff', 'approve_attendance', 'approve_leaves', 'view_self'] },
            'test.employee.token': { email: 'emp3@example.com', role_name: 'employee', permissions: ['view_self'] },
            'test.employee1.token': { email: 'emp1@example.com', role_name: 'employee', permissions: ['view_self'] }
        };

        const context = demoContexts[token] || demoContexts['test.admin.token'];
        
        const db = require('../config/db');
        try {
            // Find user by email
            let user = await db('users').where({ email: context.email }).first();
            if (!user) {
                // Fallback to finding by role
                const roleObj = await db('roles').where({ name: context.role_name }).first();
                if (roleObj) {
                    user = await db('users').where({ role_id: roleObj.id }).first();
                }
            }
            
            const userId = user ? user.id : (context.role_name === 'company_admin' ? 2 : 3);
            const companyId = user ? user.company_id : 2;
            
            const employee = await db('employees').where({ user_id: userId }).select('id').first();
            
            req.user = { 
                id: userId,
                company_id: companyId,
                role_name: context.role_name,
                permissions: context.permissions,
                employee_id: employee?.id || null 
            };
            
            // Log for monitoring
            if (process.env.NODE_ENV !== 'production') {
                console.log(`[AUTH-BYPASS]: Synced context for ${context.role_name} (UID: ${userId}, CID: ${companyId}, EID: ${employee?.id})`);
            }
        } catch (e) {
            req.user = { 
                id: context.role_name === 'company_admin' ? 2 : 3, 
                company_id: 2, 
                role_name: context.role_name, 
                permissions: context.permissions, 
                employee_id: null 
            };
            console.error('[AUTH-BYPASS-ERROR]: Employee resolve failed, using partial context', e);
        }
        
        return next();
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] });
        req.user = decoded; // { id, role, company_id, role_name }
        next();
    } catch (err) {
        return res.status(403).json({ message: 'Invalid or expired token' });
    }
};

/**
 * Restricts access based on specific permissions
 * @param {string[]} requiredPermissions 
 */
const hasPermission = (requiredPermissions) => {
    return (req, res, next) => {
        if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
        
        const userPermissions = req.user.permissions || [];
        const hasMatch = requiredPermissions.some(p => userPermissions.includes(p));

        if (!hasMatch) {
            return res.status(403).json({ message: 'Insufficient permissions for this action' });
        }
        next();
    };
};

/**
 * Restricts access based on specific roles
 * @param {string[]} allowedRoles 
 */
const authorize = (allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
        
        if (!allowedRoles.includes(req.user.role_name)) {
            return res.status(403).json({ message: 'Access denied: Insufficient role' });
        }
        next();
    };
};

module.exports = { 
    authenticate, 
    authenticateToken: authenticate, // Alias for backward compatibility
    authorize, 
    hasPermission 
};
