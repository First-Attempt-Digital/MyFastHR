const db = require('../config/db');
const machineAttendanceService = require('../services/machineAttendanceService');

async function testProcess() {
    console.log("=== TESTING PROCESS_PUNCH FOR BHULENDRA ===");
    
    // Clean up Bhulendra's July 3rd attendance first so we have a clean slate
    await db('attendance')
        .where({ employee_id: 10048, company_id: 27 })
        .whereRaw('DATE(check_in) = ?', ['2026-07-03'])
        .del();
        
    const punchPayload = {
        employee_code: '10048',
        punch_time: '2026-07-03 05:56:03',
        device_serial: 'BIOMETRIC_DEV'
    };
    
    const res = await machineAttendanceService.processPunch(27, 'BIOMETRIC_DEV', punchPayload);
    console.log("Result:", JSON.stringify(res));
    
    db.destroy();
}

testProcess().catch(e => {
    console.error(e);
    db.destroy();
});
