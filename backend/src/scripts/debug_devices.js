const db = require('../config/db');

async function debugDevices() {
    console.log(`=== ANALYZING DEVICE SYNC STATUS FOR JULY 3RD ===`);
    
    // Count raw punches on July 3rd by device serial
    const deviceCounts = await db('biometric_raw_logs')
        .whereRaw('DATE(punch_time) = ?', ['2026-07-03'])
        .groupBy('device_serial')
        .select('device_serial')
        .count('id as cnt');
        
    console.log(`Punches received on July 3rd by device:`);
    for (const row of deviceCounts) {
        console.log(`  Device: ${row.device_serial || 'Unknown'} | Punches: ${row.cnt}`);
    }
    
    // Check if there are any skipped punches for employee 10013 (Chandan) overall
    const chandanPunches = await db('biometric_raw_logs')
        .where('employee_code', 'like', '%10013%')
        .orderBy('punch_time', 'desc')
        .limit(10);
        
    console.log(`\nLast 10 punches for Chandan (10013) in raw logs:`);
    for (const p of chandanPunches) {
        console.log(`  Time: ${p.punch_time} | Status: ${p.status} | Device: ${p.device_serial} | Error: ${p.error_details}`);
    }
    
    db.destroy();
}

debugDevices().catch(e => {
    console.error(e);
    db.destroy();
});
