const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const db = require('../config/db');

// ─── Timezone-safe date helpers (same as fixed attendanceService.js) ─────────

function dbDateToUTC(dateVal) {
    if (!dateVal) return null;
    if (dateVal instanceof Date) {
        const yr = dateVal.toLocaleDateString('en-US', { timeZone: 'Asia/Kolkata', year: 'numeric' });
        const mo = dateVal.toLocaleDateString('en-US', { timeZone: 'Asia/Kolkata', month: '2-digit' });
        const dy = dateVal.toLocaleDateString('en-US', { timeZone: 'Asia/Kolkata', day: '2-digit' });
        const timeParts = dateVal.toLocaleTimeString('en-US', { timeZone: 'Asia/Kolkata', hour12: false }).split(':');
        const hr = timeParts[0].padStart(2, '0');
        const mi = timeParts[1].padStart(2, '0');
        const sc = timeParts[2].padStart(2, '0');
        const hrClean = hr === '24' ? '00' : hr;
        return new Date(`${yr}-${mo}-${dy}T${hrClean}:${mi}:${sc}+05:30`);
    }
    const str = String(dateVal).trim();
    const parts = str.split(/[- : T]/);
    if (parts.length >= 3) {
        const yr = parts[0]; const mo = parts[1]; const dy = parts[2];
        const hr = parts[3] || '00'; const mi = parts[4] || '00'; const sc = parts[5] || '00';
        return new Date(`${yr}-${mo}-${dy}T${hr}:${mi}:${sc}+05:30`);
    }
    const d = new Date(dateVal);
    return isNaN(d.getTime()) ? null : d;
}

function dateToISTMins(dateVal) {
    if (!dateVal) return 0;
    const d = dbDateToUTC(dateVal);
    if (!d || isNaN(d.getTime())) return 0;
    const istDate = new Date(d.getTime() + (5.5 * 60 * 60 * 1000));
    return istDate.getUTCHours() * 60 + istDate.getUTCMinutes();
}

function timeStrToMins(timeStr) {
    if (!timeStr) return 0;
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m;
}

// ─── Main Correction Function ─────────────────────────────────────────────────

async function fixCompany27() {
    const targetDate = process.argv[2] || new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Kolkata' });
    const companyId = 27;
    console.log(`\n=== Attendance Recalculation for Company ${companyId} | Date: ${targetDate} ===\n`);

    try {
        // Fetch all employees of company 27 with their default shift info
        const employees = await db('employees')
            .leftJoin('shifts', 'employees.shift_id', 'shifts.id')
            .leftJoin('attendance_schemes', 'employees.attendance_scheme_id', 'attendance_schemes.id')
            .where('employees.company_id', companyId)
            .select(
                'employees.*',
                'shifts.start_time as shift_start',
                'shifts.end_time as shift_end',
                'shifts.grace_period as shift_grace',
                'shifts.session1_grace_out',
                'shifts.is_flexi as shift_is_flexi',
                'shifts.total_punches_required as shift_total_punches',
                'shifts.session1_in_margin as shift_in_margin',
                'shifts.session1_out_margin as shift_out_margin',
                'shifts.session2_start_time',
                'shifts.session2_end_time',
                'shifts.session2_in_margin',
                'shifts.session2_out_margin',
                'shifts.session2_grace_in',
                'shifts.session2_grace_out',
                'shifts.terminate_hour',
                'attendance_schemes.grace_period as scheme_grace'
            );

        console.log(`Found ${employees.length} employees.\n`);

        const rules = await db('working_rules').where({ company_id: companyId }).first() || {
            shift_start: '09:00', grace_period: 15
        };

        let correctedCount = 0;
        let skippedCount = 0;

        for (const emp of employees) {
            // Resolve shift assignment override for this specific date
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
                emp.shift_is_flexi   = activeAssignment.is_flexi;
                emp.min_hours        = activeAssignment.min_hours;
                emp.shift_start      = activeAssignment.start_time;
                emp.shift_end        = activeAssignment.end_time;
                emp.shift_grace      = activeAssignment.shift_grace;
                emp.shift_total_punches = activeAssignment.shift_total_punches;
                emp.shift_in_margin  = activeAssignment.shift_in_margin;
                emp.shift_out_margin = activeAssignment.shift_out_margin;
                emp.session2_start_time = activeAssignment.session2_start_time;
                emp.session2_end_time   = activeAssignment.session2_end_time;
                emp.session2_in_margin  = activeAssignment.session2_in_margin;
                emp.session2_out_margin = activeAssignment.session2_out_margin;
                emp.session1_grace_out  = activeAssignment.session1_grace_out;
                emp.session2_grace_in   = activeAssignment.session2_grace_in;
                emp.session2_grace_out  = activeAssignment.session2_grace_out;
                emp.terminate_hour      = activeAssignment.terminate_hour;
            }

            // Find attendance record for target date
            const att = await db('attendance')
                .where({ employee_id: emp.id })
                .whereRaw('DATE(check_in) = ?', [targetDate])
                .orderBy('id', 'asc')
                .first();

            if (!att) { skippedCount++; continue; }

            // Skip manual overrides - these should not be auto-corrected
            if (att.punch_source === 'manual' || att.punch_source === 'manual_override') {
                skippedCount++;
                continue;
            }

            const shiftStart  = emp.shift_start || rules.shift_start || '09:00';
            const shiftEnd    = emp.shift_end   || '18:00';
            const graceIn     = parseInt(emp.scheme_grace ?? emp.shift_grace ?? rules.grace_period ?? 15);
            const graceOut    = parseInt(emp.session1_grace_out || 0);

            const s1StartMins = timeStrToMins(shiftStart);
            const s1EndMins   = timeStrToMins(shiftEnd);

            const checkInMins = dateToISTMins(att.check_in);
            const isLate      = checkInMins > (s1StartMins + graceIn);

            let newStatus;
            if (att.check_out) {
                const checkOutMins = dateToISTMins(att.check_out);
                const isEarlyOut = checkOutMins < (s1EndMins - graceOut);
                if (isLate)         newStatus = 'late';
                else if (isEarlyOut) newStatus = 'early_out';
                else                 newStatus = 'present';
            } else {
                // No checkout yet - if not late, mark present (CI active)
                if (isLate) newStatus = 'pending'; // still needs approval
                else        newStatus = 'present';
            }

            const currentDbStatus = (att.status || '').toLowerCase();
            const empName = `${emp.first_name || ''} ${emp.last_name || ''}`.trim() || `ID ${emp.id}`;

            if (currentDbStatus !== newStatus) {
                console.log(`[FIXING] ${empName} (Code: ${emp.employee_id_number || emp.id})`);
                console.log(`  Shift   : ${shiftStart} - ${shiftEnd} | Grace: ${graceIn} mins`);
                console.log(`  PunchIn : ${att.check_in} => IST mins: ${checkInMins} | Allowed until: ${s1StartMins + graceIn} mins (${Math.floor((s1StartMins + graceIn)/60)}:${String((s1StartMins + graceIn)%60).padStart(2,'0')})`);
                console.log(`  Status  : '${currentDbStatus}' => '${newStatus}'`);

                await db('attendance')
                    .where({ id: att.id })
                    .update({ status: newStatus, updated_at: db.fn.now() });

                // If corrected from late/pending to present → delete stale pending requests
                if (newStatus === 'present' || newStatus === 'early_out') {
                    const deleted = await db('attendance_entry_requests')
                        .where({ employee_id: emp.id, date: targetDate, status: 'pending' })
                        .whereIn('request_type', ['late_in', 'early_out'])
                        .delete();
                    if (deleted > 0) {
                        console.log(`  Cleanup : Deleted ${deleted} stale pending request(s).`);
                    }
                }

                correctedCount++;
                console.log('');
            }
        }

        console.log(`=== Done! Corrected: ${correctedCount} | Skipped (no punch / manual): ${skippedCount} ===\n`);
        process.exit(0);
    } catch (err) {
        console.error('Error during recalculation:', err);
        process.exit(1);
    }
}

fixCompany27();
