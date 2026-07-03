const db = require('../config/db');

// Timezone-safe date helpers
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

function dateToISTMins(dateVal) {
    if (!dateVal) return 0;
    const d = dbDateToUTC(dateVal);
    if (!d || isNaN(d.getTime())) return 0;
    const istDate = new Date(d.getTime() + (5.5 * 60 * 60 * 1000));
    const h = istDate.getUTCHours();
    const m = istDate.getUTCMinutes();
    return h * 60 + m;
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

async function cleanupAndFix() {
    console.log(`=== STARTING CLEANUP AND FIX FOR JULY 2ND & 3RD ===\n`);
    
    // 1. DELETE ALL BIOMETRIC ATTENDANCE ON JULY 3RD AND RE-PROCESS FROM RAW LOGS
    // This cleans up any duplicate, mismatched, or missing check-ins on July 3rd.
    console.log("Cleaning up all biometric attendance records for July 3rd...");
    await db('attendance')
        .where({ company_id: 27 })
        .whereRaw('DATE(check_in) = ?', ['2026-07-03'])
        .where('punch_source', 'biometric')
        .del();

    console.log("Resetting July 3rd raw biometric logs to pending...");
    await db('biometric_raw_logs')
        .where({ company_id: 27 })
        .whereRaw('DATE(punch_time) = ?', ['2026-07-03'])
        .update({ status: 'pending' });

    console.log("Fetching raw biometric logs for July 3rd...");
    const rawLogs = await db('biometric_raw_logs')
        .where({ company_id: 27 })
        .whereRaw('DATE(punch_time) = ?', ['2026-07-03'])
        .orderBy('punch_time', 'asc');

    console.log(`Found ${rawLogs.length} raw logs for July 3rd. Re-processing...`);
    const machineAttendanceService = require('../services/machineAttendanceService');
    for (const log of rawLogs) {
        console.log(`  -> Processing punch: Code ${log.employee_code} at ${log.punch_time}`);
        const punchPayload = {
            employee_code: log.employee_code,
            timestamp: log.punch_time,
            device_serial: log.device_serial || 'BIOMETRIC_DEV'
        };
        try {
            const res = await machineAttendanceService.processPunch(27, log.device_serial || 'BIOMETRIC_DEV', punchPayload);
            console.log(`     Result: ${JSON.stringify(res)}`);
        } catch (err) {
            console.error(`     Error processing: ${err.message}`);
        }
    }
    
    // 2. FIX STATUS OF JULY 2ND SHIFTS (NIGHT SHIFT CROSSOVER)
    const nightShiftEmps = await db('employees as e')
        .join('shifts as s', 'e.shift_id', 's.id')
        .where('e.company_id', 27)
        .select('e.id as emp_id', 'e.first_name', 'e.last_name', 's.start_time', 's.end_time', 's.grace_period');
        
    console.log(`\nRe-calculating status for July 2nd shifts...`);
    
    for (const emp of nightShiftEmps) {
        const att = await db('attendance')
            .where({ employee_id: emp.emp_id })
            .whereRaw('DATE(check_in) = ?', ['2026-07-02'])
            .first();
            
        if (!att || !att.check_out) continue;
        
        const checkInTime = dbDateToUTC(att.check_in);
        const checkOutTime = dbDateToUTC(att.check_out);
        
        const shiftStart = emp.start_time || '09:00';
        const shiftEnd = emp.end_time || '18:00';
        const graceIn = parseInt(emp.grace_period || 15);
        
        const [sH, sM] = shiftStart.split(':').map(Number);
        const [eH, eM] = shiftEnd.split(':').map(Number);
        
        const checkInMins = dateToISTMins(checkInTime);
        
        // Correct next-day timezone logic for checkOutMins
        let checkOutMins = dateToISTMins(checkOutTime);
        const checkInDateStr = dateToISTDateString(checkInTime);
        const checkOutDateStr = dateToISTDateString(checkOutTime);
        if (checkOutDateStr !== checkInDateStr) {
            checkOutMins += 24 * 60;
        }
        
        const s1StartMins = sH * 60 + sM;
        let s1EndMins = eH * 60 + eM;
        if (s1EndMins < s1StartMins) {
            s1EndMins += 24 * 60; // night shift crossover
        }
        
        const isLate = checkInMins > (s1StartMins + graceIn);
        const isEarlyOut = checkOutMins < s1EndMins;
        
        let newStatus = 'present';
        if (isLate) {
            newStatus = 'late';
        } else if (isEarlyOut) {
            newStatus = 'early_out';
        }
        
        if (att.status !== newStatus) {
            console.log(`Employee: ${emp.first_name} ${emp.last_name} | Old Status: ${att.status} -> New Status: ${newStatus}`);
            await db('attendance')
                .where({ id: att.id })
                .update({ status: newStatus });
        }
    }
    
    console.log(`\n=== CLEANUP AND FIX COMPLETE ===`);
    db.destroy();
}

cleanupAndFix().catch(e => {
    console.error(e);
    db.destroy();
});
