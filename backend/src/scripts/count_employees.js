const db = require('../config/db');

async function countEmployees() {
    console.log("=== COUNTING ACTIVE EMPLOYEES FOR COMPANY 27 ===");
    const empCount = await db('employees')
        .where({ company_id: 27 })
        .count('id as cnt')
        .first();
    console.log("Total Employees:", empCount.cnt);
    
    // Count shifts assigned to company 27
    const shifts = await db('shifts')
        .where({ company_id: 27 })
        .select('*');
    console.log("\nShifts assigned to Company 27:");
    console.log(JSON.stringify(shifts, null, 2));

    db.destroy();
}

countEmployees().catch(e => {
    console.error(e);
    db.destroy();
});
