const db = require('../config/db');

async function checkRaw() {
    console.log("=== CHECKING RAW LOGS FOR JULY 3RD IN DATABASE ===");
    const logs = await db('biometric_raw_logs')
        .whereRaw('DATE(punch_time) = ?', ['2026-07-03'])
        .orderBy('punch_time', 'asc');
        
    console.log(`Found ${logs.length} raw logs on July 3rd:`);
    for (const log of logs) {
        console.log(`ID: ${log.id} | Code: ${log.employee_code} | Time: ${log.punch_time} | Status: ${log.status} | Error: ${log.error_details}`);
    }
    db.destroy();
}

checkRaw().catch(e => {
    console.error(e);
    db.destroy();
});
