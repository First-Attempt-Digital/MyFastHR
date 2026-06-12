const db = require('../config/db');

class AttendanceRepository {
    async punchIn(employeeId, companyId, status = 'present', location = {}, ip = '') {
        // Prevent multiple punch-ins on the same day if one is already open
        const existing = await db('attendance')
            .where({
                employee_id: employeeId,
                company_id: companyId,
                check_out: null
            })
            .whereRaw('DATE(check_in) = CURRENT_DATE')
            .first();

        if (existing) throw new Error('Already punched in today');

        return await db('attendance').insert({
            employee_id: employeeId,
            company_id: companyId,
            check_in: db.fn.now(),
            status: status,
            latitude: location.latitude || null,
            longitude: location.longitude || null,
            accuracy: location.accuracy || null,
            punch_location: location.location || null,
            remarks: location.remarks || null
        });
    }

    async punchOut(employeeId, companyId, location = {}) {
        console.log('>>> DEBUG: punchOut called for emp:', employeeId);
        const entry = await db('attendance')
            .where({
                employee_id: employeeId,
                company_id: companyId,
                check_out: null
            })
            .orderBy('check_in', 'desc')
            .first();

        if (!entry) throw new Error('No active check-in found');

        const now = new Date();
        const checkIn = new Date(entry.check_in);
        const diffMs = now - checkIn;
        const workHours = (diffMs / (1000 * 60 * 60)).toFixed(2);

        return await db('attendance')
            .where({ id: entry.id })
            .update({
                check_out: db.fn.now(),
                out_latitude: location.latitude || null,
                out_longitude: location.longitude || null,
                out_accuracy: location.accuracy || null,
                out_punch_location: location.location || null,
                out_remarks: location.remarks || null
            });
    }

    async getHistory(employeeId, companyId, month, year) {
        return await db('attendance')
            .where({ employee_id: employeeId, company_id: companyId })
            .whereRaw('MONTH(check_in) = ?', [month])
            .whereRaw('YEAR(check_in) = ?', [year])
            .orderBy('check_in', 'desc');
    }

    async getCurrentStatus(employeeId, companyId) {
        const active = await db('attendance')
            .where({ employee_id: employeeId, company_id: companyId, check_out: null })
            .whereRaw('DATE(check_in) = CURRENT_DATE')
            .first();

        const completed = await db('attendance')
            .where({ employee_id: employeeId, company_id: companyId })
            .whereNotNull('check_out')
            .whereRaw('DATE(check_in) = CURRENT_DATE');

        let accrued_ms = 0;
        completed.forEach(record => {
            if (record.check_in && record.check_out) {
                const inTime = new Date(record.check_in);
                const outTime = new Date(record.check_out);
                accrued_ms += (outTime - inTime);
            }
        });

        return {
            check_in: active ? active.check_in : null,
            id: active ? active.id : null,
            accrued_ms
        };
    }

    async getCompanyMatrix(user, month, year) {
        let employeeQuery = db('employees').where({ 'employees.company_id': user.company_id });

        if (user.role_name === 'manager') {
            employeeQuery = employeeQuery.where({ 'employees.manager_id': user.employee_id });
        } else if (user.role_name === 'employee') {
            employeeQuery = employeeQuery.where({ 'employees.id': user.employee_id });
        }

        const employees = await employeeQuery
            .leftJoin('shifts', 'employees.shift_id', 'shifts.id')
            .leftJoin('attendance_schemes', 'employees.attendance_scheme_id', 'attendance_schemes.id')
            .leftJoin('departments', 'employees.department_id', 'departments.id')
            .select(
                'employees.id',
                'employees.first_name',
                'employees.last_name',
                'employees.designation',
                'employees.employee_id_number',
                'employees.office_location',
                'departments.name as department_name',
                'shifts.start_time as shift_start',
                'shifts.end_time as shift_end',
                'shifts.grace_period as shift_grace',
                'shifts.is_flexi as shift_is_flexi',
                'shifts.total_punches_required as shift_total_punches',
                'shifts.session2_start_time as shift_session2_start',
                'shifts.session2_end_time as shift_session2_end',
                'shifts.session1_grace_out as shift_session1_grace_out',
                'shifts.session2_grace_in as shift_session2_grace_in',
                'shifts.session2_grace_out as shift_session2_grace_out',
                'shifts.session1_in_margin as shift_session1_in_margin',
                'shifts.session1_out_margin as shift_session1_out_margin',
                'shifts.session2_in_margin as shift_session2_in_margin',
                'shifts.session2_out_margin as shift_session2_out_margin',
                'attendance_schemes.grace_period as scheme_grace',
                'attendance_schemes.weekoffs as scheme_weekoffs',
                'employees.joining_date',
                'employees.resignation_date'
            );
        const employeeIds = employees.map(e => e.id);

        // 2. Get attendance for these employees
        const attendance = await db('attendance')
            .whereIn('employee_id', employeeIds)
            .whereRaw('MONTH(check_in) = ? AND YEAR(check_in) = ?', [month, year])
            .select('employee_id', 'check_in', 'check_out', 'status', 'punch_source');

        // 3. Get leaves for these employees
        const leaves = await db('leaves as l')
            .join('leave_types as lt', 'l.leave_type_id', 'lt.id')
            .whereIn('l.employee_id', employeeIds)
            .where({ 'l.status': 'approved' })
            .whereRaw('(MONTH(l.start_date) = ? OR MONTH(l.end_date) = ?) AND (YEAR(l.start_date) = ? OR YEAR(l.end_date) = ?)', [month, month, year, year])
            .select('l.employee_id', 'l.start_date', 'l.end_date', 'l.leave_type_id', 'lt.name as leave_type_name');

        // 4. Get approved entry/exit requests for these employees (specifically early_out)
        const entryRequests = await db('attendance_entry_requests')
            .whereIn('employee_id', employeeIds)
            .where({ request_type: 'early_out', status: 'approved' })
            .whereRaw('MONTH(date) = ? AND YEAR(date) = ?', [month, year])
            .select('employee_id', 'date', 'request_type', 'status');

        // 5. Get approved regularizations for these employees
        const regularizations = await db('attendance_regularizations')
            .whereIn('employee_id', employeeIds)
            .where({ status: 'approved' })
            .whereRaw('MONTH(date) = ? AND YEAR(date) = ?', [month, year])
            .select('employee_id', 'date', 'status');

        return { employees, attendance, leaves, entryRequests, regularizations };
    }
}

module.exports = new AttendanceRepository();
