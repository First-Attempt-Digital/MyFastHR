const express = require('express');
const router = express.Router();
const notificationService = require('../services/notificationService');

// Notifications are addressed per user, so user_id is the real key here. The company
// filter is only a secondary scope — it must never fall back to a hardcoded tenant
// (this used to be `|| 2`, which silently scoped every unimpersonating super_admin's
// notifications to company 2). Null means "scope by user only".
const resolveCompanyId = (req) => req.company_id || req.user.company_id || null;

// Get all notifications for the current user
router.get('/', async (req, res) => {
    try {
        const userId = req.user.id;
        const companyId = resolveCompanyId(req);
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
        const companyId = resolveCompanyId(req);
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
        const companyId = resolveCompanyId(req);
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
        const companyId = resolveCompanyId(req);
        await notificationService.markAllAsRead(userId, companyId);
        res.json({ message: 'All notifications marked as read' });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

module.exports = router;
