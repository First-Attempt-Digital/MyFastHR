// Check shift assignments for Divyanshu
const knex = require('./backend/src/config/db');

async function debug() {
    try {
        const assignments = await knex('employee_shift_assignments')
            .where('employee_id', 339);
        console.log('Divyanshu shift assignments:', assignments);

        const emp = await knex('employees')
            .where('id', 339)
            .first();
        console.log('Divyanshu default shift_id:', emp.shift_id);

    } catch (err) {
        console.error('ERROR:', err.message);
    } finally {
        await knex.destroy();
    }
}

debug();
