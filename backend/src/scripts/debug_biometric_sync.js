const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const db = require('../config/db');
const machineAttendanceService = require('../services/machineAttendanceService');

async function debugSync() {
    const code = '2011314';
    const dateStr = '2026-07-02';

    const emp = await db('employees').where('employee_id_number', code).first();
    if (!emp) {
        console.log('Employee not found!');
        process.exit(1);
    }

    console.log('--- Current DB State ---');
    const attBefore = await db('attendance').where({ employee_id: emp.id }).whereRaw('DATE(check_in) = ?', [dateStr]).first();
    console.log(JSON.stringify(attBefore, null, 2));

    // Delete raw logs for today's checkout punches to allow re-processing
    console.log('\n--- Deleting checkout raw logs to allow re-processing... ---');
    await db('biometric_raw_logs')
        .where({ company_id: emp.company_id, employee_code: code })
        .whereIn('punch_time', ['2026-07-02 15:39:19', '2026-07-02 16:03:18', '2026-07-02 16:11:31'])
        .del();

    // Reset attendance record to simulated state BEFORE the first checkout punch
    // i.e., check_in = 11:04:04, check_out = null, status = 'late' (since request is approved)
    console.log('\n--- Resetting Attendance Record to state before checkout... ---');
    await db('attendance')
        .where({ id: attBefore.id })
        .update({
            check_out: null,
            status: 'late',
            punch_source: 'entry_request',
            updated_at: db.fn.now()
        });

    const attAfterReset = await db('attendance').where({ id: attBefore.id }).first();
    console.log(JSON.stringify(attAfterReset, null, 2));

    // Now call processPunch for the first checkout punch: 15:39:19
    console.log('\n--- Processing Punch 15:39:19 via machineAttendanceService... ---');
    const result1 = await machineAttendanceService.processPunch(
        emp.company_id,
        'TW1KDW0010250441',
        {
            employee_code: code,
            timestamp: '2026-07-02 15:39:19'
        }
    );
    console.log('Result 1:', result1);
    const attAfterPunch1 = await db('attendance').where({ id: attBefore.id }).first();
    console.log('Attendance after punch 1:', JSON.stringify(attAfterPunch1, null, 2));

    // Now call processPunch for the second checkout punch: 16:03:18
    console.log('\n--- Processing Punch 16:03:18 via machineAttendanceService... ---');
    const result2 = await machineAttendanceService.processPunch(
        emp.company_id,
        'TW1KDW0010250441',
        {
            employee_code: code,
            timestamp: '2026-07-02 16:03:18'
        }
    );
    console.log('Result 2:', result2);
    const attAfterPunch2 = await db('attendance').where({ id: attBefore.id }).first();
    console.log('Attendance after punch 2:', JSON.stringify(attAfterPunch2, null, 2));

    // Now call processPunch for the third checkout punch: 16:11:31
    console.log('\n--- Processing Punch 16:11:31 via machineAttendanceService... ---');
    const result3 = await machineAttendanceService.processPunch(
        emp.company_id,
        'TW1KDW0010250441',
        {
            employee_code: code,
            timestamp: '2026-07-02 16:11:31'
        }
    );
    console.log('Result 3:', result3);
    const attAfterPunch3 = await db('attendance').where({ id: attBefore.id }).first();
    console.log('Attendance after punch 3:', JSON.stringify(attAfterPunch3, null, 2));

    process.exit(0);
}

debugSync().catch(console.error);
