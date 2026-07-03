const db = require('../config/db');

async function checkPunches() {
    console.log("=== CHECKING ALL RAW PUNCHES FOR RAM GANIT (10065) ===");
    const rawPunches = await db('biometric_raw_logs')
        .where('employee_code', 'like', '%10065%')
        .whereRaw('DATE(punch_time) >= ? AND DATE(punch_time) <= ?', ['2026-07-01', '2026-07-04'])
        .orderBy('punch_time', 'asc');
        
    console.log(`Found ${rawPunches.length} raw punches:`);
    for (const p of rawPunches) {
        console.log(`ID: ${p.id} | Time: ${p.punch_time} | Status: ${p.status} | Err: ${p.error_details}`);
    }
    
    console.log("\n=== CHECKING ATTENDANCE RECORD FOR RAM GANIT (10065) ===");
    const atts = await db('attendance as a')
        .join('employees as e', 'a.employee_id', 'e.id')
        .where('e.employee_id_number', '10065')
        .select('a.*')
        .orderBy('a.check_in', 'asc');
    for (const a of atts) {
        console.log(`ID: ${a.id} | Check-In: ${a.check_in} | Check-Out: ${a.check_out} | Status: ${a.status}`);
    }
    
    db.destroy();
}

checkPunches().catch(e => {
    console.error(e);
    db.destroy();
});
