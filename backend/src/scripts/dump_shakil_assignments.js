const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const db = require('../config/db');

async function dumpAssignments() {
    const code = '10018';
    const dateStr = '2026-07-01';

    const emp = await db('employees').where('employee_id_number', code).first();
    if (!emp) {
        console.log('Employee not found!');
        process.exit(1);
    }

    const assignments = await db('employee_shift_assignments as esa')
        .join('shifts as s', 'esa.shift_id', 's.id')
        .where('esa.employee_id', emp.id)
        .select('esa.*', 's.name as shift_name', 's.start_time', 's.end_time');

    console.log(`\n=== All Shift Assignments for Shakil (ID: ${emp.id}) ===`);
    console.log(JSON.stringify(assignments, null, 2));

    process.exit(0);
}

dumpAssignments().catch(console.error);
