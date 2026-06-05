const orgRepository = require('../repositories/orgRepository');
const departmentRepository = require('../repositories/departmentRepository');

class OrgController {
    // Existing methods from previous turn
    async getDepartments(req, res) {
        try {
            const companyId = req.user.company_id;
            if (!companyId) return res.status(400).json({ message: 'Managed companies only' });
            const departments = await departmentRepository.findByCompany(companyId);
            const counts = await departmentRepository.getEmployeeCount(companyId);
            const results = departments.map(d => ({
                ...d,
                employee_count: (counts.find(c => c.department_id === d.id))?.count || 0
            }));
            res.json(results);
        } catch (error) {
            res.status(500).json({ message: 'Error fetching departments', error: error.message });
        }
    }

    async createDepartment(req, res) {
        try {
            const companyId = req.user.company_id;
            const { name, manager_id } = req.body;
            const deptId = await departmentRepository.create({ company_id: companyId, name, manager_id });
            res.status(201).json({ id: deptId, message: 'Department created' });
        } catch (error) {
            res.status(500).json({ message: 'Error creating department', error: error.message });
        }
    }

    async updateDepartment(req, res) {
        try {
            const { id } = req.params;
            const companyId = req.user.company_id;
            const { name, manager_id } = req.body;
            await departmentRepository.update(id, companyId, { name, manager_id });
            res.json({ message: 'Department updated' });
        } catch (error) {
            res.status(500).json({ message: 'Error updating department', error: error.message });
        }
    }

    async deleteDepartment(req, res) {
        try {
            const { id } = req.params;
            const companyId = req.user.company_id;
            await departmentRepository.delete(id, companyId);
            res.json({ message: 'Department deleted successfully' });
        } catch (error) {
            res.status(500).json({ message: 'Error deleting department', error: error.message });
        }
    }

    // New Hierarchy Chart Methods
    async getChartData(req, res) {
        try {
            const role = req.user.role_name;
            const companyId = req.user.company_id;

            if (role === 'super_admin') {
                const results = await orgRepository.getGlobalHierarchy();
                return res.json(results);
            }

            if (!companyId) return res.status(400).json({ message: 'Access Denied' });

            const data = await orgRepository.getHierarchy(companyId);
            res.json(data);
        } catch (error) {
            res.status(500).json({ message: 'Error fetching hierarchy chart', error: error.message });
        }
    }
}

module.exports = new OrgController();
