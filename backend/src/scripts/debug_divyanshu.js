const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const db = require('../config/db');
const attendanceService = require('../services/attendanceService');

async function debugDivyanshu() {
    const code = '2011314';
    const dateStr = '2026-07-02';

    console.log(`=== Debugging Employee ${code} on ${dateStr} ===`);

    const emp = await db('employees as e')
        .leftJoin('shifts as s', 'e.shift_id', 's.id')
        .leftJoin('attendance_schemes as asc', 'e.attendance_scheme_id', 'asc.id')
        .where('e.employee_id_number', code)
        .select('e.*', 's.name as shift_name', 's.start_time as shift_start', 's.end_time as shift_end', 's.grace_period as shift_grace', 's.session1_grace_out', 's.total_punches_required as shift_total_punches', 'asc.grace_period as scheme_grace')
        .first();

    if (!emp) {
        console.log(`Employee with code ${code} not found!`);
        process.exit(1);
    }

    console.log('Employee Profile Details:');
    console.log(`  ID: ${emp.id}`);
    console.log(`  Name: ${emp.first_name} ${emp.last_name}`);
    console.log(`  Default Shift: ${emp.shift_name} (${emp.shift_start} - ${emp.shift_end})`);

    // Fetch active assignment
    const activeAssignment = await db('employee_shift_assignments as esa')
        .join('shifts as s', 'esa.shift_id', 's.id')
        .where('esa.employee_id', emp.id)
        .where('esa.from_date', '<=', dateStr)
        .andWhere(qb => {
            qb.where('esa.to_date', '>=', dateStr).orWhereNull('esa.to_date');
        })
        .select('esa.id', 'esa.from_date', 'esa.to_date', 's.name as shift_name', 's.start_time', 's.end_time', 's.grace_period', 's.session1_grace_out', 's.total_punches_required')
        .orderBy('esa.id', 'desc')
        .first();

    if (activeAssignment) {
        console.log('\nActive Assignment found:');
        console.log(`  ID: ${activeAssignment.id}`);
        console.log(`  Shift: ${activeAssignment.shift_name} (${activeAssignment.start_time} - ${activeAssignment.end_time})`);
    } else {
        console.log('\nNo Active Assignment found for this date. Using default shift.');
    }

    // Fetch attendance logs
    const logs = await db('attendance')
        .where({ employee_id: emp.id })
        .whereRaw('DATE(check_in) = ?', [dateStr])
        .orderBy('id', 'asc');

    console.log('\nAttendance records in DB:');
    console.log(JSON.stringify(logs, null, 2));

    // Call getDayDetail
    const detail = await attendanceService.getDayDetail(27, emp.id, dateStr);
    console.log('\ngetDayDetail Output:');
    console.log(`  split_shift_details status: ${detail.split_shift_details?.status}`);
    console.log(`  split_shift_details explanation: ${detail.split_shift_details?.explanation}`);
    console.log(`  attendance.status: ${detail.attendance?.status}`);

    process.exit(0);
}

debugDivyanshu().catch(e => { console.error(e); process.exit(1); });
