const db = require('../config/db');

async function fixSkippedCheckouts() {
    console.log('Starting fix for skipped checkouts on 2026-07-02...');
    
    // Find all raw logs that were skipped because of the checkout window bug
    const skippedLogs = await db('biometric_raw_logs')
        .where('punch_time', 'like', '2026-07-02%')
        .where('status', 'skipped')
        .where('error_details', 'like', '%checkout window has started%');
        
    console.log(`Found ${skippedLogs.length} skipped checkout logs on 2026-07-02.`);
    
    let fixedCount = 0;
    
    for (const log of skippedLogs) {
        const cleanCode = String(log.employee_code).trim().replace(/^0+/, '');
        
        // Find employee
        const employee = await db('employees')
            .whereRaw('TRIM(LEADING "0" FROM employee_id_number) = ?', [cleanCode])
            .first();
            
        if (!employee) {
            console.log(`Employee not found for code: ${log.employee_code}`);
            continue;
        }
        
        // Find an open attendance log for this employee on July 2nd
        const attRecord = await db('attendance')
            .where({ employee_id: employee.id })
            .whereRaw('DATE(check_in) = ?', ['2026-07-02'])
            .whereNull('check_out')
            .first();
            
        if (!attRecord) {
            console.log(`No open attendance record found for ${employee.first_name} ${employee.last_name} (ID: ${employee.employee_id_number}) on 2026-07-02.`);
            continue;
        }
        
        console.log(`Fixing attendance for ${employee.first_name} ${employee.last_name} (ID: ${employee.employee_id_number}):`);
        console.log(`  Check-in : ${attRecord.check_in}`);
        console.log(`  Checkout : ${log.punch_time} (Restored from skipped raw log)`);
        
        // Determine status (we can set to 'present' or calculate based on hours)
        const checkInTime = new Date(attRecord.check_in);
        const checkOutTime = new Date(log.punch_time);
        
        // Get employee shift
        const activeAssignment = await db('employee_shift_assignments as esa')
            .join('shifts as s', 'esa.shift_id', 's.id')
            .where('esa.employee_id', employee.id)
            .where('esa.from_date', '<=', '2026-07-02')
            .andWhere(qb => {
                qb.where('esa.to_date', '>=', '2026-07-02').orWhereNull('esa.to_date');
            })
            .select('s.*')
            .orderBy('esa.id', 'desc')
            .first();
            
        const shift = activeAssignment || await db('shifts').where('id', employee.shift_id).first();
        
        let newStatus = 'present';
        if (shift) {
            const shiftStart = shift.start_time || '09:00';
            const shiftEnd = shift.end_time || '18:00';
            const graceIn = parseInt(shift.grace_period || 15);
            
            const [sH, sM] = shiftStart.split(':').map(Number);
            const [eH, eM] = shiftEnd.split(':').map(Number);
            
            const checkInMins = checkInTime.getHours() * 60 + checkInTime.getMinutes();
            const checkOutMins = checkOutTime.getHours() * 60 + checkOutTime.getMinutes();
            
            const s1StartMins = sH * 60 + sM;
            const s1EndMins = eH * 60 + eM;
            
            const isLate = checkInMins > (s1StartMins + graceIn);
            const isEarlyOut = checkOutMins < s1EndMins;
            
            if (isLate) {
                newStatus = 'late';
            } else if (isEarlyOut) {
                newStatus = 'early_out';
            }
        }
        
        // Update attendance record
        await db('attendance')
            .where({ id: attRecord.id })
            .update({
                check_out: log.punch_time,
                status: newStatus,
                updated_at: db.fn.now()
            });
            
        // Update biometric raw log status to synced
        await db('biometric_raw_logs')
            .where({ id: log.id })
            .update({
                status: 'synced',
                error_details: 'Restored skipped punch via script'
            });
            
        console.log(`  Result   : Updated status to '${newStatus}'`);
        fixedCount++;
    }
    
    console.log(`Successfully fixed ${fixedCount} records.`);
    db.destroy();
}

fixSkippedCheckouts().catch(err => {
    console.error(err);
    db.destroy();
});
