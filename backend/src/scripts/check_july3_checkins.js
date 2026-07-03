const db = require('../config/db');

async function checkJuly3() {
    console.log(`=== CHECKING JULY 3RD CHECK-INS ===`);
    const atts = await db('attendance')
        .join('employees as e', 'attendance.employee_id', 'e.id')
        .whereRaw('DATE(attendance.check_in) = ?', ['2026-07-03'])
        .select('attendance.*', 'e.first_name', 'e.last_name', 'e.employee_id_number');
        
    console.log(`Found ${atts.length} check-ins on July 3rd:`);
    for (const att of atts) {
        console.log(`ID: ${att.id} | Employee: ${att.first_name} ${att.last_name} (${att.employee_id_number}) | check_in: ${att.check_in} | check_out: ${att.check_out} | status: ${att.status} | source: ${att.punch_source}`);
    }
    
    db.destroy();
}

checkJuly3().catch(e => {
    console.error(e);
    db.destroy();
});
