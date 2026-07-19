const db = require('../config/db');

/**
 * Middleware to authenticate requests using x-api-key.
 * Resolves the device and sets company_id in the request context for multi-tenant isolation.
 * Supports:
 * 1. Device-specific API Key (api_key starts with 'mfhr_device_live_')
 * 2. Master API Key fallback (BIOMETRIC_API_KEY from .env), resolving device by device_serial in the payload
 */
const apiKeyAuth = async (req, res, next) => {
    let apiKey = req.headers['x-api-key'] || req.query.api_key || req.body?.api_key;
    if (apiKey) apiKey = apiKey.trim();
    
    const masterKey = process.env.BIOMETRIC_API_KEY;

    if (!apiKey) {
        return res.status(401).json({ message: 'Authentication required. Missing x-api-key header.' });
    }

    try {
        let device = null;

        if (!!masterKey && apiKey === masterKey) {
            // Master Key fallback - find device by serial number in payload
            let deviceSerial = req.body?.device_serial || 
                               req.body?.deviceId || 
                               req.body?.device || 
                               req.query?.device_serial ||
                               req.body?.attendances?.[0]?.device_serial;
            
            if (deviceSerial === '5553393731060927') {
                deviceSerial = 'TIPLTW-BIO1SE243260339';
            }
            
            if (!deviceSerial) {
                return res.status(400).json({ 
                    message: 'Bad request. Device serial/ID must be provided when using Master API Key.' 
                });
            }

            device = await db('biometric_devices')
                .where({ device_serial: deviceSerial })
                .first();

            if (!device) {
                console.warn(`[BIOMETRIC-AUTH-WARN]: Access denied. Device with serial ${deviceSerial} not registered.`);
                return res.status(404).json({ 
                    message: `Unauthorized. Device with serial ${deviceSerial} is not registered in the system.` 
                });
            }
        } else {
            // Standard Device API Key lookup
            device = await db('biometric_devices')
                .where({ api_key: apiKey })
                .first();

            if (!device) {
                console.warn(`[BIOMETRIC-AUTH-WARN]: Access denied. Invalid API key: ${apiKey}`);
                return res.status(401).json({ message: 'Unauthorized. Invalid API key.' });
            }
        }

        // Attach resolved device and tenant (company_id) to request context
        req.company_id = device.company_id;
        req.device = device;
        req.device_serial = device.device_serial;
        req.device_id = device.id;

        next();
    } catch (err) {
        console.error('[BIOMETRIC-AUTH-ERROR]:', err);
        res.status(500).json({ message: 'Internal authentication server error.' });
    }
};

module.exports = apiKeyAuth;
