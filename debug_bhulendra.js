const db = require('./backend/src/config/db');

async function debugBhulendra() {
    try {
        const emp = await db('employees').where('first_name', 'like', '%Bhulendra%').first();
        if (!emp) {
            console.log('Employee not found!');
            process.exit(1);
        }
        console.log('Employee info:', JSON.stringify(emp, null, 2));

        const dateStr = '2026-07-01';
        const nextDateStr = '2026-07-02';

        const atts = await db('attendance')
            .where({ employee_id: emp.id })
            .where('check_in', '>=', `${dateStr} 00:00:00`)
            .where('check_in', '<=', `${nextDateStr} 23:59:59`);
        console.log('Attendance logs:', JSON.stringify(atts, null, 2));

        const overrides = await db('attendance_override_history')
            .where({ employee_id: emp.id, attendance_date: dateStr });
        console.log('Override history:', JSON.stringify(overrides, null, 2));

        const shift = await db('shifts').where('id', emp.shift_id).first();
        console.log('Shift:', JSON.stringify(shift, null, 2));

        const assignments = await db('employee_shift_assignments as esa')
            .join('shifts as s', 'esa.shift_id', 's.id')
            .where('esa.employee_id', emp.id)
            .select('esa.*', 's.name', 's.start_time', 's.end_time');
        console.log('Shift assignments:', JSON.stringify(assignments, null, 2));

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
debugBhulendra();
