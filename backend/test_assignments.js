const knex = require('knex');
const config = require('./knexfile');
const db = knex(config.development);

async function main() {
    try {
        const employees = await db('employees as e')
            .leftJoin('departments as d', 'e.department_id', 'd.id')
            .leftJoin('shifts as s', 'e.shift_id', 's.id')
            .leftJoin('attendance_schemes as asch', 'e.attendance_scheme_id', 'asch.id')
            .where('e.company_id', 2)
            .select(
                'e.id',
                'e.first_name',
                'e.last_name',
                'e.employee_id_number',
                'e.office_location'
            );
        console.log('Sample assignments:', employees.slice(0, 5));
        console.log('Unique office locations:', [...new Set(employees.map(e => e.office_location))]);
    } catch (err) {
        console.error(err);
    } finally {
        process.exit(0);
    }
}
main();
