const db = require('../config/db');

async function debugAllNightShifts() {
    console.log(`=== ANALYZING ALL NIGHT SHIFTS FOR JULY 2ND ===`);
    
    // Find all attendance records on July 2nd that have a check_in but check_out is null, for shifts that cross midnight
    const candidates = await db('attendance as a')
        .join('employees as e', 'a.employee_id', 'e.id')
        .join('shifts as s', 'e.shift_id', 's.id')
        .whereRaw('DATE(a.check_in) = ?', ['2026-07-02'])
        .whereNull('a.check_out')
        .select(
            'a.id as attendance_id', 'a.check_in', 'a.status', 'a.punch_source',
            'e.id as employee_id', 'e.first_name', 'e.last_name', 'e.employee_id_number', 'e.company_id',
            's.start_time', 's.end_time', 's.terminate_hour'
        );
        
    console.log(`Found ${candidates.length} open attendance records on July 2nd:`);
    
    for (const cand of candidates) {
        console.log(`\n------------------------------------------------`);
        console.log(`Employee: ${cand.first_name} ${cand.last_name} (Code: ${cand.employee_id_number})`);
        console.log(`Shift: ${cand.start_time} - ${cand.end_time} | terminate_hour: ${cand.terminate_hour}`);
        console.log(`Attendance Check-In: ${cand.check_in}`);
        
        // Find raw biometric logs for this employee around the shift end (July 3rd morning, say 00:00 to 06:00)
        const code = cand.employee_id_number;
        const morningLogs = await db('biometric_raw_logs')
            .where({ company_id: cand.company_id })
            .where('employee_code', 'like', `%${code}%`)
            .whereRaw('punch_time >= ? AND punch_time <= ?', ['2026-07-03 00:00:00', '2026-07-03 10:00:00'])
            .orderBy('punch_time', 'asc');
            
        console.log(`Raw punches found on July 3rd morning (00:00 to 10:00 AM): ${morningLogs.length}`);
        for (const log of morningLogs) {
            console.log(`  ID: ${log.id} | punch_time: ${log.punch_time} | status: ${log.status} | error: ${log.error_details || 'None'}`);
        }
        
        // Find any other raw logs for this employee on July 3rd
        const allDayLogs = await db('biometric_raw_logs')
            .where({ company_id: cand.company_id })
            .where('employee_code', 'like', `%${code}%`)
            .whereRaw('DATE(punch_time) = ?', ['2026-07-03'])
            .orderBy('punch_time', 'asc');
        console.log(`Total raw punches found on July 3rd (all day): ${allDayLogs.length}`);
        for (const log of allDayLogs) {
            if (!morningLogs.some(ml => ml.id === log.id)) {
                console.log(`  ID: ${log.id} | punch_time: ${log.punch_time} | status: ${log.status} | error: ${log.error_details || 'None'}`);
            }
        }
    }
    
    db.destroy();
}

debugAllNightShifts().catch(e => {
    console.error(e);
    db.destroy();
});
