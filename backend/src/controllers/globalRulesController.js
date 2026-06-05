const globalRulesRepository = require('../repositories/globalRulesRepository');

class GlobalRulesController {
    async getRules(req, res) {
        try {
            const companyId = req.company_id || req.query.company_id || 2;
            const rules = await globalRulesRepository.findAll(companyId);
            res.json(rules);
        } catch (err) {
            res.status(500).json({ message: err.message });
        }
    }

    async createRule(req, res) {
        try {
            const companyId = req.company_id || req.body.company_id || 2;
            const newRule = await globalRulesRepository.create(companyId, req.body);
            res.json({ message: 'Global payroll formula registered successfully', rule: newRule });
        } catch (err) {
            res.status(500).json({ message: err.message });
        }
    }

    async updateRule(req, res) {
        try {
            const companyId = req.company_id || req.body.company_id || 2;
            const { id } = req.params;
            const updatedRule = await globalRulesRepository.update(id, companyId, req.body);
            res.json({ message: 'Global payroll formula updated successfully', rule: updatedRule });
        } catch (err) {
            res.status(500).json({ message: err.message });
        }
    }

    async deleteRule(req, res) {
        try {
            const companyId = req.company_id || req.query.company_id || 2;
            const { id } = req.params;
            await globalRulesRepository.delete(id, companyId);
            res.json({ message: 'Global payroll formula deleted successfully' });
        } catch (err) {
            res.status(500).json({ message: err.message });
        }
    }
}

module.exports = new GlobalRulesController();
