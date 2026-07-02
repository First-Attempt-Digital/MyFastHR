const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const db = require('../config/db');

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

function dateToISTMins(dateVal) {
    if (!dateVal) return 0;
    const d = dbDateToUTC(dateVal);
    if (!d || isNaN(d.getTime())) return 0;
    const options = { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: false };
    const istStr = d.toLocaleTimeString('en-GB', options);
    const [h, m] = istStr.split(':').map(Number);
    return h * 60 + m;
}

async function debugRitesh() {
    console.log('=== DEBUGGING GRACE FOR RITESH PATEL ===\n');
    try {
        // 1. Fetch employee row
        const emp = await db('employees as e')
            .leftJoin('shifts as s', 'e.shift_id', 's.id')
            .leftJoin('attendance_schemes as asch', 'e.attendance_scheme_id', 'asch.id')
            .where('e.first_name', 'like', '%Ritesh%')
            .select(
                'e.id',
                'e.first_name',
                'e.last_name',
                'e.shift_id',
                'e.attendance_scheme_id',
                's.name as shift_name',
                's.start_time as shift_start',
                's.end_time as shift_end',
                's.grace_period as shift_grace',
                'asch.name as scheme_name',
                'asch.grace_period as scheme_grace'
            )
            .first();

        if (!emp) {
            console.log('Employee Ritesh Patel not found!');
            return;
        }

        console.log('Employee Row in DB:');
        console.log(JSON.stringify(emp, null, 4));
        console.log('');

        // 2. Fetch today's logs
        const targetDate = '2026-06-19';
        const logs = await db('attendance')
            .where({ employee_id: emp.id })
            .whereRaw('DATE(check_in) = ?', [targetDate]);

        console.log(`Attendance logs on ${targetDate}:`);
        console.log(JSON.stringify(logs, null, 4));
        console.log('');

        if (logs.length === 0) {
            console.log('No attendance logs found for today.');
            return;
        }

        // 3. Step-by-step Trace
        const rules = await db('working_rules').where({ company_id: logs[0].company_id }).first() || {
            shift_start: '09:00',
            grace_period: 15
        };
        console.log('Working Rules Fallback:', rules);
        console.log('');

        const firstLog = logs[0];
        const s1StartStr = emp.shift_start || '09:00';
        const [s1H, s1M] = s1StartStr.split(':').map(Number);
        const s1Start = s1H * 60 + s1M;

        const grace1In = parseInt(emp.scheme_grace ?? emp.shift_grace ?? rules.grace_period ?? 15);
        const inMins = dateToISTMins(firstLog.check_in);
        const isWithinGrace = inMins > s1Start && inMins <= (s1Start + grace1In);

        console.log('=== Backend Grace Check Variables ===');
        console.log(`Check-In Timestamp:  "${firstLog.check_in}"`);
        console.log(`Parsed Check-in Mins: ${inMins} (${Math.floor(inMins/60)}:${String(inMins%60).padStart(2, '0')})`);
        console.log(`Shift Start Time:    "${s1StartStr}" (${s1Start} mins)`);
        console.log(`Grace Period Chosen: ${grace1In} mins (Priority: Scheme [${emp.scheme_grace}] ?? Shift [${emp.shift_grace}] ?? Rules [${rules.grace_period}] ?? 15)`);
        console.log(`Grace Allowed Limit:  ${s1Start + grace1In} mins (${Math.floor((s1Start + grace1In)/60)}:${String((s1Start + grace1In)%60).padStart(2, '0')})`);
        console.log(`Is Within Grace?      ${isWithinGrace}`);
        console.log(`Cell Status:          "${firstLog.status}"`);

    } catch (err) {
        console.error('Error during debug execution:', err);
    } finally {
        await db.destroy();
    }
}

debugRitesh();
