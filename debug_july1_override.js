// Debug script to check what happens for July 1 manual update for night shift employee
const knex = require('./backend/src/config/db');

async function debug() {
    try {
        const employee_id = 609; // Bhulendra - ID from earlier test
        const date = '2026-07-01';
        const companyId = 2;
        
        console.log('\n=== CHECKING EMPLOYEE INFO ===');
        const emp = await knex('employees as e')
            .leftJoin('shifts as s', 'e.shift_id', 's.id')
            .where('e.id', employee_id)
            .select('e.id', 'e.first_name', 'e.last_name', 'e.employee_id_number', 's.id as shift_id', 's.name as shift_name', 's.start_time', 's.end_time')
            .first();
        console.log('Employee:', JSON.stringify(emp, null, 2));

        console.log('\n=== SHIFT ASSIGNMENTS ===');
        const assignments = await knex('employee_shift_assignments as esa')
            .join('shifts as s', 'esa.shift_id', 's.id')
            .where('esa.employee_id', employee_id)
            .select('esa.from_date', 'esa.to_date', 's.id as shift_id', 's.name', 's.start_time', 's.end_time')
            .orderBy('esa.from_date', 'desc')
            .limit(5);
        console.log('Shift assignments:', JSON.stringify(assignments, null, 2));

        console.log('\n=== ATTENDANCE LOGS FOR JULY 1-2 ===');
        const nextDateStr = '2026-07-02';
        const logs = await knex('attendance')
            .where({ employee_id, company_id: companyId })
            .where('check_in', '>=', `${date} 00:00:00`)
            .where('check_in', '<=', `${nextDateStr} 23:59:59`)
            .orderBy('check_in', 'asc');
        console.log('Candidate logs:', JSON.stringify(logs, null, 2));

        console.log('\n=== CONCLUSION ===');
        if (logs.length === 0) {
            console.log('NO logs found in range 2026-07-01 to 2026-07-02 - so it will INSERT 09:00-18:00');
            console.log('Night shift employee: start_time =', emp?.start_time, 'end_time =', emp?.end_time);
            console.log('09:00 insert will map to July 1 logically? Need to check getLogicalDateStr');
        } else {
            console.log('Found existing log:', logs[0]);
        }

    } catch (err) {
        console.error('ERROR:', err.message);
    } finally {
        await knex.destroy();
    }
}

debug();
