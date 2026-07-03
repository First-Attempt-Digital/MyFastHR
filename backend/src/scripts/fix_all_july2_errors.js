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

function dateToISTDateString(dateVal) {
    if (!dateVal) return null;
    const d = dbDateToUTC(dateVal);
    if (!d || isNaN(d.getTime())) return null;
    const istDate = new Date(d.getTime() + (5.5 * 60 * 60 * 1000));
    const y = istDate.getUTCFullYear();
    const m = String(istDate.getUTCMonth() + 1).padStart(2, '0');
    const day = String(istDate.getUTCDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}

function getLogicalDateStr(checkIn, employeeShift = null) {
    if (!checkIn) return null;
    const d = dbDateToUTC(checkIn);
    if (!d || isNaN(d.getTime())) return null;
    
    const checkInYMD = d.toLocaleDateString('sv-SE', { timeZone: 'Asia/Kolkata' });
    const istStr = d.toLocaleTimeString('en-GB', { timeZone: 'Asia/Kolkata', hour: '2-digit', hour12: false });
    const hour = parseInt(istStr, 10);
    
    if (hour >= 0 && hour < 6) {
        const prevDate = new Date(d.getTime() - 24 * 60 * 60 * 1000);
        const prevDateStr = prevDate.toLocaleDateString('sv-SE', { timeZone: 'Asia/Kolkata' });
        
        if (employeeShift && isNightShift(employeeShift)) {
            return prevDateStr;
        }
    }
    
    return checkInYMD;
}

function isNightShift(shift) {
    if (!shift || !shift.start_time) return false;
    const end_time = shift.end_time || '18:00';
    const [sH, sM] = shift.start_time.split(':').map(Number);
    const [eH, eM] = end_time.split(':').map(Number);
    const sMins = sH * 60 + sM;
    const eMins = eH * 60 + eM;
    return eMins < sMins;
}

async function fixAllJuly2Errors() {
    console.log(`=== MASTER RECOVERY SCRIPT FOR JULY 2ND ATTENDANCE ===\n`);
    
    // Fetch all employees
    const employees = await db('employees as e')
        .leftJoin('shifts as s', 'e.shift_id', 's.id')
        .select('e.*', 's.start_time', 's.end_time', 's.grace_period');
        
    console.log(`Analyzing ${employees.length} employees...`);
    
    for (const emp of employees) {
        const code = emp.employee_id_number;
        
        // Fetch all raw biometric logs for this employee from July 2nd 00:00 to July 3rd 12:00 PM
        const rawPunches = await db('biometric_raw_logs')
            .where({ company_id: emp.company_id })
            .where('employee_code', 'like', `%${code}%`)
            .whereRaw('punch_time >= ? AND punch_time <= ?', ['2026-07-02 00:00:00', '2026-07-03 12:00:00'])
            .orderBy('punch_time', 'asc');
            
        if (rawPunches.length === 0) {
            continue;
        }
        
        // Map punches to their logical date (July 2nd)
        // If a punch occurs on July 3rd before 10 AM, and the employee is on a night shift or day shift starting July 2nd:
        // We resolve if it belongs to July 2nd logical date.
        const hasJuly2CheckIn = await db('attendance')
            .where({ employee_id: emp.id })
            .whereRaw('DATE(check_in) = ?', ['2026-07-02'])
            .first();

        const july2Punches = [];
        for (const p of rawPunches) {
            const punchTime = dbDateToUTC(p.punch_time);
            const logicalDate = getLogicalDateStr(punchTime, emp);
            
            // Fallback for night shifts or late checkouts:
            // Any punch on July 3rd morning (before 10 AM) is logically July 2nd checkout 
            // ONLY if the employee actually has a check-in on July 2nd.
            const pTimeStr = formatLocalYYYYMMDDHHmmss(punchTime);
            const isJuly3Morning = hasJuly2CheckIn && pTimeStr.startsWith('2026-07-03') && punchTime.getHours() < 10;
            
            if (logicalDate === '2026-07-02' || isJuly3Morning) {
                july2Punches.push(p);
            }
        }
        
        if (july2Punches.length === 0) {
            continue;
        }
        
        console.log(`\nEmployee: ${emp.first_name} ${emp.last_name} (Code: ${code})`);
        console.log(`  Found ${july2Punches.length} raw punches logically belonging to July 2nd:`);
        for (const jp of july2Punches) {
            console.log(`    - Punch time: ${jp.punch_time} | Status: ${jp.status}`);
        }
        
        // Determine earliest (check-in) and latest (check-out) punch
        const earliestPunch = july2Punches[0];
        const latestPunch = july2Punches[july2Punches.length - 1];
        
        const checkInTimeStr = formatLocalYYYYMMDDHHmmss(dbDateToUTC(earliestPunch.punch_time));
        const checkOutTimeStr = earliestPunch.id === latestPunch.id ? null : formatLocalYYYYMMDDHHmmss(dbDateToUTC(latestPunch.punch_time));
        
        console.log(`  Calculated: check_in = ${checkInTimeStr} | check_out = ${checkOutTimeStr}`);
        
        // Find existing attendance record for July 2nd
        let attRecord = hasJuly2CheckIn;
            
        // Calculate new status
        let newStatus = 'present';
        if (checkOutTimeStr) {
            const checkInTime = dbDateToUTC(checkInTimeStr);
            const checkOutTime = dbDateToUTC(checkOutTimeStr);
            
            const shiftStart = emp.start_time || '09:00';
            const shiftEnd = emp.end_time || '18:00';
            const graceIn = parseInt(emp.grace_period || 15);
            
            const [sH, sM] = shiftStart.split(':').map(Number);
            const [eH, eM] = shiftEnd.split(':').map(Number);
            
            const checkInMins = checkInTime.getHours() * 60 + checkInTime.getMinutes();
            let checkOutMins = checkOutTime.getHours() * 60 + checkOutTime.getMinutes();
            if (checkOutTime.getDate() !== checkInTime.getDate()) {
                checkOutMins += 24 * 60;
            }
            
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
        } else {
            newStatus = 'absent';
        }
        
        // Clean up wrong July 3rd attendance record if checkOutTimeStr matches it
        if (checkOutTimeStr) {
            const wrongJuly3Att = await db('attendance')
                .where({ employee_id: emp.id })
                .whereRaw('DATE(check_in) = ?', ['2026-07-03'])
                .whereRaw('ABS(TIMESTAMPDIFF(MINUTE, check_in, ?)) <= 5', [checkOutTimeStr])
                .first();
                
            if (wrongJuly3Att) {
                console.log(`  -> Deleting incorrect July 3rd check-in (ID: ${wrongJuly3Att.id})`);
                await db('attendance').where({ id: wrongJuly3Att.id }).del();
            }
        }
        
        if (attRecord) {
            // Update existing record
            console.log(`  -> Updating Attendance ID ${attRecord.id}: check_out = ${checkOutTimeStr}, status = ${newStatus}`);
            await db('attendance')
                .where({ id: attRecord.id })
                .update({
                    check_in: checkInTimeStr,
                    check_out: checkOutTimeStr,
                    status: newStatus,
                    punch_source: 'biometric',
                    updated_at: db.fn.now()
                });
        } else {
            // Create new record
            console.log(`  -> Creating new Attendance record: check_in = ${checkInTimeStr}, check_out = ${checkOutTimeStr}, status = ${newStatus}`);
            await db('attendance').insert({
                employee_id: emp.id,
                company_id: emp.company_id,
                check_in: checkInTimeStr,
                check_out: checkOutTimeStr,
                status: newStatus,
                punch_source: 'biometric',
                created_at: db.fn.now(),
                updated_at: db.fn.now()
            });
        }
        
        // Mark all resolved raw punches as synced
        const punchIds = july2Punches.map(jp => jp.id);
        await db('biometric_raw_logs')
            .whereIn('id', punchIds)
            .update({
                status: 'synced',
                error_details: null
            });
        console.log(`  -> Marked ${punchIds.length} raw punches as synced.`);
    }
    
    db.destroy();
}

fixAllJuly2Errors().catch(e => {
    console.error(e);
    db.destroy();
});
