const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const db = require('../config/db');

// Same fixed helpers
function dbDateToUTC(dateVal) {
    if (!dateVal) return null;
    if (dateVal instanceof Date) {
        const yr = dateVal.getFullYear(), mo = String(dateVal.getMonth()+1).padStart(2,'0');
        const dy = String(dateVal.getDate()).padStart(2,'0'), hr = String(dateVal.getHours()).padStart(2,'0');
        const mi = String(dateVal.getMinutes()).padStart(2,'0'), sc = String(dateVal.getSeconds()).padStart(2,'0');
        return new Date(`${yr}-${mo}-${dy}T${hr}:${mi}:${sc}+05:30`);
    }
    const str = String(dateVal).trim();
    const parts = str.split(/[- :T]/);
    if (parts.length >= 3) {
        return new Date(`${parts[0]}-${parts[1]}-${parts[2]}T${parts[3]||'00'}:${parts[4]||'00'}:${parts[5]||'00'}+05:30`);
    }
    const d = new Date(dateVal); return isNaN(d.getTime()) ? null : d;
}
function dateToISTMins(v) {
    const d = dbDateToUTC(v); if (!d) return 0;
    const ist = new Date(d.getTime() + 5.5*60*60*1000);
    return ist.getUTCHours()*60 + ist.getUTCMinutes();
}

async function checkMusterLogic() {
    const targetDate = '2026-07-01';
    const companyId = 27;
    const targetCodes = ['10010','10019','10033','10012']; // Surendra, Narsi, Dinesh, Sachin
    
    console.log(`\n=== Muster Logic Simulation for ${targetDate} ===\n`);

    // Load working rules
    const rules = await db('working_rules').where({ company_id: companyId }).first() || { grace_period: 15 };
    console.log(`Working Rules grace_period: ${rules.grace_period}`);
    console.log('');

    for (const code of targetCodes) {
        const emp = await db('employees as e')
            .leftJoin('shifts as s', 'e.shift_id', 's.id')
            .leftJoin('attendance_schemes as asc', 'e.attendance_scheme_id', 'asc.id')
            .where('e.employee_id_number', code)
            .select(
                'e.*',
                's.start_time as shift_start', 's.end_time as shift_end',
                's.grace_period as shift_grace',
                'asc.grace_period as scheme_grace'
            ).first();

        if (!emp) { console.log(`[${code}] NOT FOUND\n`); continue; }

        // Get shift ASSIGNMENT for this date
        const assignment = await db('employee_shift_assignments as esa')
            .join('shifts as s', 'esa.shift_id', 's.id')
            .where('esa.employee_id', emp.id)
            .where('esa.from_date', '<=', targetDate)
            .andWhere(qb => { qb.where('esa.to_date', '>=', targetDate).orWhereNull('esa.to_date'); })
            .select('s.start_time', 's.end_time', 's.grace_period', 's.grace_count_limit')
            .orderBy('esa.id', 'desc').first();

        // Same resolvedShift logic as muster
        const resolvedShift = {
            start_time: assignment ? assignment.start_time : emp.shift_start,
            end_time:   assignment ? assignment.end_time   : emp.shift_end,
            grace_period: assignment ? assignment.grace_period : emp.shift_grace,
        };

        // Grace in calculateSplitShiftStatus (uses ||)
        const grace_calcShift = parseInt(resolvedShift.grace_period || emp.shift_grace || rules.grace_period || 15);
        // Grace in muster isGrace meta (uses ??)
        const grace_meta = parseInt(emp.scheme_grace ?? resolvedShift.grace_period ?? rules.grace_period ?? 15);

        // Get attendance record
        const att = await db('attendance')
            .where({ employee_id: emp.id })
            .whereRaw('DATE(check_in) = ?', [targetDate])
            .first();

        console.log(`[${code}] ${emp.first_name} ${emp.last_name}`);
        console.log(`  DEFAULT shift  : ${emp.shift_start} - ${emp.shift_end} | shift_grace: ${emp.shift_grace}`);
        console.log(`  ASSIGNED shift : ${assignment ? `${assignment.start_time} - ${assignment.end_time} | grace: ${assignment.grace_period}` : 'NONE'}`);
        console.log(`  scheme_grace   : ${emp.scheme_grace}`);
        console.log(`  resolvedShift.grace_period: ${resolvedShift.grace_period}`);
        console.log(`  grace for STATUS calc (||): ${grace_calcShift}`);
        console.log(`  grace for META dot  (??): ${grace_meta}`);

        if (att) {
            const inMins = dateToISTMins(att.check_in);
            const s1Start = (() => { const [h,m]=(resolvedShift.start_time||'09:00').split(':').map(Number); return h*60+m; })();
            const isLate = inMins > (s1Start + grace_calcShift);
            const isGrace_meta = inMins > s1Start && inMins <= (s1Start + grace_meta);
            console.log(`  check_in: ${att.check_in} → IST ${Math.floor(inMins/60)}:${String(inMins%60).padStart(2,'0')} (${inMins}m) | DB status: ${att.status}`);
            console.log(`  s1Start=${s1Start} | isLate(calc)=${isLate} → STATUS=${isLate?'L':'P'} | isGrace(meta)=${isGrace_meta}`);
        } else {
            console.log(`  No attendance record for ${targetDate}`);
        }
        console.log('');
    }
    process.exit(0);
}

checkMusterLogic().catch(e => { console.error(e); process.exit(1); });
