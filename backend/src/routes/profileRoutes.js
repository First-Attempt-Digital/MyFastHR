const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profileController');
const { authenticate } = require('../middlewares/authMiddleware');

router.get('/me', authenticate, profileController.getMyProfile);
router.put('/me', authenticate, profileController.updateMyProfile);

module.exports = router;
