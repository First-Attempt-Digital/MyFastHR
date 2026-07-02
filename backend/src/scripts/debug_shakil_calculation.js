const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const db = require('../config/db');
const attendanceService = require('../services/attendanceService');

async function debugShakilCalculation() {
    const code = '10018';
    const dateStr = '2026-07-01';

    const emp = await db('employees').where('employee_id_number', code).first();
    const targetDate = dateStr;

    // Fetch active assignment
    const assignment = await db('employee_shift_assignments as esa')
        .join('shifts as s', 'esa.shift_id', 's.id')
        .where('esa.employee_id', emp.id)
        .where('esa.from_date', '<=', targetDate)
        .andWhere(qb => {
            qb.where('esa.to_date', '>=', targetDate).orWhereNull('esa.to_date');
        })
        .select(
            's.name', 's.start_time', 's.end_time', 's.total_punches_required',
            's.session2_start_time', 's.session2_end_time', 's.grace_period',
            's.session1_grace_out', 's.session2_grace_in', 's.session2_grace_out',
            's.session1_in_margin', 's.session1_out_margin', 's.session2_in_margin', 's.session2_out_margin',
            's.terminate_hour'
        )
        .orderBy('esa.id', 'desc')
        .first();

    const activeShift = assignment || {
        name: 'General Shift',
        start_time: '09:00',
        end_time: '18:00',
        total_punches_required: 2,
        grace_period: 15,
        session1_grace_out: 0
    };

    console.log('Resolved activeShift for Shakil:', JSON.stringify(activeShift, null, 2));

    const attendanceLogs = await db('attendance')
        .where({ employee_id: emp.id })
        .whereRaw('DATE(check_in) = ?', [dateStr])
        .orderBy('id', 'asc');

    console.log('Attendance Logs in DB:', JSON.stringify(attendanceLogs, null, 2));

    // Call getMatrix logic for Day 1
    const mockUser = { company_id: 27, role_name: 'company_admin' };
    const matrixRes = await attendanceService.getMatrix(mockUser, 7, 2026);
    const riteshMat = matrixRes.matrix.find(e => e.code === code);

    console.log('\nMatrix Output for Day 1:');
    console.log(`  Val : ${riteshMat.days[1]}`);
    console.log('  Meta:', JSON.stringify(riteshMat.meta[1], null, 2));
    console.log('  Timings:', JSON.stringify(riteshMat.timings[1], null, 2));

    // Call getDayDetail logic
    const detail = await attendanceService.getDayDetail(27, emp.id, dateStr);
    console.log('\ngetDayDetail Output:');
    console.log(`  split_shift_details status: ${detail.split_shift_details?.status}`);
    console.log(`  split_shift_details explanation: ${detail.split_shift_details?.explanation}`);
    console.log(`  attendance.status: ${detail.attendance?.status}`);

    process.exit(0);
}

debugShakilCalculation().catch(console.error);
