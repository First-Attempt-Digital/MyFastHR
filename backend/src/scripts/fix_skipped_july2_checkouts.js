const db = require('../config/db');

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

function formatLocalYYYYMMDDHHmmss(date) {
    const yr = date.toLocaleDateString('en-US', { timeZone: 'Asia/Kolkata', year: 'numeric' });
    const mo = date.toLocaleDateString('en-US', { timeZone: 'Asia/Kolkata', month: '2-digit' });
    const dy = date.toLocaleDateString('en-US', { timeZone: 'Asia/Kolkata', day: '2-digit' });
    const timeParts = date.toLocaleTimeString('en-US', { timeZone: 'Asia/Kolkata', hour12: false }).split(':');
    const hr = timeParts[0].padStart(2, '0');
    const mi = timeParts[1].padStart(2, '0');
    const sc = timeParts[2].padStart(2, '0');
    const hrClean = hr === '24' ? '00' : hr;
    return `${yr}-${mo}-${dy} ${hrClean}:${mi}:${sc}`;
}

async function fixSkippedCheckouts() {
    console.log(`=== GLOBAL RECOVERY FOR JULY 2ND SKIPPED CHECKOUTS ===\n`);
    
    // Find all attendance records on July 2nd that are currently open (check_out is null)
    const openLogs = await db('attendance as a')
        .join('employees as e', 'a.employee_id', 'e.id')
        .join('shifts as s', 'e.shift_id', 's.id')
        .whereRaw('DATE(a.check_in) = ?', ['2026-07-02'])
        .whereNull('a.check_out')
        .select(
            'a.id as attendance_id', 'a.check_in', 'a.status as original_status',
            'e.id as employee_id', 'e.first_name', 'e.last_name', 'e.employee_id_number', 'e.company_id',
            's.start_time as shift_start', 's.end_time as shift_end', 's.grace_period', 's.terminate_hour'
        );
        
    console.log(`Found ${openLogs.length} open attendance records on July 2nd to analyze.\n`);
    
    for (const log of openLogs) {
        console.log(`Analyzing: ${log.first_name} ${log.last_name} (Code: ${log.employee_id_number})`);
        
        // Find any raw biometric punch for this employee on July 3rd morning (00:00:00 to 10:00:00)
        const code = log.employee_id_number;
        const punches = await db('biometric_raw_logs')
            .where({ company_id: log.company_id })
            .where('employee_code', 'like', `%${code}%`)
            .whereRaw('punch_time >= ? AND punch_time <= ?', ['2026-07-03 00:00:00', '2026-07-03 10:00:00'])
            .orderBy('punch_time', 'asc');
            
        if (punches.length === 0) {
            console.log(`  -> No July 3rd morning punches found in raw logs. Skipping.`);
            continue;
        }
        
        // Pick the first punch in this window as the checkout punch
        const checkoutPunch = punches[0];
        const punchTimeStr = formatLocalYYYYMMDDHHmmss(dbDateToUTC(checkoutPunch.punch_time));
        console.log(`  -> Found checkout punch at: ${punchTimeStr} (Raw Log ID: ${checkoutPunch.id}, Status: ${checkoutPunch.status})`);
        
        // Calculate the new status (present / late / early_out)
        let newStatus = 'present';
        const checkInTime = dbDateToUTC(log.check_in);
        const checkOutTime = dbDateToUTC(checkoutPunch.punch_time);
        
        const shiftStart = log.shift_start || '09:00';
        const shiftEnd = log.shift_end || '18:00';
        const graceIn = parseInt(log.grace_period || 15);
        
        const [sH, sM] = shiftStart.split(':').map(Number);
        const [eH, eM] = shiftEnd.split(':').map(Number);
        
        const checkInMins = checkInTime.getHours() * 60 + checkInTime.getMinutes();
        const checkOutMins = checkOutTime.getHours() * 60 + checkOutTime.getMinutes();
        
        const s1StartMins = sH * 60 + sM;
        let s1EndMins = eH * 60 + eM;
        if (s1EndMins < s1StartMins) {
            s1EndMins += 24 * 60; // night shift crossover
        }
        
        const isLate = checkInMins > (s1StartMins + graceIn);
        const isEarlyOut = checkOutMins < s1EndMins;
        
        if (isLate) {
            newStatus = 'late';
        } else if (isEarlyOut) {
            newStatus = 'early_out';
        }
        
        // Check if there is an incorrect July 3rd attendance check-in created by this punch
        const wrongJuly3Att = await db('attendance')
            .where({ employee_id: log.employee_id })
            .whereRaw('DATE(check_in) = ?', ['2026-07-03'])
            .whereRaw('ABS(TIMESTAMPDIFF(MINUTE, check_in, ?)) <= 5', [punchTimeStr])
            .first();
            
        if (wrongJuly3Att) {
            console.log(`  -> Deleting incorrect July 3rd check-in record (ID: ${wrongJuly3Att.id})`);
            await db('attendance').where({ id: wrongJuly3Att.id }).del();
        }
        
        // Update the July 2nd attendance record
        await db('attendance')
            .where({ id: log.attendance_id })
            .update({
                check_out: punchTimeStr,
                status: newStatus,
                updated_at: db.fn.now()
            });
            
        // Update the raw biometric log status to synced
        await db('biometric_raw_logs')
            .where({ id: checkoutPunch.id })
            .update({
                status: 'synced',
                error_details: null
            });
            
        console.log(`  -> SUCCESS: Updated July 2nd checkout to ${punchTimeStr} and status to '${newStatus}'`);
    }
    
    db.destroy();
}

fixSkippedCheckouts().catch(e => {
    console.error(e);
    db.destroy();
});
