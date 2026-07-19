const machineAttendanceService = require('../services/machineAttendanceService');
const db = require('../config/db');

class MachineController {
    /**
     * Registers a new biometric device for a company.
     * Accessible by JWT authenticated admin users or via a Master API Key.
     */
    async register(req, res) {
        try {
            let companyId = null;
            
            // Check if authenticated via user session (JWT)
            if (req.user) {
                if (req.user.role_name === 'super_admin' && (req.body.company_id || req.query.company_id)) {
                    companyId = parseInt(req.body.company_id) || parseInt(req.query.company_id);
                } else {
                    companyId = req.user.company_id;
                }
            } else {
                // Check master key bypass
                const apiKey = req.headers['x-api-key'] || req.query.api_key || req.body?.api_key;
                const masterKey = process.env.BIOMETRIC_API_KEY;

                if (apiKey && !!masterKey && apiKey === masterKey) {
                    companyId = parseInt(req.body.company_id) || parseInt(req.query.company_id);
                }
            }

            if (!companyId) {
                return res.status(401).json({ message: 'Unauthorized. Valid company admin session or master API key is required.' });
            }

            // Verify company exists
            const company = await db('companies').where({ id: companyId }).first();
            if (!company) {
                return res.status(404).json({ message: `Company with ID ${companyId} not found.` });
            }

            const result = await machineAttendanceService.registerDevice(companyId, req.body);
            res.status(201).json(result);
        } catch (err) {
            console.error('[BIOMETRIC-REG-ERROR]:', err.message);
            res.status(400).json({ message: err.message });
        }
    }

    /**
     * Maps an employee to a biometric enrollment ID.
     */
    async mapEmployee(req, res) {
        try {
            let companyId = null;

            if (req.user) {
                if (req.user.role_name === 'super_admin' && (req.body.company_id || req.query.company_id)) {
                    companyId = parseInt(req.body.company_id) || parseInt(req.query.company_id);
                } else {
                    companyId = req.user.company_id;
                }
            } else {
                const apiKey = req.headers['x-api-key'] || req.query.api_key || req.body?.api_key;
                const masterKey = process.env.BIOMETRIC_API_KEY;

                if (apiKey && !!masterKey && apiKey === masterKey) {
                    companyId = parseInt(req.body.company_id) || parseInt(req.query.company_id);
                }
            }

            if (!companyId) {
                return res.status(401).json({ message: 'Unauthorized.' });
            }

            const result = await machineAttendanceService.mapEmployee(companyId, req.body);
            res.status(200).json(result);
        } catch (err) {
            res.status(400).json({ message: err.message });
        }
    }

    /**
     * Synchronizes a single punch.
     * Protected by x-api-key authentication (device key).
     */
    async attendance(req, res) {
        try {
            const companyId = req.company_id;
            const deviceSerial = req.device_serial;
            
            // Check if device is matching serial in request (optional safety check)
            const payloadSerial = req.body.device_serial || req.body.deviceId;
            if (payloadSerial && payloadSerial !== deviceSerial) {
                return res.status(400).json({ 
                    message: 'Bad request. Payload device_serial does not match the authenticated API key device.' 
                });
            }

            const result = await machineAttendanceService.processPunch(companyId, deviceSerial, req.body);

            // Update device status and last ping time
            await db('biometric_devices')
                .where({ id: req.device_id })
                .update({ 
                    status: 'online', 
                    last_ping_at: db.fn.now() 
                });

            if (result.status === 'failed') {
                return res.status(400).json(result);
            }

            res.status(200).json(result);
        } catch (err) {
            console.error('[BIOMETRIC-SYNC-CONTROLLER-ERROR]:', err.message);
            res.status(500).json({ message: 'Error processing biometric punch.', error: err.message });
        }
    }

    /**
     * Synchronizes a batch of punches.
     * Protected by x-api-key authentication (device key).
     */
    async attendanceBulk(req, res) {
        try {
            const companyId = req.company_id;
            const deviceSerial = req.device_serial;

            const punches = req.body.punches || req.body.data || req.body.logs || req.body.attendances;
            if (!punches || !Array.isArray(punches)) {
                return res.status(400).json({ message: 'Bad request. "punches" field must be an array of logs.' });
            }

            // Optional safety check for device serial in body
            const payloadSerial = req.body.device_serial || req.body.deviceId;
            if (payloadSerial && payloadSerial !== deviceSerial) {
                return res.status(400).json({ 
                    message: 'Bad request. Payload device_serial does not match the authenticated API key device.' 
                });
            }

            const metrics = {
                total_processed: punches.length,
                success_count: 0,
                skipped_count: 0,
                failed_count: 0,
                details: []
            };

            for (const punch of punches) {
                const result = await machineAttendanceService.processPunch(companyId, deviceSerial, punch);
                
                if (result.status === 'failed') {
                    metrics.failed_count++;
                    metrics.details.push({ employee_code: punch.employee_code, status: 'failed', reason: result.reason });
                } else if (result.status === 'skipped') {
                    metrics.skipped_count++;
                    metrics.details.push({ employee_code: punch.employee_code, status: 'skipped', reason: result.reason });
                } else {
                    metrics.success_count++;
                    metrics.details.push({ employee_code: punch.employee_code, status: 'synced', action: result.status });
                }
            }

            // Update device status and last ping time
            await db('biometric_devices')
                .where({ id: req.device_id })
                .update({ 
                    status: 'online', 
                    last_ping_at: db.fn.now() 
                });

            res.status(200).json({
                status: 'completed',
                ...metrics
            });
        } catch (err) {
            console.error('[BIOMETRIC-BULK-SYNC-CONTROLLER-ERROR]:', err.message);
            res.status(500).json({ message: 'Error processing bulk biometric punches.', error: err.message });
        }
    }

    /**
     * Retrieves biometric devices.
     */
    async getDevices(req, res) {
        try {
            const companyId = req.company_id || parseInt(req.query.company_id);
            if (!companyId) {
                return res.status(400).json({ message: 'Missing company_id parameter.' });
            }
            const devices = await machineAttendanceService.getDevices(companyId);
            res.status(200).json(devices);
        } catch (err) {
            res.status(500).json({ message: 'Error retrieving devices.', error: err.message });
        }
    }

    /**
     * Deletes a registered device.
     */
    async deleteDevice(req, res) {
        try {
            const deviceId = parseInt(req.params.id);
            const companyId = req.company_id || parseInt(req.body.company_id) || parseInt(req.query.company_id);
            
            if (!companyId || !deviceId) {
                return res.status(400).json({ message: 'Missing company_id or device_id.' });
            }

            const result = await machineAttendanceService.deleteDevice(companyId, deviceId);
            res.status(200).json(result);
        } catch (err) {
            res.status(400).json({ message: err.message });
        }
    }
}

module.exports = new MachineController();
