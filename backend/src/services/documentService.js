const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../config/db');
const notificationService = require('./notificationService');

// Ensure upload directories exist
const uploadDir = path.join(__dirname, '../../uploads/kyc');
const photoDir = path.join(__dirname, '../../uploads/kyc');

[uploadDir, photoDir].forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|pdf/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        if (extname && mimetype) {
            return cb(null, true);
        } else {
            cb(new Error('Only Images and PDFs are allowed'));
        }
    }
});

const photoStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, photoDir);
    },
    filename: (req, file, cb) => {
        const employeeId = req.params.id || 'new';
        cb(null, `photo-${employeeId}-${Date.now()}${path.extname(file.originalname)}`);
    }
});

const photoUpload = multer({
    storage: photoStorage,
    limits: { fileSize: 2 * 1024 * 1024 }, // 2MB limit for photos
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        if (extname && mimetype) {
            cb(null, true);
        } else {
            cb(new Error('Only JPEG, JPG, and PNG images are allowed for profile photos'));
        }
    }
});

class DocumentService {
    async uploadDocument(employeeId, companyId, docType, file, batchData = {}, customName = null, uploadedBy = 'admin') {
        const [id] = await db('employee_documents').insert({
            employee_id: employeeId || null,
            company_id: companyId,
            document_type: docType,
            file_name: customName || file.originalname,
            file_path: file.filename,
            mime_type: file.mimetype,
            file_size: file.size,
            status: 'pending',
            uploaded_by: uploadedBy,
            custom_name: customName,
            batch_id: batchData.batchId || null,
            batch_name: batchData.batchName || null,
            batch_date: batchData.batchDate || null,
            batch_description: batchData.batchDescription || null
        });

        // Notify Manager and Admin if uploaded by employee
        if (uploadedBy === 'employee' && employeeId) {
            try {
                const employee = await db('employees').where('id', employeeId).first();
                if (employee) {
                    const recipientUsers = [];
                    if (employee.manager_id) {
                         const manager = await db('employees').where('id', employee.manager_id).first();
                         if (manager && manager.user_id) recipientUsers.push(manager.user_id);
                    }

                    const admins = await db('users')
                        .join('roles', 'users.role_id', 'roles.id')
                        .where('users.company_id', companyId)
                        .whereIn('roles.name', ['company_admin', 'super_admin'])
                        .select('users.id as id');

                    admins.forEach(a => {
                        if (!recipientUsers.includes(a.id)) {
                            recipientUsers.push(a.id);
                        }
                    });

                    for (const rId of recipientUsers) {
                        await notificationService.createNotification(
                            rId,
                            companyId,
                            'New Document Uploaded',
                            `${employee.first_name} uploaded a new document: ${docType}.`,
                            'info'
                        );
                    }
                }
            } catch (err) {
                console.error('Document upload notification failed:', err.message);
            }
        }

        return id;
    }

    async getDocuments(employeeId, companyId) {
        return await db('employee_documents')
            .where({ employee_id: employeeId, company_id: companyId })
            .select('*')
            .orderBy('created_at', 'desc');
    }

    async getAllPendingDocuments(companyId) {
        return await db('employee_documents as d')
            .join('employees as e', 'd.employee_id', 'e.id')
            .where('d.company_id', companyId)
            .where('d.status', 'pending')
            .select(
                'd.*',
                'e.first_name',
                'e.last_name',
                'e.employee_id_number',
                'e.designation',
                'e.phone'
            )
            .orderBy('d.created_at', 'desc');
    }

    async getGlobalPendingDocuments() {
        return await db('employee_documents as d')
            .join('employees as e', 'd.employee_id', 'e.id')
            .join('companies as c', 'd.company_id', 'c.id')
            .where('d.status', 'pending')
            .select(
                'd.*',
                'e.first_name',
                'e.last_name',
                'e.employee_id_number',
                'c.name as company_name'
            )
            .orderBy('d.created_at', 'desc');
    }

    async updateDocumentStatus(docId, companyId, status) {
        const updateCount = await db('employee_documents')
            .where({ id: docId, company_id: companyId })
            .update({ 
                status,
                updated_at: db.raw('CURRENT_TIMESTAMP')
            });

        if (updateCount > 0) {
            // Get the document and user info to notify
            const doc = await db('employee_documents as d')
                .join('employees as e', 'd.employee_id', 'e.id')
                .where('d.id', docId)
                .select('e.user_id', 'd.document_type')
                .first();

            if (doc && doc.user_id) {
                const title = `Identity Hub: ${doc.document_type} ${status === 'verified' ? 'Verified' : 'Rejected'}`;
                const message = status === 'verified' 
                    ? `Your ${doc.document_type} has been successfully verified by the organization.` 
                    : `Your ${doc.document_type} was rejected. Please re-upload a clear copy in the Identity Vault.`;
                const type = status === 'verified' ? 'success' : 'error';
                
                await notificationService.createNotification(doc.user_id, companyId, title, message, type);
            }
        }
        return updateCount;
    }

    async deleteDocument(docId, employeeId, companyId) {
        console.log(`>>> [VAULT]: Attempting Delete - ID: ${docId}, Emp: ${employeeId}, Co: ${companyId}`);
        
        // Find the document with a more flexible query
        const doc = await db('employee_documents')
            .where('id', docId)
            .first();
        
        if (!doc) {
            console.error(`>>> [VAULT]: Document ${docId} NOT FOUND in DB`);
            // Fallback: Try to find by employee and some other criteria if ID failed? 
            // For now, let's just return false but log it clearly
            return false;
        }

        // Security check: Use loose equality for IDs
        if (companyId && doc.company_id != companyId) {
            console.warn(`>>> [VAULT]: CoID Mismatch - DB: ${doc.company_id}, REQ: ${companyId}`);
            return false;
        }
        
        if (employeeId && doc.employee_id != employeeId) {
            console.warn(`>>> [VAULT]: EmpID Mismatch - DB: ${doc.employee_id}, REQ: ${employeeId}`);
            return false;
        }

        // Delete physical file
        const filePath = path.join(doc.document_type === 'photo' ? photoDir : uploadDir, doc.file_path);
        if (fs.existsSync(filePath)) {
            try {
                fs.unlinkSync(filePath);
            } catch (e) {
                console.error('File deletion error:', e.message);
            }
        }

        // Delete DB record
        return await db('employee_documents')
            .where({ id: docId })
            .delete();
    }
}

module.exports = { upload, photoUpload, DocumentService: new DocumentService() };
