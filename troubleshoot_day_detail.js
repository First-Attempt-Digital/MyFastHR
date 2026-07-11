// Troubleshoot day-detail api endpoint
const knex = require('./backend/src/config/db');
const attendanceService = require('./backend/src/services/attendanceService');

async function debug() {
    try {
        const employeeId = 609;
        const companyId = 2;
        const date = '2026-07-01';
        
        console.log('=== CALLING getDayDetail ===');
        const result = await attendanceService.getDayDetail(companyId, employeeId, date);
        console.log(JSON.stringify(result, null, 2));

    } catch (err) {
        console.error('ERROR:', err.message, err.stack);
    } finally {
        await knex.destroy();
    }
}

debug();
