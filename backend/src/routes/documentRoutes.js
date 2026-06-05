const express = require('express');
const router = express.Router();
const { upload, DocumentService } = require('../services/documentService');
const { authenticate } = require('../middlewares/authMiddleware');
const tenantFilter = require('../middlewares/tenantMiddleware');
const db = require('../config/db');

router.use(authenticate, tenantFilter);

// Move multiple documents to a folder/batch
router.post('/batch-move', async (req, res) => {
    try {
        const { documentIds, batchName, batchId } = req.body;
        const companyId = req.company_id;

        if (!documentIds || !Array.isArray(documentIds) || documentIds.length === 0) {
            return res.status(400).json({ message: 'No documents selected' });
        }

        let targetBatchId = batchId;
        let targetBatchName = batchName;
        
        // If creating a new folder
        if (!targetBatchId && targetBatchName) {
            targetBatchId = `batch-${Date.now()}`;
        }

        // If batchId exists, ensure we have the name
        if (targetBatchId && !targetBatchName) {
            const existing = await db('employee_documents')
                .where('batch_id', targetBatchId)
                .andWhere('company_id', companyId)
                .first();
            if (existing) targetBatchName = existing.batch_name;
        }

        await db('employee_documents')
            .whereIn('id', documentIds)
            .andWhere('company_id', companyId)
            .update({
                batch_id: targetBatchId,
                batch_name: targetBatchName || 'Bulk Selection',
                batch_date: new Date().toISOString().split('T')[0]
            });

        res.json({ 
            message: 'Documents moved successfully', 
            batchId: targetBatchId,
            batchName: targetBatchName 
        });
    } catch (err) {
        console.error('>>> [VAULT]: Move Error:', err.message);
        res.status(400).json({ message: err.message });
    }
});

// Admin/Manager upload for specific employee
router.post('/employee/:employeeId/upload', upload.single('document'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const { employeeId } = req.params;
        const companyId = req.company_id;
        const documentType = req.body.documentType || 'Other';

        console.log(`>>> [VAULT]: Upload Request - EmpID: ${employeeId}, CoID: ${companyId}, Type: ${documentType}`);

        // Permission check: Only admin or managers can upload for others
        if (req.user.role_name === 'employee' && req.user.employee_id != employeeId) {
            return res.status(403).json({ message: 'Forbidden: You cannot upload for other employees' });
        }

        await DocumentService.uploadDocument(parseInt(employeeId), companyId, documentType, req.file);
        
        res.status(200).json({ 
            message: 'Document uploaded successfully',
            file: req.file.filename
        });
    } catch (err) {
        console.error('>>> [VAULT]: Upload Error:', err.message);
        res.status(400).json({ message: err.message });
    }
});

// Bulk Upload for Admin
router.post('/bulk-upload', upload.array('documents', 50), async (req, res) => {
    try {
        console.log('>>> [VAULT]: Bulk Upload Start - Files received:', req.files?.length);
        
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ message: 'No files uploaded' });
        }

        const companyId = req.company_id;
        const { 
            batchName, 
            batchDate, 
            batchDescription,
            isGrouped,
            categories,
            employeeIds,
            customNames
        } = req.body;
        
        console.log('>>> [VAULT]: Metadata:', { batchName, isGrouped });

        const batchId = isGrouped === 'true' ? `batch-${Date.now()}` : null;
        
        // Parse metadata if they are strings (from FormData)
        const cats = JSON.parse(categories || '[]');
        const emps = JSON.parse(employeeIds || '[]');
        const names = JSON.parse(customNames || '[]');

        const uploadPromises = [];
        
        req.files.forEach((file, index) => {
            let employeeIds = emps[index] || [];
            
            // If it's not an array (though it should be from JSON.parse), fix it
            if (!Array.isArray(employeeIds)) employeeIds = [employeeIds];
            
            // Fallback: If no employees selected, use uploader's ID
            if (employeeIds.length === 0) {
                employeeIds = [req.user.employee_id];
            }

            // Still null? Get first available
            const processFile = async () => {
                const docType = cats[index] || 'Other';
                const customFileName = names[index];
                const batchData = { batchId, batchName, batchDate, batchDescription };

                // If still empty, try to get uploader or first emp
                let finalIds = employeeIds.filter(id => id != null && id !== 'null' && id !== '');
                
                if (finalIds.length === 0) {
                    // Check if req.user.employee_id is actually valid
                    if (req.user && req.user.employee_id) {
                        finalIds = [req.user.employee_id];
                    } else {
                        // Hard Fetch: Get ANY valid employee ID from the company
                        const firstEmp = await db('employees').where('company_id', companyId).first();
                        if (firstEmp) {
                            finalIds = [firstEmp.id];
                        } else {
                            const anyEmp = await db('employees').first();
                            if (anyEmp) finalIds = [anyEmp.id];
                        }
                    }
                }

                // Create a record for EACH employee
                const innerPromises = finalIds.map(empId => 
                    DocumentService.uploadDocument(empId, companyId, docType, file, batchData, customFileName)
                );
                return Promise.all(innerPromises);
            };

            uploadPromises.push(processFile());
        });

        await Promise.all(uploadPromises);

        res.status(200).json({ 
            message: `${req.files.length} documents uploaded successfully`,
            batchId
        });
    } catch (err) {
        console.error('>>> [VAULT]: Bulk Upload Error:', err.message);
        res.status(400).json({ message: err.message });
    }
});

// Get all documents for the company (Admin Vault)
router.get('/vault', async (req, res) => {
    try {
        const companyId = req.company_id;
        
        // Return all documents for the company, including batch info and employee names
        const documents = await db('employee_documents as d')
            .leftJoin('employees as e', 'd.employee_id', 'e.id')
            .where('d.company_id', companyId)
            .select(
                'd.*',
                'e.first_name',
                'e.last_name',
                'e.employee_id_number'
            )
            .orderBy('d.created_at', 'desc');

        res.json(documents);
    } catch (err) {
        console.error('>>> [VAULT]: Fetch Error:', err.message);
        res.status(400).json({ message: err.message });
    }
});

// Get document history (Batches)
router.get('/history', async (req, res) => {
    try {
        const companyId = req.company_id;
        const batches = await db('employee_documents')
            .where('company_id', companyId)
            .whereNotNull('batch_id')
            .select('batch_id', 'batch_name', 'batch_date', 'batch_description')
            .count('id as file_count')
            .groupBy('batch_id', 'batch_name', 'batch_date', 'batch_description')
            .orderBy('batch_date', 'desc');
        
        res.json(batches);
    } catch (err) {
        console.error('>>> [VAULT]: History Error:', err.message);
        res.status(400).json({ message: err.message });
    }
});
router.post('/upload', upload.single('document'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const employeeId = req.user.employee_id;
        const companyId = req.company_id;
        const { documentType } = req.body;

        if (!employeeId) {
            return res.status(400).json({ message: 'Employee profile not found' });
        }

        await DocumentService.uploadDocument(employeeId, companyId, documentType, req.file, {}, null, 'employee');
        
        res.status(200).json({ 
            message: 'Document uploaded successfully',
            file: req.file.filename
        });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Get employee documents
router.get('/', async (req, res) => {
    try {
        const companyId = req.company_id;
        // If employeeId is passed in query (for Admin viewing a profile), use it. 
        // Otherwise use the authenticated user's ID.
        let targetEmployeeId = req.query.employeeId || req.user.employee_id;
        
        console.log(`>>> [VAULT]: Fetching for Target: ${targetEmployeeId}, Requester: ${req.user.employee_id}, Role: ${req.user.role_name}`);

        // Security: If not admin/manager, they can only view their own documents
        if (req.user.role_name === 'employee' && targetEmployeeId != req.user.employee_id) {
            return res.status(403).json({ message: 'Access Denied: You can only view your own vault.' });
        }

        const documents = await DocumentService.getDocuments(targetEmployeeId, companyId).then(docs => docs || []);
        console.log(`>>> [VAULT]: Found ${documents.length} documents for ${targetEmployeeId}`);
        res.json(documents);
    } catch (err) {
        console.error('>>> [VAULT]: Fetch Error:', err.message);
        res.status(400).json({ message: err.message });
    }
});

// Get global pending documents (Super Admin only)
router.get('/global-pending', async (req, res) => {
    try {
        if (req.user.role_name !== 'super_admin') {
            return res.status(403).json({ message: 'Forbidden' });
        }
        const documents = await DocumentService.getGlobalPendingDocuments();
        res.json(documents);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

const reportService = require('../services/reportService');

// ... (other routes)

// Delete a document
router.delete('/:id', async (req, res) => {
    try {
        const docId = req.params.id;
        const companyId = req.company_id;
        const employeeId = parseInt(req.query.employeeId || req.user.employee_id);

        console.log(`>>> [VAULT]: Deletion Request - DocID: ${docId}, EmpID: ${employeeId}, CoID: ${companyId}`);

        const success = await DocumentService.deleteDocument(parseInt(docId), employeeId, companyId);
        
        if (success) {
            res.json({ message: 'Document deleted successfully' });
        } else {
            console.warn(`>>> [VAULT]: Deletion Failed - Doc ${docId} not found or denied`);
            res.status(404).json({ message: `Document #${docId} not found for this context` });
        }
    } catch (err) {
        console.error('>>> [VAULT]: Deletion Error:', err.message);
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
