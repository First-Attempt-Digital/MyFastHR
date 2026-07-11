const knex = require('knex');
const config = require('./knexfile');
const db = knex(config.development);

async function main() {
    try {
        const assignmentsCompany2 = await db('employee_shift_assignments').where('company_id', 2);
        console.log('Assignments for Company 2:', assignmentsCompany2);

        const shiftsCompany2 = await db('shifts').where('company_id', 2);
        console.log('Shifts for Company 2:', shiftsCompany2);

        const employeesCompany2 = await db('employees').where('company_id', 2).select('id', 'first_name', 'last_name', 'shift_id');
        console.log('Employees for Company 2:', employeesCompany2);
    } catch (err) {
        console.error(err);
    } finally {
        process.exit(0);
    }
}
main();
