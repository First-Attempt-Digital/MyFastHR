const db = require('../config/db');

async function inspectResults() {
    console.log("=== INSPECTING JULY 3RD RAW LOGS AND ATTENDANCE (CO: 27) ===");
    
    // Fetch all raw logs of July 3rd for company 27
    const logs = await db('biometric_raw_logs')
        .where({ company_id: 27 })
        .whereRaw('DATE(punch_time) = ?', ['2026-07-03'])
        .orderBy('punch_time', 'asc');
        
    console.log(`Found ${logs.length} raw logs for Co 27 on July 3rd.`);
    
    // Group by employee_code
    const empPunches = {};
    for (const log of logs) {
        if (!empPunches[log.employee_code]) {
            empPunches[log.employee_code] = [];
        }
        empPunches[log.employee_code].push(log);
    }
    
    for (const [code, punches] of Object.entries(empPunches)) {
        console.log(`Employee Code: ${code}`);
        for (const p of punches) {
            console.log(`  Punch: ${p.punch_time} | Status: ${p.status} | Err: ${p.error_details}`);
        }
        
        // Check attendance record
        const emp = await db('employees').where({ company_id: 27, employee_id_number: code }).first();
        if (emp) {
            const att = await db('attendance')
                .where({ employee_id: emp.id })
                .whereRaw('DATE(check_in) = ?', ['2026-07-03'])
                .first();
            if (att) {
                console.log(`  -> Attendance ID: ${att.id} | check_in: ${att.check_in} | check_out: ${att.check_out} | status: ${att.status} | source: ${att.punch_source}`);
            } else {
                console.log(`  -> NO attendance record on July 3rd!`);
            }
        } else {
            console.log(`  -> Employee not found for code ${code}!`);
        }
        console.log('');
    }
    
    db.destroy();
}

inspectResults().catch(e => {
    console.error(e);
    db.destroy();
});
