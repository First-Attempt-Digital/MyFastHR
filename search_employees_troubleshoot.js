// Find Divyanshu and Naresh in the database
const knex = require('./backend/src/config/db');

async function debug() {
    try {
        console.log('=== SEARCHING FOR EMPLOYEES ===');
        const emps = await knex('employees')
            .where('first_name', 'like', '%Divyanshu%')
            .orWhere('first_name', 'like', '%Naresh%')
            .orWhere('first_name', 'like', '%Bhulendra%')
            .select('id', 'first_name', 'last_name', 'employee_id_number', 'company_id');
        console.log(JSON.stringify(emps, null, 2));

        if (emps.length > 0) {
            const empIds = emps.map(e => e.id);
            const logs = await knex('attendance')
                .whereIn('employee_id', empIds)
                .where('check_in', '>=', '2026-07-01 00:00:00')
                .where('check_in', '<=', '2026-07-01 23:59:59');
            console.log('\n=== ATTENDANCE LOGS ON JULY 1 FOR THESE EMPLOYEES ===');
            console.log(JSON.stringify(logs, null, 2));
        }

    } catch (err) {
        console.error('ERROR:', err.message);
    } finally {
        await knex.destroy();
    }
}

debug();
