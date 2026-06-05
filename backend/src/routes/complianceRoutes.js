const express = require('express');
const router = express.Router();
const complianceController = require('../controllers/complianceController');
const { upload } = require('../services/documentService');

// Auth and Tenancy is handled at app.js level

// Employee Routes
router.post('/upload', upload.single('document'), complianceController.uploadDocument);
router.get('/my-docs', complianceController.getMyDocuments);
router.delete('/:id', complianceController.deleteDocument);

// Admin Routes (Compliance Queue)
router.get('/pending', complianceController.getPending);
router.post('/action/:id', complianceController.processAction);

module.exports = router;
