const db = require('../config/db');
const machineAttendanceService = require('../services/machineAttendanceService');

// Timezone-safe date helper
function dbDateToUTC(dateVal) {
    if (!dateVal) return null;
    if (dateVal instanceof Date) {
        const yr = dateVal.toLocaleDateString('en-US', { timeZone: 'Asia/Kolkata', year: 'numeric' });
        const mo = dateVal.toLocaleDateString('en-US', { timeZone: 'Asia/Kolkata', month: '2-digit' });
        const dy = dateVal.toLocaleDateString('en-US', { timeZone: 'Asia/Kolkata', day: '2-digit' });
        const timeParts = dateVal.toLocaleTimeString('en-US', { timeZone: 'Asia/Kolkata', hour12: false }).split(':');
        const hr = timeParts[0].padStart(2, '0');
        const mi = timeParts[1].padStart(2, '0');
        const sc = timeParts[2].padStart(2, '0');
        const hrClean = hr === '24' ? '00' : hr;
        return new Date(`${yr}-${mo}-${dy}T${hrClean}:${mi}:${sc}+05:30`);
    }
    const str = String(dateVal).trim();
    const parts = str.split(/[- : T]/);
    if (parts.length >= 3) {
        const yr = parts[0]; const mo = parts[1]; const dy = parts[2];
        const hr = parts[3] || '00'; const mi = parts[4] || '00'; const sc = parts[5] || '00';
        return new Date(`${yr}-${mo}-${dy}T${hr}:${mi}:${sc}+05:30`);
    }
    const d = new Date(dateVal);
    return isNaN(d.getTime()) ? null : d;
}

async function verifyJuly3Status() {
    console.log("=== VERIFYING JULY 3RD SYNCS AND SKIPS ===");
    
    const rawLogs = await db('biometric_raw_logs')
        .where({ company_id: 27 })
        .whereRaw('DATE(punch_time) = ?', ['2026-07-03'])
        .orderBy('punch_time', 'asc');
        
    console.log(`Analyzing ${rawLogs.length} raw logs on July 3rd:\n`);
    
    for (const log of rawLogs) {
        const code = log.employee_code;
        
        const emp = await db('employees as e')
            .leftJoin('shifts as s', 'e.shift_id', 's.id')
            .where('e.company_id', 27)
            .where('e.employee_id_number', code)
            .select('e.first_name', 'e.last_name', 's.name as shift_name', 's.start_time', 's.end_time', 's.session1_in_margin', 's.terminate_hour')
            .first();
            
        if (!emp) {
            console.log(`Code: ${code} | Punch: ${log.punch_time} | Status: ${log.status} | Err: ${log.error_details} | (Employee not found)`);
            continue;
        }
        
        console.log(`Emp: ${emp.first_name} ${emp.last_name} (${code})`);
        console.log(`  Shift: ${emp.shift_name} (${emp.start_time} - ${emp.end_time})`);
        console.log(`  Punch: ${log.punch_time} | DB Status: ${log.status} | Err: ${log.error_details}`);
        
        // Calculate allowed check-in window
        const shiftStart = emp.start_time || '09:00';
        const inMargin = emp.session1_in_margin !== null && emp.session1_in_margin !== undefined ? parseInt(emp.session1_in_margin) : 30;
        const [sH, sM] = shiftStart.split(':').map(Number);
        
        const punchTime = dbDateToUTC(log.punch_time);
        
        // Crossover logic to resolve targetShiftDate
        const istStr = punchTime.toLocaleTimeString('en-GB', { timeZone: 'Asia/Kolkata', hour: '2-digit', hour12: false });
        const hour = parseInt(istStr, 10);
        let targetShiftDate = '2026-07-03';
        if (hour >= 0 && hour < 6) {
            const prev = new Date(punchTime.getTime() - 24 * 60 * 60 * 1000);
            targetShiftDate = prev.toLocaleDateString('sv-SE', { timeZone: 'Asia/Kolkata' });
        }
        
        const shiftStartDate = new Date(`${targetShiftDate} ${String(sH).padStart(2, '0')}:${String(sM).padStart(2, '0')}:00 +05:30`);
        const earliestCheckIn = new Date(shiftStartDate.getTime() - inMargin * 60 * 1000);
        
        console.log(`  Target Shift Date: ${targetShiftDate} | Earliest Allowed: ${earliestCheckIn.toLocaleTimeString('en-GB', { timeZone: 'Asia/Kolkata' })}`);
        console.log(`  Punch < Earliest? ${punchTime < earliestCheckIn ? 'YES (Will be skipped)' : 'NO (Allowed)'}`);
        console.log('');
    }
    
    db.destroy();
}

verifyJuly3Status().catch(e => {
    console.error(e);
    db.destroy();
});
