const db = require('../config/db');

async function verifyRepaired() {
    const codes = ['10113', '10149', '10206', '10013'];
    console.log(`=== VERIFYING FINAL ATTENDANCE STATUS FOR JULY 2ND ===`);
    
    for (const code of codes) {
        const emp = await db('employees').where('employee_id_number', code).first();
        if (!emp) {
            console.log(`Employee ${code} not found`);
            continue;
        }
        
        const atts = await db('attendance')
            .where({ employee_id: emp.id })
            .whereRaw('DATE(check_in) >= ? AND DATE(check_in) <= ?', ['2026-07-02', '2026-07-03'])
            .orderBy('check_in', 'asc');
            
        console.log(`\nEmployee: ${emp.first_name} ${emp.last_name} (Code: ${code})`);
        for (const att of atts) {
            console.log(`  Record ID: ${att.id} | check_in: ${att.check_in} | check_out: ${att.check_out} | status: ${att.status} | source: ${att.punch_source}`);
        }
    }
    
    db.destroy();
}

verifyRepaired().catch(e => {
    console.error(e);
    db.destroy();
});
