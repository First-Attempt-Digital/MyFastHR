const db = require('../config/db');

async function inspectEmployeesAndShifts() {
    console.log("=== EMPLOYEES AND THEIR SHIFTS ===");
    const emps = await db('employees as e')
        .leftJoin('shifts as s', 'e.shift_id', 's.id')
        .where('e.company_id', 27)
        .select(
            'e.id', 'e.first_name', 'e.last_name', 'e.employee_id_number',
            's.name as shift_name', 's.start_time', 's.end_time', 's.terminate_hour'
        );
        
    for (const emp of emps) {
        console.log(`Emp: ${emp.first_name} ${emp.last_name} (${emp.employee_id_number}) | Shift: ${emp.shift_name} (${emp.start_time} - ${emp.end_time}) | Terminate: ${emp.terminate_hour}`);
    }
    db.destroy();
}

inspectEmployeesAndShifts();
