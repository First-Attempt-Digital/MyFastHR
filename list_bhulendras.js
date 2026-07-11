const db = require('./backend/src/config/db');

async function listBhulendras() {
    try {
        const emps = await db('employees')
            .where('first_name', 'like', '%Bhulendra%')
            .orWhere('last_name', 'like', '%Bhulendra%');
        console.log('Employees matching:', JSON.stringify(emps.map(e => ({
            id: e.id,
            company_id: e.company_id,
            employee_id_number: e.employee_id_number,
            first_name: e.first_name,
            last_name: e.last_name
        })), null, 2));
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
listBhulendras();
