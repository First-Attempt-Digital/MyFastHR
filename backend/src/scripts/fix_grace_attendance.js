const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const db = require('../config/db');

function dbDateToUTC(dateVal) {
    if (!dateVal) return null;
    let d = new Date(dateVal);
    if (isNaN(d.getTime())) {
        const str = String(dateVal).trim();
        const parts = str.split(/[- : T]/);
        if (parts.length >= 5) {
            const yr = parseInt(parts[0]);
            const mo = parseInt(parts[1]) - 1;
            const dy = parseInt(parts[2]);
            const hr = parseInt(parts[3]);
            const mi = parseInt(parts[4]);
            const sc = parts[5] ? parseInt(parts[5]) : 0;
            return new Date(Date.UTC(yr, mo, dy, hr, mi, sc));
        }
        return null;
    }
    return new Date(Date.UTC(
        d.getFullYear(),
        d.getMonth(),
        d.getDate(),
        d.getHours(),
        d.getMinutes(),
        d.getSeconds()
    ));
}

function dateToISTMins(dateVal) {
    if (!dateVal) return 0;
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return 0;
    const options = { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: false };
    const istStr = d.toLocaleTimeString('en-GB', options);
    const [h, m] = istStr.split(':').map(Number);
    return h * 60 + m;
}

async function fixGraceAttendance() {
    const targetDate = process.argv[2] || new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Kolkata' });
    console.log(`=== Attendance Grace Correction Tool ===`);
    console.log(`Target Date: ${targetDate}\n`);

    try {
        const requests = await db('attendance_entry_requests')
            .where({
                request_type: 'late_in',
                status: 'pending',
                date: targetDate
            });

        console.log(`Found ${requests.length} pending late_in requests for ${targetDate}.\n`);

        let fixedCount = 0;
        for (const req of requests) {
            const empId = req.employee_id;
            const companyId = req.company_id;

            const employee = await db('employees')
                .leftJoin('shifts', 'employees.shift_id', 'shifts.id')
                .leftJoin('attendance_schemes', 'employees.attendance_scheme_id', 'attendance_schemes.id')
                .where('employees.id', empId)
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
                )
                .first();

            if (!employee) {
                console.log(`[!] Request ID ${req.id}: Employee ID ${empId} not found in database. Skipping.`);
                continue;
            }

            // Resolve shift override assignment if any
            const activeAssignment = await db('employee_shift_assignments as esa')
                .join('shifts as s', 'esa.shift_id', 's.id')
                .where('esa.employee_id', empId)
                .where('esa.from_date', '<=', targetDate)
                .andWhere(function () {
                    this.where('esa.to_date', '>=', targetDate).orWhereNull('esa.to_date');
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
                employee.shift_is_flexi = activeAssignment.is_flexi;
                employee.min_hours = activeAssignment.min_hours;
                employee.shift_start = activeAssignment.start_time;
                employee.shift_end = activeAssignment.end_time;
                employee.shift_grace = activeAssignment.shift_grace;
                employee.shift_total_punches = activeAssignment.shift_total_punches;
                employee.shift_in_margin = activeAssignment.shift_in_margin;
                employee.shift_out_margin = activeAssignment.shift_out_margin;
                employee.session2_start_time = activeAssignment.session2_start_time;
                employee.session2_end_time = activeAssignment.session2_end_time;
                employee.session2_in_margin = activeAssignment.session2_in_margin;
                employee.session2_out_margin = activeAssignment.session2_out_margin;
                employee.session1_grace_out = activeAssignment.session1_grace_out;
                employee.session2_grace_in = activeAssignment.session2_grace_in;
                employee.session2_grace_out = activeAssignment.session2_grace_out;
                employee.terminate_hour = activeAssignment.terminate_hour;
            }

            const origShiftStart = employee.shift_start || '09:00';
            const rules = await db('working_rules').where({ company_id: companyId }).first() || {
                shift_start: '09:00',
                grace_period: 15
            };

            const s1StartStr = origShiftStart;
            const [s1H, s1M] = s1StartStr.split(':').map(Number);
            const s1StartMinsVal = s1H * 60 + s1M;
            const s1Grace = parseInt(employee.scheme_grace ?? employee.shift_grace ?? rules.grace_period ?? 15);
            const s1AllowedMins = s1StartMinsVal + s1Grace;

            const punchTime = req.punch_time;
            if (!punchTime) {
                console.log(`[!] Request ID ${req.id} (Employee: ${employee.first_name} ${employee.last_name}): No punch_time field. Skipping.`);
                continue;
            }

            const checkInMins = dateToISTMins(punchTime);
            const isWithinGrace = checkInMins > s1StartMinsVal && checkInMins <= s1AllowedMins;

            const empName = `${employee.first_name || ''} ${employee.last_name || ''}`.trim() || `ID ${empId}`;

            if (isWithinGrace) {
                console.log(`[*] Correcting ${empName} (Code: ${employee.employee_id_number || 'N/A'}):`);
                console.log(`    Punch Time:  ${punchTime} (${checkInMins} mins)`);
                console.log(`    Shift Start: ${s1StartStr} (${s1StartMinsVal} mins)`);
                console.log(`    Grace Limit: ${s1Grace} mins (Allowed until ${s1AllowedMins} mins)`);

                // 1. Update request status to 'approved'
                await db('attendance_entry_requests')
                    .where({ id: req.id })
                    .update({
                        status: 'approved',
                        updated_at: db.fn.now()
                    });
                console.log(`    -> Approved entry request ID ${req.id}`);

                // 2. Insert/Update attendance record
                const existingAtt = await db('attendance')
                    .where({ employee_id: empId })
                    .whereRaw('DATE(check_in) = ?', [targetDate])
                    .first();

                if (!existingAtt) {
                    await db('attendance').insert({
                        employee_id: empId,
                        company_id: companyId,
                        check_in: punchTime,
                        check_out: null,
                        status: 'present',
                        punch_source: 'entry_request',
                        created_at: db.fn.now()
                    });
                    console.log(`    -> Created new attendance record as 'present'`);
                } else {
                    await db('attendance')
                        .where({ id: existingAtt.id })
                        .update({
                            status: 'present',
                            punch_source: 'entry_request',
                            updated_at: db.fn.now()
                        });
                    console.log(`    -> Updated existing attendance record ID ${existingAtt.id} status to 'present'`);
                }
                fixedCount++;
            } else {
                console.log(`[ ] Skipping ${empName} - punch time ${punchTime} is outside grace period (Starts ${s1StartStr}, limit ${s1Grace} mins).`);
            }
            console.log('');
        }

        console.log(`=== Done! Corrected ${fixedCount} records for ${targetDate}. ===`);
        process.exit(0);
    } catch (err) {
        console.error('Error during grace correction process:', err);
        process.exit(1);
    }
}

fixGraceAttendance();
