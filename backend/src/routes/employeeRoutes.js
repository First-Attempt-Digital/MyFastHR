const express = require('express');
const employeeController = require('../controllers/employeeController');
const { authenticate, authorize } = require('../middlewares/authMiddleware');
const tenantFilter = require('../middlewares/tenantMiddleware');

const { photoUpload } = require('../services/documentService');
const EmployeeService = require('../services/employeeService');

const router = express.Router();

// Onboarding Management (Admin)
router.get('/onboarding/pending', employeeController.getPendingOnboarding);
router.post('/onboarding/:id/approve', employeeController.approveOnboarding);
router.post('/onboarding/:id/reject', employeeController.rejectOnboarding);
router.post('/onboarding/:id/resend', employeeController.resendOnboarding);

// Asset Management
router.get('/:id/assets', async (req, res) => {
    try {
        const assets = await EmployeeService.getAssets(req.params.id, req.company_id);
        res.json(assets);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.post('/:id/assets', async (req, res) => {
    try {
        await EmployeeService.addAsset(req.params.id, req.company_id, req.body);
        const notificationService = require('../services/notificationService');
        await notificationService.notifyAction(req.user, req.params.id, 'Asset', `added asset "${req.body.asset_name || req.body.name || 'Asset'}"`);
        res.status(201).json({ message: 'Asset added' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.delete('/:id/assets/:assetId', authenticate, async (req, res) => {
    try {
        await EmployeeService.deleteAsset(req.params.assetId, req.params.id, req.user.company_id);
        const notificationService = require('../services/notificationService');
        await notificationService.notifyAction(req.user, req.params.id, 'Asset', `deleted asset ID ${req.params.assetId}`);
        res.json({ message: 'Asset deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.put('/:id/assets/:assetId', authenticate, async (req, res) => {
    try {
        await EmployeeService.updateAsset(req.params.assetId, req.params.id, req.user.company_id, req.body);
        const notificationService = require('../services/notificationService');
        await notificationService.notifyAction(req.user, req.params.id, 'Asset', `updated asset "${req.body.asset_name || req.body.name || 'Asset'}"`);
        res.json({ message: 'Asset updated' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Education Routes
router.post('/:id/education', authenticate, async (req, res) => {
    try {
        await EmployeeService.addEducation(req.params.id, req.user.company_id, req.body);
        const notificationService = require('../services/notificationService');
        await notificationService.notifyAction(req.user, req.params.id, 'Education', `added education qualification "${req.body.degree || req.body.qualification || 'Education'}"`);
        res.status(201).json({ message: 'Education added' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.put('/:id/education/:eduId', authenticate, async (req, res) => {
    try {
        await EmployeeService.updateEducation(req.params.eduId, req.params.id, req.user.company_id, req.body);
        const notificationService = require('../services/notificationService');
        await notificationService.notifyAction(req.user, req.params.id, 'Education', `updated education qualification "${req.body.degree || req.body.qualification || 'Education'}"`);
        res.json({ message: 'Education updated' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.delete('/:id/education/:eduId', authenticate, async (req, res) => {
    try {
        await EmployeeService.deleteEducation(req.params.eduId, req.params.id, req.user.company_id);
        const notificationService = require('../services/notificationService');
        await notificationService.notifyAction(req.user, req.params.id, 'Education', `deleted education qualification ID ${req.params.eduId}`);
        res.json({ message: 'Education deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Course Routes
router.post('/:id/courses', authenticate, async (req, res) => {
    try {
        await EmployeeService.addCourse(req.params.id, req.user.company_id, req.body);
        const notificationService = require('../services/notificationService');
        await notificationService.notifyAction(req.user, req.params.id, 'Course', `added course "${req.body.course_name || req.body.title || 'Course'}"`);
        res.status(201).json({ message: 'Course added' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.put('/:id/courses/:courseId', authenticate, async (req, res) => {
    try {
        await EmployeeService.updateCourse(req.params.courseId, req.params.id, req.user.company_id, req.body);
        const notificationService = require('../services/notificationService');
        await notificationService.notifyAction(req.user, req.params.id, 'Course', `updated course "${req.body.course_name || req.body.title || 'Course'}"`);
        res.json({ message: 'Course updated' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.delete('/:id/courses/:courseId', authenticate, async (req, res) => {
    try {
        await EmployeeService.deleteCourse(req.params.courseId, req.params.id, req.user.company_id);
        const notificationService = require('../services/notificationService');
        await notificationService.notifyAction(req.user, req.params.id, 'Course', `deleted course ID ${req.params.courseId}`);
        res.json({ message: 'Course deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.post('/:id/photo', photoUpload.single('photo'), employeeController.updatePhoto);

router.get('/search', async (req, res) => {
    try {
        const results = await EmployeeService.search(req.query.q, req.company_id);
        res.json(results);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.get('/', employeeController.list);
router.post('/', employeeController.create);

const multer = require('multer');
const uploadCSV = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }
});
router.post('/bulk-import', authorize(['company_admin', 'super_admin']), uploadCSV.single('file'), employeeController.bulkImport);
router.post('/bulk-delete', authorize(['company_admin', 'super_admin']), employeeController.bulkDelete);

router.get('/managers', employeeController.getManagers);
router.get('/options/:field', employeeController.getOptions);
router.get('/:id', employeeController.getDetail);
router.put('/:id', employeeController.update);
router.patch('/:id/fire', employeeController.fire);
router.patch('/:id/activate', employeeController.activate);
router.delete('/:id', employeeController.remove);
router.post('/:id/credentials', authorize(['company_admin', 'manager', 'employee']), employeeController.resetCredentials);
router.post('/:id/generate-password-token', employeeController.generatePasswordToken);

const mailService = require('../services/mailService');
router.post('/send-offer-letter', authenticate, async (req, res) => {
    try {
        const { to, name, designation, pdfBase64, filename } = req.body;
        if (!to || !pdfBase64) {
            return res.status(400).json({ message: 'Missing recipient email or PDF data' });
        }
        const pdfBuffer = Buffer.from(pdfBase64, 'base64');
        const success = await mailService.sendOfferLetterEmail(to, name, designation, pdfBuffer, filename || 'Offer_Letter.pdf');
        if (success) {
            res.json({ message: 'Offer letter sent successfully' });
        } else {
            res.status(500).json({ message: 'Failed to send email' });
        }
    } catch (err) {
        console.error('>>> [MAIL]: Send Offer Letter Error:', err.message);
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
