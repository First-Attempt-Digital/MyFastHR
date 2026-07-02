const fs = require('fs');
const path = require('path');
const readline = require('readline');
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

function timeStrToMins(timeStr) {
    if (!timeStr) return 0;
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m;
}

function employeeCodeClean(code) {
    if (!code) return '';
    return String(code).trim().replace(/^0+/, '');
}

async function restore() {
    let logFile = path.join(__dirname, '../../biometric_machine_debug.log');
    if (!fs.existsSync(logFile)) {
        logFile = path.join(__dirname, '../../../biometric_machine_debug.log');
    }
    
    if (!fs.existsSync(logFile)) {
        console.error('Biometric machine debug log file not found at:', logFile);
        process.exit(1);
    }

    console.log('Streaming biometric log file line-by-line...');
    const fileStream = fs.createReadStream(logFile);
    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });

    // Group punches by employee + date
    const punchGroups = {}; // key: employeeCode_date, value: array of times (e.g. '18:03:00')

    let lineCount = 0;
    for await (const line of rl) {
        lineCount++;
        if (!line.trim()) continue;
        
        try {
            const bodyPart = line.split('Body:');
            if (bodyPart.length < 2) continue;
            
            const body = JSON.parse(bodyPart[1].trim());
            const employeeCode = employeeCodeClean(body.employeeID || body.employee_id || body.EnrollNumber || body.enrollNumber);
            const dateStr = body.date || body.Date;
            const timeStr = body.time || body.Time;

            if (!employeeCode || !dateStr || !timeStr) continue;

            const key = `${employeeCode}_${dateStr}`;
            if (!punchGroups[key]) {
                punchGroups[key] = new Set();
            }
            punchGroups[key].add(timeStr);
        } catch (e) {
            // ignore malformed lines
        }
    }

    console.log(`Processed ${lineCount} log lines. Grouped into ${Object.keys(punchGroups).length} employee-day combinations.`);

    let totalUpdated = 0;

    for (const [key, timeSet] of Object.entries(punchGroups)) {
        const [empCode, dateStr] = key.split('_');
        
        // Filter target dates: July 1st and July 2nd 2026
        if (dateStr !== '2026-07-01' && dateStr !== '2026-07-02') continue;

        const times = Array.from(timeSet).sort();
        const checkInTimeStr = `${dateStr} ${times[0]}`;
        const checkOutTimeStr = times.length > 1 ? `${dateStr} ${times[times.length - 1]}` : null;

        // Resolve Employee ID
        let employee = await db('employees as e')
            .leftJoin('shifts as s', 'e.shift_id', 's.id')
            .leftJoin('attendance_schemes as asc', 'e.attendance_scheme_id', 'asc.id')
            .where('e.employee_id_number', empCode)
            .select('e.*', 's.start_time as shift_start', 's.end_time as shift_end', 's.grace_period as shift_grace', 's.session1_grace_out', 'asc.grace_period as scheme_grace')
            .first();

        // Fallback check
        if (!employee && empCode.startsWith('0')) {
            const stripped = empCode.replace(/^0+/, '');
            employee = await db('employees as e')
                .leftJoin('shifts as s', 'e.shift_id', 's.id')
                .leftJoin('attendance_schemes as asc', 'e.attendance_scheme_id', 'asc.id')
                .where('e.employee_id_number', stripped)
                .select('e.*', 's.start_time as shift_start', 's.end_time as shift_end', 's.grace_period as shift_grace', 's.session1_grace_out', 'asc.grace_period as scheme_grace')
                .first();
        }

        if (!employee) continue;

        // Find existing attendance log
        const att = await db('attendance')
            .where({ employee_id: employee.id })
            .whereRaw('DATE(check_in) = ?', [dateStr])
            .first();

        if (!att) continue;

        // Calculate actual status based on correct times
        const rules = await db('working_rules').where({ company_id: employee.company_id }).first() || { grace_period: 15 };
        const shiftStart = employee.shift_start || '09:00';
        const shiftEnd = employee.shift_end || '18:00';
        const graceIn = parseInt(employee.scheme_grace ?? employee.shift_grace ?? rules.grace_period ?? 15);
        const graceOut = parseInt(employee.session1_grace_out || 0);

        const s1StartMins = timeStrToMins(shiftStart);
        const s1EndMins = timeStrToMins(shiftEnd);

        const checkInMins = timeStrToMins(times[0]);
        const isLate = checkInMins > (s1StartMins + graceIn);

        let newStatus;
        if (checkOutTimeStr) {
            const checkOutMins = timeStrToMins(times[times.length - 1]);
            const isEarlyOut = checkOutMins < (s1EndMins - graceOut);
            if (isLate) newStatus = 'late';
            else if (isEarlyOut) newStatus = 'early_out';
            else newStatus = 'present';
        } else {
            if (isLate) newStatus = 'pending';
            else newStatus = 'present';
        }

        console.log(`[RESTORING] ${employee.first_name} ${employee.last_name} (${empCode}) for ${dateStr}:`);
        console.log(`  Old Check-In : ${att.check_in} | New Check-In : ${checkInTimeStr}`);
        console.log(`  Old Check-Out: ${att.check_out} | New Check-Out: ${checkOutTimeStr}`);
        console.log(`  Old Status   : ${att.status} | New Status   : ${newStatus}`);

        // Update the record with correct times and status
        await db('attendance')
            .where({ id: att.id })
            .update({
                check_in: checkInTimeStr,
                check_out: checkOutTimeStr,
                status: newStatus,
                updated_at: db.fn.now()
            });

        // Delete stale late_in/early_out requests
        if (newStatus === 'present' || newStatus === 'early_out') {
            const deleted = await db('attendance_entry_requests')
                .where({ employee_id: employee.id, date: dateStr, status: 'pending' })
                .whereIn('request_type', ['late_in', 'early_out'])
                .delete();
            if (deleted > 0) {
                console.log(`  Cleaned up ${deleted} stale request(s).`);
            }
        }
        totalUpdated++;
    }

    console.log(`\n=== Successfully restored ${totalUpdated} employee attendance records from raw logs! ===\n`);
    process.exit(0);
}

restore().catch(e => {
    console.error('Restore failed:', e);
    process.exit(1);
});
