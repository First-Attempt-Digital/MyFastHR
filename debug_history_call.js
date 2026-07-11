// Debug: directly call getEmployeeAttendanceHistory and see what it returns
const knex = require('./backend/src/config/db');
const attendanceService = require('./backend/src/services/attendanceService');

async function debug() {
    try {
        const employee_id = 609; // Bhulendra
        const companyId = 2;
        const from = '2026-07-01';
        const to = '2026-07-02';
        
        console.log('=== CALLING getEmployeeAttendanceHistory ===');
        const result = await attendanceService.getEmployeeAttendanceHistory(companyId, employee_id, from, to);
        console.log('Result:', JSON.stringify(result, null, 2));
        
    } catch (err) {
        console.error('ERROR:', err.message, err.stack);
    } finally {
        await knex.destroy();
    }
}

debug();
