const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const db = require('../config/db');

async function debugAll() {
    const code = '2011314';
    const dateStr = '2026-07-02';

    const emp = await db('employees').where('employee_id_number', code).first();
    if (!emp) {
        console.log('Employee not found!');
        process.exit(1);
    }

    console.log(`=== Complete Debug Data for Divyanshu (ID: ${emp.id}) on ${dateStr} ===`);

    const atts = await db('attendance')
        .where({ employee_id: emp.id })
        .whereRaw('DATE(check_in) = ?', [dateStr]);
    console.log('\n--- Attendance Record(s) ---');
    console.log(JSON.stringify(atts, null, 2));

    const rawLogs = await db('biometric_raw_logs')
        .where('employee_code', code)
        .whereRaw('DATE(punch_time) = ?', [dateStr]);
    console.log('\n--- Biometric Raw Logs ---');
    console.log(JSON.stringify(rawLogs, null, 2));

    const reqs = await db('attendance_entry_requests')
        .where('employee_id', emp.id)
        .where('date', dateStr);
    console.log('\n--- Entry/Exit Requests ---');
    console.log(JSON.stringify(reqs, null, 2));

    process.exit(0);
}

debugAll().catch(console.error);
