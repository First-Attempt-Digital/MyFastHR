const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticate, hasPermission } = require('../middlewares/authMiddleware');
const rateLimit = require('express-rate-limit');

const systemController = require('../controllers/systemController');

const sqlSandboxLimiter = rateLimit({
    windowMs: 5 * 60 * 1000,
    max: 60,
    message: { message: 'Too many SQL Sandbox queries. Please wait a few minutes before retrying.' }
});

// All routes here require super_admin permission
router.use(authenticate);
router.use(hasPermission(['manage_tenants']));

const path = require('path');
const fs = require('fs');
const multer = require('multer');

// Configure Multer for Tenant custom logo storage
const companyLogoStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const absolutePath = path.resolve(__dirname, '../../uploads/tenants');
        if (!fs.existsSync(absolutePath)) {
            fs.mkdirSync(absolutePath, { recursive: true });
        }
        cb(null, absolutePath);
    },
    filename: (req, file, cb) => {
        const suffix = Date.now();
        const ext = path.extname(file.originalname);
        cb(null, `tenant-logo-${req.params.id}-${suffix}${ext}`);
    }
});

const companyLogoUpload = multer({
    storage: companyLogoStorage,
    limits: { fileSize: 5 * 1024 * 1024 }
});

router.get('/companies', adminController.getAllCompanies);
router.post('/companies', adminController.createCompany);
router.patch('/companies/:id/status', adminController.updateCompanyStatus);
router.patch('/companies/:id/features', adminController.updateCompanyFeatureFlags);
router.put('/companies/:id', companyLogoUpload.single('logo'), adminController.updateCompany);
router.delete('/companies/:id', adminController.deleteCompany);
router.post('/companies/:id/reset-password', adminController.resetCompanyAdminPassword);
router.get('/stats', adminController.getPlatformStats);
router.post('/companies/:id/impersonate', adminController.impersonateCompanyAdmin);
router.get('/system/tables', adminController.getSystemTables);
router.post('/system/backup', adminController.createBackup);
router.get('/system/backups', adminController.listBackups);
router.post('/system/backups/:filename/restore', adminController.restoreBackup);
router.get('/system/backups/:filename/download', adminController.downloadBackup);
router.get('/system/storage-telemetry', adminController.getStorageTelemetry);
router.get('/billing/stats', adminController.getBillingStats);
router.get('/system/audit-logs', adminController.getAuditLogs);

// Invoices & Billing
router.get('/companies/:id/invoices', adminController.getCompanyInvoices);
router.post('/companies/:id/invoices', adminController.createCompanyInvoice);
router.patch('/invoices/:invoiceId/status', adminController.updateInvoiceStatus);

// Mainframe Monitoring
router.get('/mainframe-stats', systemController.getMainframeStats);
router.post('/system/command', adminController.executeSystemCommand);
// The SQL Sandbox runs arbitrary read queries as the DB user. The global limiter is
// 5000/15min, which is no constraint at all for a scripted scrape through a hijacked
// super-admin session, so this route gets its own tighter budget.
router.post('/system/query', sqlSandboxLimiter, adminController.executeSqlQuery);
router.get('/system/settings', adminController.getSystemSettings);
router.post('/system/freeze', adminController.toggleSystemFreeze);

const telemetryController = require('../controllers/telemetryController');
router.get('/system/telemetry', telemetryController.getTelemetry);

// Global Branding Configuration
const brandingController = require('../controllers/brandingController');
router.get('/branding', brandingController.getAdminBranding);
router.post('/branding', brandingController.getUploadMiddleware(), brandingController.updateBranding);

// Case Studies Management (Super Admin)
router.post('/case-studies', async (req, res) => {
    try {
        const { title, sector, size, challenge, solution, metrics, color, bg, summaryText } = req.body;
        if (!title || !sector || !challenge || !solution) {
            return res.status(400).json({ message: 'Title, sector, challenge, and solution are required.' });
        }
        const db = require('../config/db');
        const [id] = await db('case_studies').insert({
            title,
            sector,
            size: size || '',
            challenge,
            solution,
            metrics: metrics ? (typeof metrics === 'string' ? metrics : JSON.stringify(metrics)) : '[]',
            color: color || '#7A3F91',
            bg: bg || '#F2EAF7',
            summaryText: summaryText || '',
            created_at: db.fn.now(),
            updated_at: db.fn.now()
        });
        res.status(201).json({ id, message: 'Case study uploaded successfully.' });
    } catch (err) {
        console.error('Failed to create case study:', err);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

router.delete('/case-studies/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const db = require('../config/db');
        const deleted = await db('case_studies').where({ id }).del();
        if (!deleted) {
            return res.status(404).json({ message: 'Case study not found.' });
        }
        res.json({ message: 'Case study deleted successfully.' });
    } catch (err) {
        console.error('Failed to delete case study:', err);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

module.exports = router;
