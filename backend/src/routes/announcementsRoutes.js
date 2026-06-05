const express = require('express');
const router = express.Router();
const announcementsController = require('../controllers/announcementsController');
const { hasPermission } = require('../middlewares/authMiddleware');

// Get active announcements (any authenticated user)
router.get('/', announcementsController.getActiveAnnouncements);

// Manage announcements (only Super Admin - has manage_tenants permission)
router.post('/', hasPermission(['manage_tenants']), announcementsController.createAnnouncement);
router.delete('/:id', hasPermission(['manage_tenants']), announcementsController.deleteAnnouncement);

module.exports = router;
