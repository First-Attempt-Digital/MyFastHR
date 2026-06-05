const express = require('express');
const authController = require('../controllers/authController');
const { authenticate } = require('../middlewares/authMiddleware');
const router = express.Router();

router.post('/login', authController.login);
router.post('/refresh', authController.refresh);
router.post('/set-password', authController.setPassword);
router.post('/request-otp', authController.requestOTP);
router.post('/verify-otp', authController.verifyOTP);
router.post('/change-password', authenticate, authController.changePassword);
router.get('/tenant-branding/:slug', authController.getTenantBranding);

module.exports = router;
