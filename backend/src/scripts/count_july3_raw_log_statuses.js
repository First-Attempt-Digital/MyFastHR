const db = require('../config/db');

async function countStatuses() {
    console.log("=== COUNTING JULY 3RD RAW LOG STATUSES ===");
    const counts = await db('biometric_raw_logs')
        .where({ company_id: 27 })
        .whereRaw('DATE(punch_time) = ?', ['2026-07-03'])
        .select('status')
        .count('id as cnt')
        .groupBy('status');
        
    console.log("Raw Log Statuses:");
    console.log(JSON.stringify(counts, null, 2));
    
    console.log("\n=== COUNTING ATTENDANCE RECORDS FOR JULY 3RD ===");
    const attCounts = await db('attendance as a')
        .join('employees as e', 'a.employee_id', 'e.id')
        .where('e.company_id', 27)
        .whereRaw('DATE(a.check_in) = ?', ['2026-07-03'])
        .select('a.status')
        .count('a.id as cnt')
        .groupBy('a.status');
        
    console.log("Attendance Statuses:");
    console.log(JSON.stringify(attCounts, null, 2));

    db.destroy();
}

countStatuses().catch(e => {
    console.error(e);
    db.destroy();
});
