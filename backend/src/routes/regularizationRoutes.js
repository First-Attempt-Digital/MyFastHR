const express = require('express');
const regularizationService = require('../services/regularizationService');
const { authenticate, authorize } = require('../middlewares/authMiddleware');
const tenantFilter = require('../middlewares/tenantMiddleware');

const router = express.Router();

router.use(authenticate, tenantFilter);

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
        const list = await regularizationService.listReviewRequests(req.user);
        res.json(list);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Apply for regularization
router.post('/', async (req, res) => {
    try {
        const id = await regularizationService.applyRegularization(req.user, req.body);
        res.status(201).json({ id, message: 'Regularization request submitted successfully' });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Approve or Reject a regularization request (Admin & Manager)
router.patch('/:id/status', authorize(['company_admin', 'manager', 'super_admin']), async (req, res) => {
    try {
        const { status } = req.body;
        const result = await regularizationService.updateStatus(req.params.id, req.user, status);
        res.json(result);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

module.exports = router;
