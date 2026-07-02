const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const db = require('../config/db');

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

async function cleanupStaleRequests() {
    const companyId = 27;
    const targetDates = ['2026-07-01', '2026-07-02'];

    console.log(`\n=== Cleanup Stale Late-In/Early-Out Requests for Company ${companyId} ===\n`);

    let totalDeleted = 0;

    for (const targetDate of targetDates) {
        console.log(`--- Date: ${targetDate} ---`);

        // Get all pending late_in / early_out requests for company 27 on this date
        const requests = await db('attendance_entry_requests as r')
            .join('employees as e', 'r.employee_id', 'e.id')
            .leftJoin('shifts as s', 'e.shift_id', 's.id')
            .leftJoin('attendance_schemes as asc', 'e.attendance_scheme_id', 'asc.id')
            .where('r.company_id', companyId)
            .where('r.date', targetDate)
            .where('r.status', 'pending')
            .whereIn('r.request_type', ['late_in', 'early_out'])
            .select(
                'r.id as req_id', 'r.employee_id', 'r.request_type',
                'e.first_name', 'e.last_name', 'e.employee_id_number',
                's.start_time as shift_start', 's.end_time as shift_end',
                's.grace_period as shift_grace',
                'asc.grace_period as scheme_grace'
            );

        console.log(`  Found ${requests.length} pending requests.\n`);

        for (const req of requests) {
            // Check shift override
            const activeAssignment = await db('employee_shift_assignments as esa')
                .join('shifts as s', 'esa.shift_id', 's.id')
                .where('esa.employee_id', req.employee_id)
                .where('esa.from_date', '<=', targetDate)
                .andWhere(qb => {
                    qb.where('esa.to_date', '>=', targetDate).orWhereNull('esa.to_date');
                })
                .select('s.start_time', 's.end_time', 's.grace_period as shift_grace', 's.session1_grace_out')
                .orderBy('esa.id', 'desc')
                .first();

            const shiftStart = activeAssignment?.start_time || req.shift_start || '09:00';
            const shiftEnd   = activeAssignment?.end_time   || req.shift_end   || '18:00';
            const graceIn    = parseInt(req.scheme_grace ?? activeAssignment?.shift_grace ?? req.shift_grace ?? 15);
            const graceOut   = parseInt(activeAssignment?.session1_grace_out || 0);

            const [s1H, s1M] = shiftStart.split(':').map(Number);
            const [e1H, e1M] = shiftEnd.split(':').map(Number);
            const s1StartMins = s1H * 60 + s1M;
            const s1EndMins   = e1H * 60 + e1M;

            // Get actual attendance record
            const att = await db('attendance')
                .where({ employee_id: req.employee_id })
                .whereRaw('DATE(check_in) = ?', [targetDate])
                .first();

            if (!att) continue;

            const checkInMins  = dateToISTMins(att.check_in);
            const isActuallyLate = checkInMins > (s1StartMins + graceIn);

            const empName = `${req.first_name} ${req.last_name}`.trim();

            if (!isActuallyLate && req.request_type === 'late_in') {
                console.log(`  [DELETE] ${empName} (${req.employee_id_number}) late_in request`);
                console.log(`    Punch: ${att.check_in} → IST ${Math.floor(checkInMins/60)}:${String(checkInMins%60).padStart(2,'0')} | Shift: ${shiftStart} | Grace: ${graceIn} mins → Allowed until ${Math.floor((s1StartMins+graceIn)/60)}:${String((s1StartMins+graceIn)%60).padStart(2,'0')}`);
                await db('attendance_entry_requests').where({ id: req.req_id }).delete();
                totalDeleted++;
            } else if (req.request_type === 'early_out' && att.check_out) {
                const checkOutMins = dateToISTMins(att.check_out);
                const isActuallyEarlyOut = checkOutMins < (s1EndMins - graceOut);
                if (!isActuallyEarlyOut) {
                    console.log(`  [DELETE] ${empName} (${req.employee_id_number}) early_out request (not actually early)`);
                    await db('attendance_entry_requests').where({ id: req.req_id }).delete();
                    totalDeleted++;
                }
            } else {
                console.log(`  [KEEP]   ${empName} (${req.employee_id_number}) - genuinely ${req.request_type}`);
            }
        }
        console.log('');
    }

    console.log(`=== Cleanup Complete. Deleted ${totalDeleted} stale requests. ===\n`);
    process.exit(0);
}

cleanupStaleRequests().catch(e => { console.error(e); process.exit(1); });
