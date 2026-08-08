const express = require('express');
const regularizationService = require('../services/regularizationService');
const { authorize } = require('../middlewares/authMiddleware');

const router = express.Router();

// authenticateToken + tenantFilter + tenantGuard are applied at the mount point in app.js;
// re-running authenticate/tenantFilter here just duplicated the work (and the employee lookup).

// List current employee's regularization requests
router.get('/mine', async (req, res) => {
    try {
        const list = await regularizationService.listMyRequests(req.user);
        res.json(list);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// List regularization requests pending review (Admin & Manager)
router.get('/review', authorize(['company_admin', 'manager', 'super_admin']), async (req, res) => {
    try {
        const list = await regularizationService.listReviewRequests(req.user, req.company_id);
        res.json(list);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Apply for regularization
router.post('/', async (req, res) => {
    try {
        const id = await regularizationService.applyRegularization(req.user, req.body, req.company_id);
        res.status(201).json({ id, message: 'Regularization request submitted successfully' });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Approve or Reject a regularization request (Admin & Manager)
router.patch('/:id/status', authorize(['company_admin', 'manager', 'super_admin']), async (req, res) => {
    try {
        const { status } = req.body;
        const result = await regularizationService.updateStatus(req.params.id, req.user, status, req.company_id);
        res.json(result);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

module.exports = router;
