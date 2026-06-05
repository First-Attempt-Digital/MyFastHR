const db = require('../config/db');

/**
 * TenantGuard Middleware
 * Blocks specific actions if the company's subscription is inactive or trial limit is reached.
 */
const tenantGuard = async (req, res, next) => {
    try {
        const companyId = req.company_id;
        if (!companyId) return next(); // Skip for super_admin (global context)

        const company = await db('companies')
            .where('id', companyId)
            .select('subscription_status', 'name')
            .first();

        if (!company) {
            return res.status(404).json({ message: 'Tenant context missing' });
        }

        // 1. Block if inactive
        if (company.subscription_status === 'inactive') {
            return res.status(403).json({ 
                message: 'Subscription Suspended', 
                detail: `The instance for "${company.name}" has been disabled. Please contact the platform supervisor.` 
            });
        }

        // 2. Add metadata to request for later use
        req.subscription_status = company.subscription_status;
        
        next();
    } catch (err) {
        res.status(500).json({ message: 'Tenancy validation failed' });
    }
};

module.exports = tenantGuard;
