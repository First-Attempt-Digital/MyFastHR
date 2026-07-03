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

function dateToISTMins(dateVal) {
    if (!dateVal) return 0;
    const d = dbDateToUTC(dateVal);
    if (!d || isNaN(d.getTime())) return 0;
    const istDate = new Date(d.getTime() + (5.5 * 60 * 60 * 1000));
    return istDate.getUTCHours() * 60 + istDate.getUTCMinutes();
}

function getLogicalDateStr(checkIn, employeeShifts = [], defaultShift = null) {
    if (!checkIn) return null;
    const d = dbDateToUTC(checkIn);
    if (!d || isNaN(d.getTime())) return null;
    
    const checkInYMD = d.toLocaleDateString('sv-SE', { timeZone: 'Asia/Kolkata' });
    const istStr = d.toLocaleTimeString('en-GB', { timeZone: 'Asia/Kolkata', hour: '2-digit', hour12: false });
    const hour = parseInt(istStr, 10);
    
    if (hour >= 0 && hour < 6) {
        const prevDate = new Date(d.getTime() - 24 * 60 * 60 * 1000);
        const prevDateStr = prevDate.toLocaleDateString('sv-SE', { timeZone: 'Asia/Kolkata' });
        
        const shift = employeeShifts.find(s => {
            const fromStr = s.from_date instanceof Date ? s.from_date.toLocaleDateString('sv-SE', { timeZone: 'Asia/Kolkata' }) : String(s.from_date || '').split('T')[0];
            const toStr = s.to_date instanceof Date ? s.to_date.toLocaleDateString('sv-SE', { timeZone: 'Asia/Kolkata' }) : (s.to_date ? String(s.to_date).split('T')[0] : null);
            return prevDateStr >= fromStr && (!toStr || prevDateStr <= toStr);
        }) || defaultShift;
        
        if (shift && isNightShift(shift)) {
            return prevDateStr;
        }
    }
    
    return checkInYMD;
}

function isNightShift(shift) {
    if (!shift || !shift.start_time || !shift.end_time) return false;
    const [sH, sM] = shift.start_time.split(':').map(Number);
    const [eH, eM] = shift.end_time.split(':').map(Number);
    const sMins = sH * 60 + sM;
    const eMins = eH * 60 + eM;
    return eMins < sMins;
}

async function debugRamraj() {
    const code = '10035';
    const dateStr = '2026-07-02';
    
    console.log(`=== DEBUGGING RAMRAJ (Code: ${code}) on ${dateStr} ===`);
    
    const employee = await db('employees as e')
        .leftJoin('shifts as s', 'e.shift_id', 's.id')
        .where('e.employee_id_number', code)
        .select('e.*', 's.start_time', 's.end_time', 's.grace_period', 's.total_punches_required')
        .first();
        
    if (!employee) {
        console.error('Employee not found!');
        process.exit(1);
    }
    
    console.log(`\n1. Employee Details:`);
    console.log(`   Name: ${employee.first_name} ${employee.last_name}`);
    console.log(`   Default Shift: ${employee.start_time} - ${employee.end_time}`);
    
    // Check shift overrides
    const overrides = await db('employee_shift_assignments as esa')
        .join('shifts as s', 'esa.shift_id', 's.id')
        .where('esa.employee_id', employee.id)
        .select('esa.*', 's.start_time', 's.end_time')
        .orderBy('esa.id', 'desc');
    console.log(`   Shift Overrides found: ${overrides.length}`);
    for (const ov of overrides) {
        console.log(`     From: ${ov.from_date} | To: ${ov.to_date || 'Present'} | Shift: ${ov.start_time} - ${ov.end_time}`);
    }
    
    // Find attendance records for this date
    // Note: getMatrix queries using getLogicalDateStr
    const allAttendance = await db('attendance')
        .where({ employee_id: employee.id })
        .orderBy('check_in', 'asc');
        
    console.log(`\n2. Attendance Logs in DB (Total: ${allAttendance.length}):`);
    let matchedRecord = null;
    for (const att of allAttendance) {
        const logicalDate = getLogicalDateStr(att.check_in, overrides, employee);
        const isMatch = (logicalDate === dateStr);
        console.log(`   ID: ${att.id} | check_in: ${att.check_in} | check_out: ${att.check_out} | status: ${att.status} | source: ${att.punch_source} | LOGICAL DATE: ${logicalDate} (Match: ${isMatch})`);
        if (isMatch) {
            matchedRecord = att;
        }
    }
    
    if (matchedRecord) {
        console.log(`\n3. Match Found:`);
        console.log(`   Updating status to 'present' in DB...`);
        await db('attendance')
            .where({ id: matchedRecord.id })
            .update({ status: 'present', updated_at: db.fn.now() });
            
        // Double check after update
        const updated = await db('attendance').where({ id: matchedRecord.id }).first();
        console.log(`   Updated Record: check_in: ${updated.check_in} | check_out: ${updated.check_out} | status: ${updated.status}`);
    } else {
        console.log(`\nNo matched record found for date ${dateStr}.`);
    }
    
    db.destroy();
}

debugRamraj().catch(e => {
    console.error(e);
    db.destroy();
});
