const db = require('../config/db');

async function fixAjayRam() {
    console.log("=== FIXING AJAY RAM (10103) FOR JULY 3RD ===");
    
    const emp = await db('employees').where({ employee_id_number: '10103' }).first();
    if (!emp) {
        console.error("Employee Ajay Ram (10103) not found!");
        process.exit(1);
    }
    
    console.log(`Found Employee ID: ${emp.id}`);
    
    // 1. Update attendance record
    const attUpdated = await db('attendance')
        .where({ employee_id: emp.id })
        .whereRaw('DATE(check_in) = ?', ['2026-07-03'])
        .update({
            check_out: null,
            status: 'pending',
            updated_at: db.fn.now()
        });
        
    console.log(`Updated attendance rows: ${attUpdated}`);
    
    // 2. Update biometric raw log for the 04:15 PM checkout punch to be skipped
    const rawUpdated = await db('biometric_raw_logs')
        .where({ company_id: emp.company_id, employee_code: '10103' })
        .whereRaw('DATE(punch_time) = ?', ['2026-07-03'])
        .whereRaw('HOUR(punch_time) = 16 AND MINUTE(punch_time) = 15')
        .update({
            status: 'skipped',
            error_details: 'Punch ignored: worked hours (0.05) is less than the half-day threshold (4.00 hours).'
        });
        
    console.log(`Updated raw log rows: ${rawUpdated}`);
    
    db.destroy();
}

fixAjayRam().catch(e => {
    console.error(e);
    db.destroy();
});
