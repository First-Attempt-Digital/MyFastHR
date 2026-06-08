const employeeService = require('../services/employeeService');

class EmployeeController {
    async list(req, res) {
        try {
            const filters = {
                search: req.query.search,
                department: req.query.department
            };
            const employees = await employeeService.getAllEmployees(req.user, filters);
            res.json(employees);
        } catch (err) {
            res.status(500).json({ message: err.message });
        }
    }

    async create(req, res) {
        try {
            const id = await employeeService.addEmployee(req.user.company_id, req.body);
            res.status(201).json({ id, message: 'Employee created and onboarding email sent successfully.' });
        } catch (err) {
            res.status(400).json({ message: err.message });
        }
    }

    async getDetail(req, res) {
        try {
            const employee = await employeeService.getEmployee(req.params.id, req.user);
            if (!employee) return res.status(404).json({ message: 'Employee not found' });
            res.json(employee);
        } catch (err) {
            res.status(500).json({ message: err.message });
        }
    }

    async getManagers(req, res) {
        try {
            const managers = await employeeService.getManagers(req.user.company_id);
            res.json(managers);
        } catch (err) {
            res.status(500).json({ message: err.message });
        }
    }

    async update(req, res) {
        try {
            await employeeService.updateEmployee(req.params.id, req.user.company_id, req.body, req.user);
            const notificationService = require('../services/notificationService');
            await notificationService.notifyAction(req.user, req.params.id, 'Profile Info', 'updated profile details');
            res.json({ message: 'Employee updated successfully' });
        } catch (err) {
            res.status(400).json({ message: err.message });
        }
    }

    async resetCredentials(req, res) {
        try {
            if (req.user.role_name === 'employee' && parseInt(req.params.id) !== parseInt(req.user.employee_id)) {
                return res.status(403).json({ message: 'Access denied: You can only regenerate your own credentials' });
            }
            const password = await employeeService.resetEmployeePassword(req.params.id, req.user);
            const notificationService = require('../services/notificationService');
            await notificationService.notifyAction(req.user, req.params.id, 'Credentials', 'reset/regenerated access credentials');
            res.json({ password, message: 'New credentials generated successfully' });
        } catch (err) {
            res.status(403).json({ message: err.message });
        }
    }

    async fire(req, res) {
        try {
            await employeeService.fireEmployee(req.params.id, req.user);
            const notificationService = require('../services/notificationService');
            await notificationService.notifyAction(req.user, req.params.id, 'Employment Status', 'deactivated / marked as inactive');
            res.json({ message: 'Employee node successfully fired and deactivated.' });
        } catch (err) {
            res.status(400).json({ message: err.message });
        }
    }

    async activate(req, res) {
        try {
            await employeeService.activateEmployee(req.params.id, req.user);
            const notificationService = require('../services/notificationService');
            await notificationService.notifyAction(req.user, req.params.id, 'Employment Status', 'activated / marked as active');
            res.json({ message: 'Employee node successfully reactivated and access restored.' });
        } catch (err) {
            res.status(400).json({ message: err.message });
        }
    }

    async getOptions(req, res) {
        try {
            const options = await employeeService.getOptions(req.user.company_id, req.params.field);
            res.json(options);
        } catch (err) {
            res.status(500).json({ message: err.message });
        }
    }

    async updatePhoto(req, res) {
        try {
            if (!req.file) return res.status(400).json({ message: 'No photo provided' });
            const photoPath = req.file.filename;
            await employeeService.updateProfilePhoto(req.params.id, req.user.company_id, photoPath);
            const notificationService = require('../services/notificationService');
            await notificationService.notifyAction(req.user, req.params.id, 'Profile Photo', 'updated profile photo');
            res.json({ message: 'Profile photo updated successfully', photo: photoPath });
        } catch (err) {
            res.status(400).json({ message: err.message });
        }
    }

    async remove(req, res) {
        try {
            await employeeService.deleteEmployee(req.params.id, req.user);
            res.json({ message: 'Employee node permanently removed from matrix.' });
        } catch (err) {
            res.status(400).json({ message: err.message });
        }
    }

    async bulkDelete(req, res) {
        try {
            const { ids } = req.body;
            if (!ids || !Array.isArray(ids) || ids.length === 0) {
                return res.status(400).json({ message: 'No employee IDs provided for deletion.' });
            }
            await employeeService.bulkDeleteEmployees(ids, req.user);
            res.json({ message: 'Selected employees permanently removed from matrix.' });
        } catch (err) {
            res.status(400).json({ message: err.message });
        }
    }

    async generateToken(req, res) {
        try {
            const token = await employeeService.generateOnboardingToken(req.params.id, req.user.company_id);
            res.json({ token, message: 'Onboarding link generated.' });
        } catch (err) {
            res.status(400).json({ message: err.message });
        }
    }

    async getOnboardingProfile(req, res) {
        try {
            const employee = await employeeService.getEmployeeByToken(req.params.token);
            if (!employee) return res.status(404).json({ message: 'Link invalid or expired.' });
            res.json(employee);
        } catch (err) {
            res.status(500).json({ message: err.message });
        }
    }

    async submitOnboarding(req, res) {
        try {
            await employeeService.updateOnboardingData(req.params.token, req.body);
            res.json({ message: 'Profile updated successfully.' });
        } catch (err) {
            res.status(400).json({ message: err.message });
        }
    }

    async publicUploadDocument(req, res) {
        try {
            if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
            const { documentType, customName } = req.body;
            await employeeService.uploadDocumentByToken(req.params.token, req.file, documentType, customName);
            res.json({ message: 'Document uploaded successfully.' });
        } catch (err) {
            res.status(400).json({ message: err.message });
        }
    }

    async deleteEducation(req, res) {
        try {
            await employeeService.deleteEducationByToken(req.params.token, req.params.id);
            res.json({ message: 'Record removed.' });
        } catch (err) {
            res.status(400).json({ message: err.message });
        }
    }

    async deleteCourse(req, res) {
        try {
            await employeeService.deleteCourseByToken(req.params.token, req.params.id);
            res.json({ message: 'Record removed.' });
        } catch (err) {
            res.status(400).json({ message: err.message });
        }
    }

    async deleteDocument(req, res) {
        try {
            console.log(`>>> [ONBOARDING]: Deletion request for Document ${req.params.id} via Token ${req.params.token.substring(0, 8)}...`);
            await employeeService.deleteDocumentByToken(req.params.token, req.params.id);
            res.json({ message: 'Document removed.' });
        } catch (err) {
            console.error(`>>> [ONBOARDING]: Deletion failed: ${err.message}`);
            res.status(400).json({ message: err.message });
        }
    }

    async finalizeSection(req, res) {
        try {
            await employeeService.finalizeOnboardingSection(req.params.token, req.body.section);
            res.json({ message: 'Section finalized.' });
        } catch (err) {
            res.status(400).json({ message: err.message });
        }
    }

    async submitFinalOnboarding(req, res) {
        try {
            await employeeService.confirmOnboardingData(req.params.token);
            res.json({ message: 'Onboarding submitted successfully. Your link is now expired.' });
        } catch (err) {
            res.status(400).json({ message: err.message });
        }
    }

    async getPendingOnboarding(req, res) {
        try {
            // Use company_id from tenant guard
            const pending = await employeeService.getPendingOnboarding(req.company_id, req.user);
            res.json(pending);
        } catch (err) {
            res.status(500).json({ message: err.message });
        }
    }

    async approveOnboarding(req, res) {
        try {
            await employeeService.approveOnboarding(req.params.id, req.company_id);
            res.json({ message: 'Employee onboarding approved.' });
        } catch (err) {
            res.status(400).json({ message: err.message });
        }
    }

    async rejectOnboarding(req, res) {
        try {
            const { reason } = req.body;
            await employeeService.rejectOnboarding(req.params.id, req.company_id, reason);
            res.json({ message: 'Employee record removed.' });
        } catch (err) {
            res.status(400).json({ message: err.message });
        }
    }

    async resendOnboarding(req, res) {
        try {
            await employeeService.resendOnboarding(req.params.id, req.company_id);
            res.json({ message: 'Onboarding link resent successfully.' });
        } catch (err) {
            res.status(400).json({ message: err.message });
        }
    }

    async generatePasswordToken(req, res) {
        try {
            if (req.user.role_name === 'employee' && parseInt(req.params.id) !== parseInt(req.user.employee_id)) {
                return res.status(403).json({ message: 'Access denied: You can only generate link for yourself' });
            }
            const userId = await employeeService.ensureUserAccount(req.params.id, req.user.company_id);
            const authService = require('../services/authService');
            const token = authService.generatePasswordSetupToken(userId);
            res.json({ token, message: 'Password reset link generated.' });
        } catch (err) {
            res.status(400).json({ message: err.message });
        }
    }

    async bulkImport(req, res) {
        try {
            if (!req.file) {
                return res.status(400).json({ message: 'No file uploaded. Please upload a CSV file.' });
            }

            // Strip UTF-8 BOM if present
            const csvContent = req.file.buffer.toString('utf-8').replace(/^\uFEFF/, '');
            
            // Detect delimiter dynamically from the first line
            const firstLine = csvContent.split(/\r?\n/)[0] || '';
            let delimiter = ',';
            const commas = (firstLine.match(/,/g) || []).length;
            const semicolons = (firstLine.match(/;/g) || []).length;
            const tabs = (firstLine.match(/\t/g) || []).length;
            
            if (semicolons > commas && semicolons > tabs) {
                delimiter = ';';
            } else if (tabs > commas && tabs > semicolons) {
                delimiter = '\t';
            }
            
            // Standard robust CSV parsing logic with custom delimiter
            const parseCSV = (text, delim = ',') => {
                const lines = [];
                let row = [""];
                let inQuotes = false;

                for (let i = 0; i < text.length; i++) {
                    const c = text[i];
                    const next = text[i+1];

                    if (c === '"') {
                        if (inQuotes && next === '"') {
                            row[row.length - 1] += '"';
                            i++;
                        } else {
                            inQuotes = !inQuotes;
                        }
                    } else if (c === delim && !inQuotes) {
                        row.push('');
                    } else if ((c === '\r' || c === '\n') && !inQuotes) {
                        if (c === '\r' && next === '\n') {
                            i++;
                        }
                        lines.push(row);
                        row = [''];
                    } else {
                        row[row.length - 1] += c;
                    }
                }
                if (row.length > 1 || row[0] !== '') {
                    lines.push(row);
                }
                return lines;
            };

            const rawRows = parseCSV(csvContent, delimiter);
            if (rawRows.length < 2) {
                return res.status(400).json({ message: 'The uploaded file is empty or does not contain headers.' });
            }

            // Map headers to indices
            const headers = rawRows[0].map(h => h.trim().toLowerCase());
            const dataRows = [];

            for (let i = 1; i < rawRows.length; i++) {
                const row = rawRows[i];
                // Skip completely empty rows
                if (row.length === 0 || (row.length === 1 && row[0].trim() === '')) {
                    continue;
                }

                const rowData = {};
                headers.forEach((header, index) => {
                    if (row[index] !== undefined) {
                        rowData[header] = row[index].trim();
                    } else {
                        rowData[header] = '';
                    }
                });
                dataRows.push({ rowIndex: i + 1, data: rowData });
            }

            const companyId = req.user.company_id;
            const report = await employeeService.bulkImport(companyId, dataRows);
            res.json(report);
        } catch (err) {
            console.error('[BULK IMPORT ERROR]:', err);
            res.status(500).json({ message: err.message || 'Internal server error during bulk import' });
        }
    }
}

module.exports = new EmployeeController();
