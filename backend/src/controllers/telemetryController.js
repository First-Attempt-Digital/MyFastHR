const db = require('../config/db');
const os = require('os');

class TelemetryController {
    async getTelemetry(req, res) {
        try {
            // 1. Get database pool stats
            const pools = db.getPoolTelemetry ? db.getPoolTelemetry() : {};
            
            // 2. Get recent query logs
            const queries = db.getQueryLogs ? db.getQueryLogs() : [];
            
            // 3. Get system stats
            const memoryUsage = process.memoryUsage();
            const totalMem = os.totalmem();
            const freeMem = os.freemem();
            const memoryUsagePercentage = (((totalMem - freeMem) / totalMem) * 100).toFixed(1);
            
            const system = {
                uptime: Math.floor(process.uptime()), // application uptime in seconds
                nodeVersion: process.version,
                platform: process.platform,
                arch: process.arch,
                memory: {
                    rss: (memoryUsage.rss / 1024 / 1024).toFixed(2) + ' MB',
                    heapUsed: (memoryUsage.heapUsed / 1024 / 1024).toFixed(2) + ' MB',
                    heapTotal: (memoryUsage.heapTotal / 1024 / 1024).toFixed(2) + ' MB',
                    systemTotal: (totalMem / 1024 / 1024 / 1024).toFixed(2) + ' GB',
                    systemFree: (freeMem / 1024 / 1024 / 1024).toFixed(2) + ' GB',
                    usagePercentage: parseFloat(memoryUsagePercentage)
                },
                cpu: {
                    cores: os.cpus().length,
                    model: os.cpus()[0]?.model || 'Unknown',
                    load: os.loadavg()
                }
            };
            
            res.json({
                success: true,
                pools,
                queries,
                system
            });
        } catch (error) {
            console.error('[TELEMETRY-CONTROLLER-ERROR]:', error);
            res.status(500).json({ message: 'Failed to retrieve telemetry stats', error: error.message });
        }
    }
}

module.exports = new TelemetryController();
