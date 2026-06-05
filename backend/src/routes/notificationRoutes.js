const express = require('express');
const router = express.Router();
const notificationService = require('../services/notificationService');

// Get all notifications for the current user
router.get('/', async (req, res) => {
    try {
        const userId = req.user.id;
        const companyId = req.company_id || req.user.company_id || 2;
        const notifications = await notificationService.getNotifications(userId, companyId);
        res.json(notifications);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Get unread count
router.get('/unread-count', async (req, res) => {
    try {
        const userId = req.user.id;
        const companyId = req.company_id || req.user.company_id || 2;
        const count = await notificationService.getUnreadCount(userId, companyId);
        res.json({ count });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Mark a notification as read
router.put('/:id/read', async (req, res) => {
    try {
        const userId = req.user.id;
        const companyId = req.company_id || req.user.company_id || 2;
        await notificationService.markAsRead(req.params.id, userId, companyId);
        res.json({ message: 'Notification marked as read' });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Mark all as read
router.put('/read-all', async (req, res) => {
    try {
        const userId = req.user.id;
        const companyId = req.company_id || req.user.company_id || 2;
        await notificationService.markAllAsRead(userId, companyId);
        res.json({ message: 'All notifications marked as read' });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

module.exports = router;
