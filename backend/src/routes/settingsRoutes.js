const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');

router.get('/role-matrix', settingsController.getRoleMatrix);
router.post('/role-matrix', settingsController.updatePermissions);

router.get('/working-rules', settingsController.getWorkingRules);
router.post('/working-rules', settingsController.updateWorkingRules);

router.get('/holidays', settingsController.getHolidays);
router.post('/holidays', settingsController.addHoliday);
router.put('/holidays/:id', settingsController.updateHoliday);
router.delete('/holidays/:id', settingsController.deleteHoliday);

router.get('/number-series', settingsController.getNumberSeries);
router.put('/number-series/:id', settingsController.updateNumberSeries);

// Delete Security Key Routes
router.post('/delete-key/verify', settingsController.verifyDeleteKey);
router.post('/delete-key/update', settingsController.updateDeleteKey);
router.post('/delete-key/request-reset', settingsController.requestDeleteKeyReset);
router.post('/delete-key/reset', settingsController.resetDeleteKey);

module.exports = router;
