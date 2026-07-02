const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const db = require('../config/db');

// Helper to convert date to IST minutes, timezone safe
function dateToISTMins(dateVal) {
    if (!dateVal) return 0;
    const d = dbDateToUTC(dateVal);
    if (!d || isNaN(d.getTime())) return 0;
    const istDate = new Date(d.getTime() + (5.5 * 60 * 60 * 1000));
    const h = istDate.getUTCHours();
    const m = istDate.getUTCMinutes();
    return h * 60 + m;
}

function dbDateToUTC(dateVal) {
    if (!dateVal) return null;
    if (dateVal instanceof Date) {
        const yr = dateVal.getFullYear();
        const mo = String(dateVal.getMonth() + 1).padStart(2, '0');
        const dy = String(dateVal.getDate()).padStart(2, '0');
        const hr = String(dateVal.getHours()).padStart(2, '0');
        const mi = String(dateVal.getMinutes()).padStart(2, '0');
        const sc = String(dateVal.getSeconds()).padStart(2, '0');
        return new Date(`${yr}-${mo}-${dy}T${hr}:${mi}:${sc}+05:30`);
    }
    const str = String(dateVal).trim();
    const parts = str.split(/[- : T]/);
    if (parts.length >= 3) {
        const yr = parts[0];
        const mo = parts[1];
        const dy = parts[2];
        const hr = parts[3] || '00';
        const mi = parts[4] || '00';
        const sc = parts[5] || '00';
        return new Date(`${yr}-${mo}-${dy}T${hr}:${mi}:${sc}+05:30`);
    }
    const d = new Date(dateVal);
    return isNaN(d.getTime()) ? null : d;
}

async function fixCompany27() {
    const targetDate = process.argv[2] || new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Kolkata' });
    const companyId = 27;
    console.log(`=== Recalculating Attendance for Company ${companyId} on ${targetDate} ===\n`);

    try {
        // Fetch all employees of company 27
        const employees = await db('employees')
            .leftJoin('shifts', 'employees.shift_id', 'shifts.id')
            .leftJoin('attendance_schemes', 'employees.attendance_scheme_id', 'attendance_schemes.id')
            .where('employees.company_id', companyId)
            .select(
                'employees.*',
                'shifts.start_time as shift_start',
                'shifts.end_time as shift_end',
                'shifts.grace_period as shift_grace',
                'shifts.grace_count_limit as shift_grace_count_limit',
                'shifts.is_flexi as shift_is_flexi',
                'shifts.total_punches_required as shift_total_punches',
                'shifts.session1_in_margin as shift_in_margin',
                'shifts.session1_out_margin as shift_out_margin',
                'shifts.session2_start_time',
                'shifts.session2_end_time',
                'shifts.session2_in_margin',
                'shifts.session2_out_margin',
                'shifts.session1_grace_out',
                'shifts.session2_grace_in',
                'shifts.session2_grace_out',
                'shifts.terminate_hour',
                'attendance_schemes.grace_period as scheme_grace',
                'attendance_schemes.max_late_allowed'
            );

        console.log(`Found ${employees.length} employees for Company ${companyId}.\n`);

        const rules = await db('working_rules').where({ company_id: companyId }).first() || {
            shift_start: '09:00',
            grace_period: 15
        };

        let correctedCount = 0;

        for (const emp of employees) {
            // Find attendance record for target date
            const att = await db('attendance')
                .where({ employee_id: emp.id })
                .whereRaw('DATE(check_in) = ?', [targetDate])
                .first();

            if (!att) continue;

            const empName = `${emp.first_name || ''} ${emp.last_name || ''}`.trim() || `ID ${emp.id}`;

            // Resolve shift override for target date
            const activeAssignment = await db('employee_shift_assignments as esa')
                .join('shifts as s', 'esa.shift_id', 's.id')
                .where('esa.employee_id', emp.id)
                .where('esa.from_date', '<=', targetDate)
                .andWhere(qb => {
                    qb.where('esa.to_date', '>=', targetDate).orWhereNull('esa.to_date');
                })
                .select(
                    's.is_flexi',
                    's.min_hours',
                    's.start_time',
                    's.end_time',
                    's.grace_period as shift_grace',
                    's.total_punches_required as shift_total_punches',
                    's.session1_in_margin as shift_in_margin',
                    's.session1_out_margin as shift_out_margin',
                    's.session2_start_time',
                    's.session2_end_time',
                    's.session2_in_margin',
                    's.session2_out_margin',
                    's.session1_grace_out',
                    's.session2_grace_in',
                    's.session2_grace_out',
                    's.terminate_hour'
                )
                .orderBy('esa.id', 'desc')
                .first();

            if (activeAssignment) {
                emp.shift_is_flexi = activeAssignment.is_flexi;
                emp.min_hours = activeAssignment.min_hours;
                emp.shift_start = activeAssignment.start_time;
                emp.shift_end = activeAssignment.end_time;
                emp.shift_grace = activeAssignment.shift_grace;
                emp.shift_total_punches = activeAssignment.shift_total_punches;
                emp.shift_in_margin = activeAssignment.shift_in_margin;
                emp.shift_out_margin = activeAssignment.shift_out_margin;
                emp.session2_start_time = activeAssignment.session2_start_time;
                emp.session2_end_time = activeAssignment.session2_end_time;
                emp.session2_in_margin = activeAssignment.session2_in_margin;
                emp.session2_out_margin = activeAssignment.session2_out_margin;
                emp.session1_grace_out = activeAssignment.session1_grace_out;
                emp.session2_grace_in = activeAssignment.session2_grace_in;
                emp.session2_grace_out = activeAssignment.session2_grace_out;
                emp.terminate_hour = activeAssignment.terminate_hour;
            }

            const shiftStart = emp.shift_start || rules.shift_start || '09:00';
            const shiftEnd = emp.shift_end || rules.shift_end || '18:00';
            const grace = parseInt(emp.scheme_grace ?? emp.shift_grace ?? rules.grace_period ?? 15);
            const graceOut = parseInt(emp.session1_grace_out || 0);

            const [s1H, s1M] = shiftStart.split(':').map(Number);
            const [e1H, e1M] = shiftEnd.split(':').map(Number);
            const s1StartMins = s1H * 60 + s1M;
            const s1EndMins = e1H * 60 + e1M;

            const checkInMins = dateToISTMins(att.check_in);
            const isLate = checkInMins > (s1StartMins + grace);

            let newStatus = 'present';

            if (att.check_out) {
                const checkOutMins = dateToISTMins(att.check_out);
                const isEarly = checkOutMins < (s1EndMins - graceOut);
                
                if (isLate) newStatus = 'late';
                else if (isEarly) newStatus = 'early_out';
                else newStatus = 'present';
            } else {
                if (isLate) newStatus = 'pending';
                else newStatus = 'present';
            }

            // Update in DB if different
            const currentDbStatus = att.status ? att.status.toLowerCase() : '';
            if (currentDbStatus !== newStatus) {
                console.log(`[*] Correcting ${empName} (Code: ${emp.employee_id_number}):`);
                console.log(`    Punch In : ${att.check_in} (IST mins: ${checkInMins})`);
                console.log(`    Punch Out: ${att.check_out || 'None'}`);
                console.log(`    Status   : '${currentDbStatus}' -> '${newStatus}'`);

                await db('attendance')
                    .where({ id: att.id })
                    .update({
                        status: newStatus,
                        updated_at: db.fn.now()
                    });

                // Clean up pending requests if no longer late/early
                if (!isLate) {
                    const deletedLateReq = await db('attendance_entry_requests')
                        .where({ employee_id: emp.id, date: targetDate, request_type: 'late_in', status: 'pending' })
                        .delete();
                    if (deletedLateReq > 0) {
                        console.log(`    -> Deleted incorrect pending late_in request.`);
                    }
                }
                if (att.check_out) {
                    const checkOutMins = dateToISTMins(att.check_out);
                    const isEarly = checkOutMins < (s1EndMins - graceOut);
                    if (!isEarly) {
                        const deletedEarlyReq = await db('attendance_entry_requests')
                            .where({ employee_id: emp.id, date: targetDate, request_type: 'early_out', status: 'pending' })
                            .delete();
                        if (deletedEarlyReq > 0) {
                            console.log(`    -> Deleted incorrect pending early_out request.`);
                        }
                    }
                }

                correctedCount++;
                console.log('');
            }
        }

        console.log(`=== Recalculation Complete. Fixed ${correctedCount} records for ${targetDate}. ===`);
        process.exit(0);
    } catch (err) {
        console.error('Error during recalculation:', err);
        process.exit(1);
    }
}

fixCompany27();
