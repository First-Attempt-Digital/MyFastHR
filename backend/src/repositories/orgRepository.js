const db = require('../config/db');

class OrgRepository {
    async getHierarchy(companyId) {
        console.info(`[OrgChart] Constructing hierarchy for Company: ${companyId}`);
        const today = new Date().toISOString().split('T')[0];
        
        try {
            // 1. Fetch all employees first (Root Query)
            const employees = await db('employees')
                .where('company_id', companyId)
                .select(
                    'id', 'first_name', 'last_name', 'designation', 
                    'employee_id_number', 'manager_id', 'status', 
                    'phone', 'email', 'office_location'
                );

            if (!employees.length) {
                console.warn(`[OrgChart] No employees found for company ${companyId}`);
                return [];
            }

            // 2. Fetch subordinate counts
            const counts = await db('employees')
                .where('company_id', companyId)
                .groupBy('manager_id')
                .select('manager_id')
                .count('id as count');

            // 3. Fetch live attendance for today
            const attendance = await db('attendance')
                .whereRaw('DATE(check_in) = ?', [today])
                .whereNull('check_out')
                .select('employee_id');

            // 4. Fetch approved leaves for today
            const leaves = await db('leaves')
                .where('status', 'approved')
                .whereRaw('? BETWEEN start_date AND end_date', [today])
                .select('employee_id');

            // 5. Map everything together
            return employees.map(emp => {
                const isOnline = attendance.some(a => a.employee_id === emp.id);
                const isOnLeave = leaves.some(l => l.employee_id === emp.id);
                
                return {
                    ...emp,
                    live_status: isOnLeave ? 'on_leave' : (isOnline ? 'online' : 'offline'),
                    subordinate_count: (counts.find(c => c.manager_id === emp.id))?.count || 0
                };
            });
        } catch (err) {
            console.error('[OrgChart] Database Query Error:', err);
            throw err;
        }
    }

    async getGlobalHierarchy() {
        // For Super Admin: Construct a single Unified Tree
        // Level 1: Global Ecosystem (Virtual or actual Root)
        // Level 2: Companies
        // Level 3: Company Admins / Employees
        
        const companies = await db('companies').select('id', 'name', 'email');
        const results = [];

        for (const company of companies) {
            const employees = await this.getHierarchy(company.id);
            
            // We create a "Virtual Node" for the company itself
            // ID is prefixed to avoid collisions with employee IDs
            const companyNodeId = `comp_${company.id}`;
            
            results.push({
                id: companyNodeId, // Virtual ID for global tree
                company_id: company.id,
                first_name: company.name,
                last_name: '(Organization)',
                designation: 'Managed Entity',
                manager_id: null, // Companies are roots of the global tree
                is_company_node: true,
                subordinate_count: employees.filter(e => !e.manager_id).length
            });

            // Add employees belonging to this company
            // We prefix their manager_id if it's null to point to the company node
            employees.forEach(emp => {
                results.push({
                    ...emp,
                    manager_id: emp.manager_id || companyNodeId
                });
            });
        }
        return results;
    }
}

module.exports = new OrgRepository();
