const express = require('express');
const { analyticsController } = require('../controllers/analyticsController');
const { authenticate } = require('../middlewares/authMiddleware');
const tenantFilter = require('../middlewares/tenantMiddleware');

const router = express.Router();

router.use(authenticate, tenantFilter);

router.get('/metrics', analyticsController.getMetrics);
router.get('/leave-attendance-overview', analyticsController.getLeaveAttendanceOverview);
router.get('/recent-activities', analyticsController.getRecentActivities);

module.exports = router;
