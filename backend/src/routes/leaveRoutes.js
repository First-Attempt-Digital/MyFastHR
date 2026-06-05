const express = require('express');
const leaveService = require('../services/leaveService');
const { authenticate, authorize } = require('../middlewares/authMiddleware');
const tenantFilter = require('../middlewares/tenantMiddleware');

const router = express.Router();

router.use(authenticate, tenantFilter);

// List leaves (Filters handled in Service/Repo)
router.get('/', async (req, res) => {
    try {
        const filters = {
            status: req.query.status,
            view: req.query.view // 'mine' or 'team'
        };
        const leaves = await leaveService.listLeaves(req.user, filters);
        res.json(leaves);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get personal leave balances
router.get('/balances', async (req, res) => {
    try {
        const balances = await leaveService.getBalances(req.user);
        res.json(balances);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get all employee leave balances (Admin)
router.get('/all-balances', authorize(['company_admin', 'super_admin']), async (req, res) => {
    try {
        const balances = await leaveService.getAllBalances(req.user.company_id);
        res.json(balances);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get leave rules for a specific employee (Admin)
router.get('/rules/:employeeId', authorize(['company_admin', 'super_admin']), async (req, res) => {
    try {
        const rules = await leaveService.getEmployeeRules(req.params.employeeId, req.user.company_id);
        res.json(rules);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Update/Save leave rules for an employee (Admin)
router.post('/rules', authorize(['company_admin', 'super_admin']), async (req, res) => {
    try {
        const result = await leaveService.updateEmployeeRules(req.user.company_id, req.body);
        res.json(result);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Get Leave Types
router.get('/types', async (req, res) => {
    try {
        const includeInactive = req.query.includeInactive === 'true';
        const types = await leaveService.getLeaveTypes(req.user.company_id, includeInactive);
        res.json(types);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Update Global Leave Rules (Admin)
router.post('/types/global-rules', authorize(['company_admin', 'super_admin']), async (req, res) => {
    try {
        const result = await leaveService.updateGlobalRules(req.user.company_id, req.body);
        res.json(result);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Apply for leave
router.post('/', async (req, res) => {
    try {
        const id = await leaveService.applyLeave(req.user, req.body);
        res.status(201).json({ id, message: 'Leave request submitted successfully' });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Approve/Reject leave (Admin & Manager)
router.patch('/:id/status', authorize(['company_admin', 'manager', 'super_admin']), async (req, res) => {
    try {
        const { status } = req.body;
        await leaveService.updateStatus(req.params.id, req.user, status);
        res.json({ message: `Leave ${status} successfully` });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Cancel leave request (Owner only)
router.delete('/:id', async (req, res) => {
    try {
        await leaveService.cancelLeave(req.params.id, req.user);
        res.json({ message: 'Leave request cancelled successfully' });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Adjust leave balance (Admin & Manager)
router.post('/adjust-balance', authorize(['company_admin', 'manager', 'super_admin']), async (req, res) => {
    try {
        const id = await leaveService.adjustBalance(req.user, req.body);
        res.status(201).json({ id, message: 'Leave balance adjusted successfully' });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Leave Granter Routes
router.get('/grants', authorize(['company_admin', 'manager', 'super_admin']), async (req, res) => {
    try {
        const grants = await leaveService.listGrants(req.user);
        res.json(grants);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.post('/grants', authorize(['company_admin', 'super_admin']), async (req, res) => {
    try {
        const result = await leaveService.grantLeave(req.user, req.body);
        res.status(201).json(result);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

router.delete('/grants/batch/:batchId', authorize(['company_admin', 'super_admin']), async (req, res) => {
    try {
        const result = await leaveService.deleteGrantBatch(req.user, req.params.batchId);
        res.json(result);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

router.delete('/grants/adjustment/:id', authorize(['company_admin', 'super_admin']), async (req, res) => {
    try {
        const result = await leaveService.deleteGrantAdjustment(req.user, req.params.id);
        res.json(result);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

module.exports = router;
