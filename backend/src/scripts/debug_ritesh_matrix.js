const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const db = require('../config/db');

// Same fixed helpers as attendanceService
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

async function debugRitesh() {
    const code = '963258';
    const dateStr = '2026-07-02';
    
    console.log(`\n=== Debugging Ritesh Patel matrix calculations for ${dateStr} ===\n`);

    const emp = await db('employees as e')
        .leftJoin('shifts as s', 'e.shift_id', 's.id')
        .leftJoin('attendance_schemes as asc', 'e.attendance_scheme_id', 'asc.id')
        .where('e.employee_id_number', code)
        .select('e.*', 's.start_time as shift_start', 's.end_time as shift_end', 's.grace_period as shift_grace', 'asc.grace_period as scheme_grace')
        .first();

    if (!emp) {
        console.log('Employee not found!');
        process.exit(0);
    }

    const rules = await db('working_rules').where({ company_id: emp.company_id }).first() || { grace_period: 15 };

    const assignment = await db('employee_shift_assignments as esa')
        .join('shifts as s', 'esa.shift_id', 's.id')
        .where('esa.employee_id', emp.id)
        .where('esa.from_date', '<=', dateStr)
        .andWhere(qb => {
            qb.where('esa.to_date', '>=', dateStr).orWhereNull('esa.to_date');
        })
        .select('s.*')
        .orderBy('esa.id', 'desc')
        .first();

    const resolvedShift = assignment || {
        name: emp.shift_name || 'General Shift',
        start_time: emp.shift_start || '09:00',
        end_time: emp.shift_end || '18:00',
        total_punches_required: emp.total_punches_required || 2,
        grace_period: emp.shift_grace || 15
    };

    console.log('Resolved Shift Details:');
    console.log(JSON.stringify(resolvedShift, null, 2));

    const atts = await db('attendance')
        .where({ employee_id: emp.id })
        .whereRaw('DATE(check_in) = ?', [dateStr])
        .orderBy('check_in', 'asc');

    console.log('\nAttendance records found:', atts.length);
    console.log(JSON.stringify(atts, null, 2));

    if (atts.length > 0) {
        const checkIn = atts[0].check_in;
        const inMins = dateToISTMins(checkIn);
        const s1Start = resolvedShift.start_time.split(':').map(Number)[0] * 60 + resolvedShift.start_time.split(':').map(Number)[1];
        const grace1In = parseInt(emp.scheme_grace ?? resolvedShift.grace_period ?? rules.grace_period ?? 15);
        
        console.log('\nGrace period calculation details:');
        console.log(`  check_in  : ${checkIn}`);
        console.log(`  inMins    : ${inMins}`);
        console.log(`  s1Start   : ${s1Start} (${resolvedShift.start_time})`);
        console.log(`  grace1In  : ${grace1In}`);
        console.log(`  Allowed   : ${s1Start + grace1In}`);
        
        const isGrace = inMins > s1Start && inMins <= (s1Start + grace1In);
        console.log(`  isGrace   : ${isGrace}`);
    }

    process.exit(0);
}

debugRitesh().catch(e => { console.error(e); process.exit(1); });
