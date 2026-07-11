// Search ALL manual overrides on July 1st, 2026 in the database
const knex = require('./backend/src/config/db');

async function debug() {
    try {
        console.log('=== ALL MANUAL OVERRIDES ON 2026-07-01 ===');
        const logs = await knex('attendance')
            .where('check_in', '>=', '2026-07-01 00:00:00')
            .where('check_in', '<=', '2026-07-01 23:59:59')
            .whereIn('punch_source', ['manual', 'manual_override']);
        console.log('Logs:', JSON.stringify(logs, null, 2));

        if (logs.length > 0) {
            const empIds = logs.map(l => l.employee_id);
            const emps = await knex('employees')
                .whereIn('id', empIds)
                .select('id', 'first_name', 'last_name', 'employee_id_number', 'company_id');
            console.log('Employees:', JSON.stringify(emps, null, 2));
        }

    } catch (err) {
        console.error('ERROR:', err.message);
    } finally {
        await knex.destroy();
    }
}

debug();
