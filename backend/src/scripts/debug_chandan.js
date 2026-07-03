const db = require('../config/db');

async function debugChandan() {
    const code = '10013';
    console.log(`=== DEBUGGING CHANDAN (Code: ${code}) ===`);
    
    const employee = await db('employees as e')
        .leftJoin('shifts as s', 'e.shift_id', 's.id')
        .where('e.employee_id_number', code)
        .select('e.*', 's.start_time', 's.end_time', 's.terminate_hour')
        .first();
        
    if (!employee) {
        console.error('Employee not found!');
        process.exit(1);
    }
    
    console.log(`Employee: ${employee.first_name} ${employee.last_name}`);
    console.log(`Shift: ${employee.start_time} - ${employee.end_time} | terminate_hour: ${employee.terminate_hour}`);
    
    // Fetch biometric raw logs for July 2nd and July 3rd
    const rawLogs = await db('biometric_raw_logs')
        .where({ company_id: employee.company_id })
        .where('employee_code', 'like', `%${code}%`)
        .whereRaw('DATE(punch_time) >= ? AND DATE(punch_time) <= ?', ['2026-07-02', '2026-07-04'])
        .orderBy('punch_time', 'asc');
        
    console.log(`\nRaw Biometric Logs (July 2 to July 4):`);
    for (const log of rawLogs) {
        console.log(`  ID: ${log.id} | punch_time: ${log.punch_time} | status: ${log.status} | error: ${log.error_details || 'None'}`);
    }
    
    // Fetch attendance records for July 1st, 2nd, 3rd
    const attendance = await db('attendance')
        .where({ employee_id: employee.id })
        .whereRaw('DATE(check_in) >= ? AND DATE(check_in) <= ?', ['2026-07-01', '2026-07-03'])
        .orderBy('check_in', 'asc');
        
    console.log(`\nAttendance Records (July 1 to July 3):`);
    for (const att of attendance) {
        console.log(`  ID: ${att.id} | check_in: ${att.check_in} | check_out: ${att.check_out} | status: ${att.status} | source: ${att.punch_source}`);
    }
    
    db.destroy();
}

debugChandan().catch(e => {
    console.error(e);
    db.destroy();
});
