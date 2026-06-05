const db = require('../config/db');

/**
 * Tenant Middleware: Strictly enforces company isolation.
 * Extracts company_id from the authenticated user and resolves employee context.
 */
const tenantFilter = async (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ message: 'User context missing' });
    }

    // Inject company_id into request for use in services/repositories
    const queryCompanyId = req.query ? req.query.company_id : undefined;
    const bodyCompanyId = req.body ? req.body.company_id : undefined;
    if (req.user.role_name === 'super_admin' && (queryCompanyId || bodyCompanyId)) {
        req.company_id = parseInt(queryCompanyId) || parseInt(bodyCompanyId);
    } else {
        req.company_id = req.user.company_id;
    }

    // Resolve Employee ID if not present (crucial for punch-in, leaves, vault)
    if (req.user.role_name !== 'super_admin' && !req.user.employee_id) {
        try {
            const employee = await db('employees')
                .where({ user_id: req.user.id, company_id: req.user.company_id })
                .select('id')
                .first();
            if (employee) {
                req.user.employee_id = employee.id;
            }
        } catch (err) {
            console.error('Tenant Context Error:', err);
        }
    }

    next();
};

module.exports = tenantFilter;
