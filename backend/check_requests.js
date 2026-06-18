const db = require('./src/config/db');

async function main() {
    try {
        console.log('Fetching all attendance_entry_requests for June 18, 2026:');
        const reqs = await db('attendance_entry_requests')
            .leftJoin('employees as e', 'attendance_entry_requests.employee_id', 'e.id')
            .whereRaw('DATE(attendance_entry_requests.date) = ?', ['2026-06-18'])
            .select(
                'attendance_entry_requests.id',
                'attendance_entry_requests.employee_id',
                'attendance_entry_requests.request_type',
                'attendance_entry_requests.status',
                'attendance_entry_requests.date',
                'attendance_entry_requests.punch_time',
                'e.first_name',
                'e.last_name'
            );
        console.log(JSON.stringify(reqs, null, 2));

        console.log('\nFetching all attendance records for June 18, 2026:');
        const atts = await db('attendance')
            .leftJoin('employees as e', 'attendance.employee_id', 'e.id')
            .whereRaw('DATE(attendance.check_in) = ?', ['2026-06-18'])
            .select(
                'attendance.id',
                'attendance.employee_id',
                'attendance.check_in',
                'attendance.check_out',
                'attendance.status',
                'attendance.punch_source',
                'e.first_name',
                'e.last_name'
            );
        console.log(JSON.stringify(atts, null, 2));
    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}

main();
