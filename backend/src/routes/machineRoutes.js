const express = require('express');
const router = express.Router();
const machineController = require('../controllers/machineController');
const apiKeyAuth = require('../middlewares/apiKeyAuthMiddleware');
const { authenticateToken } = require('../middlewares/authMiddleware');
const tenantGuard = require('../middlewares/tenantMiddleware');
const { isMasterKey } = require('../utils/masterKeys');

/**
 * Flexible registration and mapping authorization middleware.
 * Supports:
 * 1. Standard JWT session (from frontend dashboard admin client)
 * 2. Master API Key (from headless device installers/scripts)
 */
const flexibleAuth = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    const apiKey = req.headers['x-api-key'] || req.query.api_key || req.body?.api_key;

    if (authHeader && (authHeader.startsWith('Bearer ') || authHeader.startsWith('test.'))) {
        // Authenticate using standard JWT session
        return authenticateToken(req, res, () => {
            tenantGuard(req, res, next);
        });
    } else if (isMasterKey(apiKey)) {
        // Authenticate using global master API key
        return next();
    } else {
        return res.status(401).json({ 
            message: 'Authentication required. Provide a valid Bearer token or master API key.' 
        });
    }
};

// 1. Device Registration (JWT Session or Master API Key)
router.post('/register', flexibleAuth, machineController.register);

// 2. Employee Biometric ID Mapping (JWT Session or Master API Key)
router.post('/map-employee', flexibleAuth, machineController.mapEmployee);

// 3. Single Attendance Sync Punch (Device x-api-key)
router.post('/attendance', apiKeyAuth, machineController.attendance);

// 4. Bulk Attendance Sync Punches (Device x-api-key)
router.post('/attendance/bulk', apiKeyAuth, machineController.attendanceBulk);

// 5. Get registered devices for a company (JWT Session or Master API Key)
router.get('/devices', flexibleAuth, machineController.getDevices);

// 6. Delete a registered device (JWT Session or Master API Key)
router.delete('/devices/:id', flexibleAuth, machineController.deleteDevice);

module.exports = router;
