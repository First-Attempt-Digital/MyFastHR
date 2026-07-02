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

    // Clean up / restore the checkout time to 16:11:31 so the employee doesn't lose their data
    console.log('\n--- Restoring to original DB state... ---');
    await db('attendance')
        .where({ id: attBefore.id })
        .update({
            check_out: '2026-07-02 16:11:31',
            status: attBefore.status,
            punch_source: attBefore.punch_source,
            device_id: attBefore.device_id,
            updated_at: attBefore.updated_at
        });

    process.exit(0);
}

debugSync().catch(console.error);
