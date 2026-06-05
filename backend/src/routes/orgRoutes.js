const express = require('express');
const router = express.Router();
const orgController = require('../controllers/orgController');
const { authenticateToken, hasPermission } = require('../middlewares/authMiddleware');

router.use(authenticateToken);

// Management routes
router.get('/departments', hasPermission(['configure_organization', 'view_self']), orgController.getDepartments);
router.post('/departments', hasPermission(['configure_organization']), orgController.createDepartment);
router.patch('/departments/:id', hasPermission(['configure_organization']), orgController.updateDepartment);
router.delete('/departments/:id', hasPermission(['configure_organization']), orgController.deleteDepartment);
router.get('/chart', hasPermission(['configure_organization', 'view_global_analytics', 'view_self']), orgController.getChartData);

module.exports = router;
