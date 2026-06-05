const PDFDocument = require('pdfkit');
const db = require('../config/db');

class ReportService {
    async generateKYCCertificate(docId, companyId) {
        // Fetch document and employee details
        const data = await db('employee_documents as d')
            .join('employees as e', 'd.employee_id', 'e.id')
            .join('companies as c', 'd.company_id', 'c.id')
            .where({ 'd.id': docId, 'd.company_id': companyId })
            .select(
                'd.*',
                'e.first_name',
                'e.last_name',
                'e.employee_id_number',
                'e.designation',
                'c.name as company_name'
            )
            .first();

        if (!data) throw new Error('Document not found');

        return new Promise((resolve, reject) => {
            const doc = new PDFDocument({ margin: 50, size: 'A4' });
            let buffers = [];
            doc.on('data', buffers.push.bind(buffers));
            doc.on('end', () => resolve(Buffer.concat(buffers)));

            // Header - Elite Branding
            doc.rect(0, 0, 595.28, 80).fill('#6366f1');
            doc.fillColor('#ffffff')
               .fontSize(24)
               .font('Helvetica-Bold')
               .text('MyFastHR Identity Node', 50, 25);
            
            doc.fontSize(10)
               .text('CORPORATE VERIFICATION CERTIFICATE', 50, 55);

            // Watermark (Mock)
            doc.fillColor('#f1f5f9')
               .fontSize(60)
               .opacity(0.1)
               .text('VERIFIED', 150, 400, { rotate: 45 });
            doc.opacity(1);

            // Body
            doc.fillColor('#1e293b')
               .fontSize(12)
               .font('Helvetica')
               .text(`Date of Issue: ${new Date().toLocaleDateString()}`, 400, 100);

            doc.moveDown(2);
            doc.fontSize(20)
               .font('Helvetica-Bold')
               .text('Verification Summary', 50, 150);
            
            doc.rect(50, 180, 495, 2).fill('#f1f5f9');

            // Details Grid
            const startY = 210;
            doc.fillColor('#64748b').fontSize(10).text('EMPLOYEE IDENTITY', 50, startY);
            doc.fillColor('#1e293b').fontSize(14).font('Helvetica-Bold').text(`${data.first_name} ${data.last_name}`, 50, startY + 15);

            doc.fillColor('#64748b').fontSize(10).text('EMPLOYEE ID', 300, startY);
            doc.fillColor('#1e293b').fontSize(14).font('Helvetica-Bold').text(data.employee_id_number || 'N/A', 300, startY + 15);

            doc.fillColor('#64748b').fontSize(10).text('ORGANIZATION', 50, startY + 60);
            doc.fillColor('#1e293b').fontSize(14).font('Helvetica-Bold').text(data.company_name, 50, startY + 75);

            doc.fillColor('#64748b').fontSize(10).text('DESIGNATION', 300, startY + 60);
            doc.fillColor('#1e293b').fontSize(14).font('Helvetica-Bold').text(data.designation || 'N/A', 300, startY + 75);

            doc.moveDown(4);
            doc.rect(50, doc.y, 495, 120).fill('#f8fafc');
            
            const tableY = doc.y - 110;
            doc.fillColor('#6366f1').font('Helvetica-Bold').fontSize(12).text('DOCUMENT AUDIT LOG', 70, tableY);
            
            doc.fillColor('#1e293b').font('Helvetica').fontSize(10);
            doc.text(`Document Type: ${data.document_type}`, 70, tableY + 30);
            doc.text(`Verification Status: ${data.status.toUpperCase()}`, 70, tableY + 50);
            doc.text(`File Reference: ${data.file_name}`, 70, tableY + 70);
            doc.text(`System Timestamp: ${new Date(data.updated_at).toLocaleString()}`, 70, tableY + 90);

            // Footer
            doc.rect(0, 781.89, 595.28, 60).fill('#f8fafc');
            doc.fillColor('#94a3b8')
               .fontSize(8)
               .text('This is a system-generated document and does not require a physical signature.', 50, 800, { align: 'center' });
            doc.text('© 2026 MyFastHR Platform Node. Built with Intelligence.', 50, 815, { align: 'center' });

            doc.end();
        });
    }
}

module.exports = new ReportService();
