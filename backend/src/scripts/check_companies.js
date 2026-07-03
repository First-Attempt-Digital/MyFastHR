const db = require('../config/db');

async function checkCompanies() {
    console.log("=== CHECKING COMPANY_ID IN RAW LOGS FOR JULY 3RD ===");
    const logs = await db('biometric_raw_logs')
        .whereRaw('DATE(punch_time) = ?', ['2026-07-03'])
        .select('id', 'employee_code', 'punch_time', 'company_id', 'status')
        .orderBy('punch_time', 'asc');
        
    console.log(`Found ${logs.length} logs. Displaying distinct company_ids or non-27 logs:`);
    const companies = new Set();
    for (const log of logs) {
        companies.add(log.company_id);
        if (log.company_id !== 27) {
            console.log(`ID: ${log.id} | Code: ${log.employee_code} | Time: ${log.punch_time} | Company: ${log.company_id} | Status: ${log.status}`);
        }
    }
    console.log("Distinct Company IDs in logs:", Array.from(companies));
    db.destroy();
}

checkCompanies().catch(e => {
    console.error(e);
    db.destroy();
});
