const { DocumentService } = require('../services/documentService');

class ComplianceController {
    // [Admin] Fetch all pending KYC documents for the organization
    async getPending(req, res) {
        try {
            const companyId = req.user?.company_id;
            if (!companyId) return res.status(403).json({ message: 'Organization context missing' });

            const documents = await DocumentService.getAllPendingDocuments(companyId);
            res.json(documents);
        } catch (err) {
            console.error('Compliance error:', err);
            res.status(500).json({ message: 'Error fetching pending KYC queue' });
        }
    }

    // [Employee] Upload a specific document type
    async uploadDocument(req, res) {
        try {
            const { document_type } = req.body;
            const file = req.file;
            const companyId = req.user?.company_id;
            const employeeId = req.user?.employee_id;

            if (!file) return res.status(400).json({ message: 'No file uploaded' });
            if (!document_type) return res.status(400).json({ message: 'Document type is required' });

            // uploadedBy must be passed explicitly — it defaults to 'admin', and this is
            // the employee-facing upload. It gates the manager/admin notification and is
            // what employee_documents.uploaded_by is persisted as.
            const docId = await DocumentService.uploadDocument(employeeId, companyId, document_type, file, {}, null, 'employee');
            res.json({
                message: 'Document uploaded successfully',
                id: docId,
                status: 'pending'
            });
        } catch (err) {
            console.error('Upload Error:', err);
            res.status(500).json({ message: 'Failed to upload document to vault' });
        }
    }

    // [Employee] Get personal document vault status
    async getMyDocuments(req, res) {
        try {
            const companyId = req.user?.company_id;
            const employeeId = req.user?.employee_id;
            
            const docs = await DocumentService.getDocuments(employeeId, companyId);
            res.json(docs);
        } catch (err) {
            console.error('Fetch MyDocs Error:', err);
            res.status(500).json({ message: 'Error accessing personal vault' });
        }
    }

    // [Admin] Approve or Reject a document
    async processAction(req, res) {
        try {
            const { id } = req.params;
            const { status } = req.body; // 'verified' or 'rejected'
            const companyId = req.user?.company_id;

            if (!['verified', 'rejected'].includes(status)) {
                return res.status(400).json({ message: 'Invalid status update' });
            }

            const success = await DocumentService.updateDocumentStatus(id, companyId, status);
            if (success) {
                res.json({ message: `Digital Dossier updated: ${status}` });
            } else {
                res.status(404).json({ message: 'Document not found or access denied' });
            }
        } catch (err) {
            console.error('Compliance action error:', err);
            res.status(500).json({ message: 'Error processing compliance action' });
        }
    }

    // [Employee] Delete a document from their own vault
    async deleteDocument(req, res) {
        try {
            const { id } = req.params;
            const companyId = req.user?.company_id;
            const employeeId = req.user?.employee_id;

            const success = await DocumentService.deleteDocument(id, employeeId, companyId);
            if (success) {
                res.json({ message: 'Document removed from vault' });
            } else {
                res.status(404).json({ message: 'Document not found or access denied' });
            }
        } catch (err) {
            console.error('Delete Doc Error:', err);
            res.status(500).json({ message: 'Error removing document' });
        }
    }
}

module.exports = new ComplianceController();
