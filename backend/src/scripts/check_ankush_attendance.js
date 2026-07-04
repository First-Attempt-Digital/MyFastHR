const db = require('../config/db');

async function checkAnkushAttendance() {
    const code = '10096';
    const dateStr = '2026-07-04';

    console.log(`=== CHECKING ATTENDANCE FOR ANKUSH RANA (CODE: ${code}) ON ${dateStr} ===\n`);

    // 1. Get Employee info
    const employee = await db('employees')
        .where('employee_id_number', code)
        .first();

    if (!employee) {
        console.log(`[-] Employee with code ${code} not found in database.`);
        db.destroy();
        return;
    }

    console.log(`[+] Employee Found: ${employee.first_name} ${employee.last_name} (ID: ${employee.id})`);
    console.log(`    Designation: ${employee.designation}`);
    console.log(`    Shift ID: ${employee.shift_id}\n`);

    // 2. Check employee shift assignments
    const assignments = await db('employee_shift_assignments as esa')
        .join('shifts as s', 'esa.shift_id', 's.id')
        .where('esa.employee_id', employee.id)
        .select('esa.from_date', 'esa.to_date', 's.name', 's.start_time', 's.end_time');

    console.log(`[+] Shift Assignments:`);
    if (assignments.length === 0) {
        console.log(`    No assignments found.`);
    } else {
        assignments.forEach(asg => {
            console.log(`    - Shift: ${asg.name} (${asg.start_time} - ${asg.end_time}) | From: ${String(asg.from_date).split('T')[0]} To: ${asg.to_date ? String(asg.to_date).split('T')[0] : 'Open'}`);
        });
    }
    console.log('');

    // 3. Get raw biometric logs
    const rawLogs = await db('biometric_raw_logs')
        .where('employee_code', code)
        .whereRaw('DATE(punch_time) = ?', [dateStr])
        .orderBy('punch_time', 'asc');

    console.log(`[+] Raw Biometric Logs (biometric_raw_logs) for ${dateStr}:`);
    if (rawLogs.length === 0) {
        console.log(`    No raw punches found in biometric_raw_logs for this date.`);
    } else {
        rawLogs.forEach(log => {
            console.log(`    - ID: ${log.id} | Time: ${log.punch_time} | Status: ${log.status} | Error: ${log.error_details || 'None'}`);
        });
    }
    console.log('');

    // 4. Get attendance table records
    const attendanceLogs = await db('attendance')
        .where('employee_id', employee.id)
        .whereRaw('DATE(check_in) = ?', [dateStr])
        .orderBy('check_in', 'asc');

    console.log(`[+] Generated Attendance Records (attendance table) for ${dateStr}:`);
    if (attendanceLogs.length === 0) {
        console.log(`    No records found in attendance table for this date.`);
    } else {
        attendanceLogs.forEach(rec => {
            console.log(`    - ID: ${rec.id} | Check-In: ${rec.check_in} | Check-Out: ${rec.check_out || 'None'} | Status: ${rec.status} | Source: ${rec.punch_source}`);
        });
    }
    
    db.destroy();
}

checkAnkushAttendance().catch(e => {
    console.error(e);
    db.destroy();
});
