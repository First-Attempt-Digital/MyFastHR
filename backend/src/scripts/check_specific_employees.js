const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const db = require('../config/db');

async function checkSpecific() {
    const codes = ['10020', '10033', '10010', '10012', '10019'];
    const dates = ['2026-07-01', '2026-07-02'];

    console.log('\n=== Checking Specific Employees ===\n');

    for (const date of dates) {
        console.log(`\n--- Date: ${date} ---`);
        const records = await db('attendance as a')
            .join('employees as e', 'a.employee_id', 'e.id')
            .leftJoin('shifts as s', 'e.shift_id', 's.id')
            .whereIn('e.employee_id_number', codes)
            .whereRaw('DATE(a.check_in) = ?', [date])
            .select(
                'e.employee_id_number',
                'e.first_name', 'e.last_name',
                'a.check_in', 'a.check_out',
                'a.status', 'a.punch_source',
                's.start_time as shift_start',
                's.end_time as shift_end',
                's.grace_period as shift_grace'
            );

        if (records.length === 0) {
            console.log('  No records found for these employees on this date.');
        }
        for (const r of records) {
            console.log(`\n[${r.employee_id_number}] ${r.first_name} ${r.last_name}`);
            console.log(`  Shift     : ${r.shift_start || 'N/A'} - ${r.shift_end || 'N/A'} | Grace: ${r.shift_grace || 'N/A'} mins`);
            console.log(`  check_in  : ${r.check_in}`);
            console.log(`  check_out : ${r.check_out || '--:--'}`);
            console.log(`  DB status : ${r.status} | Source: ${r.punch_source}`);
        }
    }

    process.exit(0);
}

checkSpecific().catch(e => { console.error(e); process.exit(1); });
