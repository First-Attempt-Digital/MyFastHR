const db = require('./backend/src/config/db');
const attendanceService = require('./backend/src/services/attendanceService');

async function testOverride() {
    try {
        const user = { id: 1, company_id: 2 }; // manager's company_id is 2, matches Bhulendra
        const data = {
            employee_id: 609,
            date: '2026-07-01',
            status: 'P'
        };

        console.log('--- Before Override ---');
        let logs = await db('attendance').where({ employee_id: 609 });
        console.log('Attendance logs:', JSON.stringify(logs, null, 2));

        console.log('\nRunning manualUpdateAttendance...');
        const res = await attendanceService.manualUpdateAttendance(user, 2, data);
        console.log('Result:', res);

        console.log('\n--- After Override ---');
        logs = await db('attendance').where({ employee_id: 609 });
        console.log('Attendance logs:', JSON.stringify(logs, null, 2));

        console.log('\nFetching history...');
        const history = await attendanceService.getEmployeeAttendanceHistory(2, 609, '2026-07-01', '2026-07-02');
        console.log('History:', JSON.stringify(history, null, 2));

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
testOverride();
