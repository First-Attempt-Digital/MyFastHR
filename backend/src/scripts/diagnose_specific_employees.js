const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const db = require('../config/db');

async function diagnose() {
    const codes = ['10019', '10020', '10052', '10033'];
    const dates = ['2026-07-01', '2026-07-02'];
    
    console.log(`\n=== Database Diagnostics for Specific Employees ===\n`);

    for (const date of dates) {
        console.log(`\n--- Date: ${date} ---`);
        for (const code of codes) {
            const emp = await db('employees as e')
                .leftJoin('shifts as s', 'e.shift_id', 's.id')
                .leftJoin('attendance_schemes as asc', 'e.attendance_scheme_id', 'asc.id')
                .where('e.employee_id_number', code)
                .select(
                    'e.id', 'e.first_name', 'e.last_name', 'e.employee_id_number',
                    's.start_time as shift_start', 's.end_time as shift_end', 's.grace_period as shift_grace',
                    'asc.grace_period as scheme_grace'
                ).first();

            if (!emp) {
                console.log(`[${code}] Employee not found!`);
                continue;
            }

            const att = await db('attendance')
                .where({ employee_id: emp.id })
                .whereRaw('DATE(check_in) = ?', [date])
                .first();

            const reqs = await db('attendance_entry_requests')
                .where({ employee_id: emp.id, date });

            console.log(`\n[${code}] ${emp.first_name} ${emp.last_name}:`);
            console.log(`  Shift: ${emp.shift_start} - ${emp.shift_end} | grace: ${emp.shift_grace} | scheme_grace: ${emp.scheme_grace}`);
            if (att) {
                console.log(`  Attendance: check_in=${att.check_in} | check_out=${att.check_out} | status=${att.status} | source=${att.punch_source}`);
            } else {
                console.log(`  Attendance: No record found`);
            }
            if (reqs.length > 0) {
                console.log(`  Requests: ${reqs.map(r => `${r.request_type}(${r.status})`).join(', ')}`);
            } else {
                console.log(`  Requests: None`);
            }
        }
    }
    process.exit(0);
}

diagnose().catch(e => { console.error(e); process.exit(1); });
