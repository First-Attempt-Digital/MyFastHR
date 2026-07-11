const knex = require('knex');
const config = require('./knexfile');
const db = knex(config.development);

async function main() {
    try {
        const columns = await db('employee_shift_assignments').columnInfo();
        console.log('Employee Shift Assignments Table Structure:', columns);

        const rows = await db('employee_shift_assignments').select('*').limit(10);
        console.log('Sample Shift Assignments Rows:', rows);

        const shifts = await db('shifts').select('id', 'name');
        console.log('Shifts List:', shifts);
    } catch (err) {
        console.error(err);
    } finally {
        process.exit(0);
    }
}
main();
