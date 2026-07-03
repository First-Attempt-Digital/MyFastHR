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

async function cleanupAndFix() {
    console.log(`=== STARTING CLEANUP AND FIX FOR JULY 2ND & 3RD ===\n`);
    
    // 1. DELETE INCORRECT DUPLICATE RECORDS ON JULY 3RD
    // If an employee has duplicate records on July 3rd, keep the 'present' one and delete the 'absent' one
    const duplicates = await db('attendance')
        .select('employee_id')
        .whereRaw('DATE(check_in) = ?', ['2026-07-03'])
        .groupBy('employee_id')
        .havingRaw('COUNT(id) > 1');
        
    console.log(`Found ${duplicates.length} employees with duplicate records on July 3rd.`);
    
    for (const dup of duplicates) {
        const empId = dup.employee_id;
        const records = await db('attendance')
            .where({ employee_id: empId })
            .whereRaw('DATE(check_in) = ?', ['2026-07-03'])
            .orderBy('id', 'asc');
            
        console.log(`\nProcessing duplicate records for Employee ID: ${empId}`);
        
        // Find the record to keep (preferably the one that is 'present')
        let recordToKeep = records.find(r => r.status === 'present' || r.status === 'pending' || r.status === 'late' || r.status === 'early_out');
        if (!recordToKeep) {
            recordToKeep = records[0]; // fallback
        }
        
        console.log(`  Keeping Record ID: ${recordToKeep.id} | check_in: ${recordToKeep.check_in} | status: ${recordToKeep.status}`);
        
        for (const r of records) {
            if (r.id !== recordToKeep.id) {
                console.log(`  Deleting Record ID: ${r.id} | check_in: ${r.check_in} | status: ${r.status}`);
                await db('attendance').where({ id: r.id }).del();
            }
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
        
        const checkInMins = checkInTime.getHours() * 60 + checkInTime.getMinutes();
        
        // Correct next-day timezone logic for checkOutMins
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
