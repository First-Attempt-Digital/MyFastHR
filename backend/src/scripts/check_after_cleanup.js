const db = require('../config/db');

async function checkAfterCleanup() {
    console.log("=== CHECKING ATTENDANCE RECORDS FOR JULY 3RD ===");
    const atts = await db('attendance as a')
        .join('employees as e', 'a.employee_id', 'e.id')
        .whereRaw('DATE(a.check_in) = ?', ['2026-07-03'])
        .select('a.*', 'e.first_name', 'e.last_name', 'e.employee_id_number')
        .orderBy('a.id', 'asc');
        
    console.log(`Found ${atts.length} attendance records on July 3rd:`);
    for (const a of atts) {
        console.log(`ID: ${a.id} | Emp: ${a.first_name} ${a.last_name} (${a.employee_id_number}) | check_in: ${a.check_in} | check_out: ${a.check_out} | status: ${a.status} | source: ${a.punch_source}`);
    }
    
    console.log("\n=== CHECKING SKIPPED RAW LOGS FOR JULY 3RD ===");
    const skipped = await db('biometric_raw_logs')
        .whereRaw('DATE(punch_time) = ?', ['2026-07-03'])
        .where({ status: 'skipped' })
        .select('*');
        
    console.log(`Found ${skipped.length} skipped raw logs on July 3rd:`);
    for (const s of skipped) {
        console.log(`Code: ${s.employee_code} | time: ${s.punch_time} | details: ${s.error_details}`);
    }
    
    db.destroy();
}

checkAfterCleanup().catch(e => {
    console.error(e);
    db.destroy();
});
