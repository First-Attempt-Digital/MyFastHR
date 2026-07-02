const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const db = require('../config/db');

function dateToISTDateString(dateVal) {
    const d = new Date(dateVal);
    const yr = d.toLocaleDateString('en-US', { timeZone: 'Asia/Kolkata', year: 'numeric' });
    const mo = d.toLocaleDateString('en-US', { timeZone: 'Asia/Kolkata', month: '2-digit' });
    const dy = d.toLocaleDateString('en-US', { timeZone: 'Asia/Kolkata', day: '2-digit' });
    return `${yr}-${mo}-${dy}`;
}

function dbDateToUTC(dateVal) {
    if (!dateVal) return null;
    if (dateVal instanceof Date) return dateVal;
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
    const d = new Date(dateVal);
    const hrStr = d.toLocaleTimeString('en-US', { timeZone: 'Asia/Kolkata', hour: '2-digit', hour12: false });
    const miStr = d.toLocaleTimeString('en-US', { timeZone: 'Asia/Kolkata', minute: '2-digit', hour12: false });
    return parseInt(hrStr, 10) * 60 + parseInt(miStr, 10);
}

async function simulate() {
    const code = '2011314';
    const employee = await db('employees')
        .leftJoin('shifts', 'employees.shift_id', 'shifts.id')
        .leftJoin('attendance_schemes', 'employees.attendance_scheme_id', 'attendance_schemes.id')
        .where('employees.employee_id_number', code)
        .select(
            'employees.*',
            'shifts.start_time as shift_start',
            'shifts.end_time as shift_end',
            'shifts.grace_period as shift_grace',
            'shifts.total_punches_required as shift_total_punches',
            'shifts.session1_in_margin as shift_in_margin',
            'shifts.session1_out_margin as shift_out_margin',
            'shifts.terminate_hour as shift_terminate_hour',
            'attendance_schemes.grace_period as scheme_grace',
            'attendance_schemes.max_late_allowed',
            'attendance_schemes.half_day_hours as scheme_half_day_hours'
        )
        .first();

    if (!employee) {
        console.log('Employee not found!');
        process.exit(1);
    }

    const rules = await db('working_rules').where({ company_id: employee.company_id }).first() || {};

    console.log('Employee Info:');
    console.log('  Flexi:', employee.is_flexi);
    console.log('  Punches Required:', employee.shift_total_punches);
    console.log('  Shift Start:', employee.shift_start);
    console.log('  Shift End:', employee.shift_end);
    console.log('  Min Hours:', employee.min_hours);
    console.log('  Scheme Half Day Hours:', employee.scheme_half_day_hours);
    console.log('  Rules Half Day Hours:', rules.half_day_hours);

    const punches = [
        '2026-07-02 15:39:19',
        '2026-07-02 16:03:18',
        '2026-07-02 16:11:31'
    ];

    // Let's start with check_in record having check_in = 11:04:04 and status = 'late'
    let currentRecord = {
        id: 9162,
        check_in: '2026-07-02 11:04:04',
        check_out: null,
        status: 'late'
    };

    console.log('\n--- Simulation Start ---');

    for (const punchTimeStr of punches) {
        console.log(`\nProcessing Punch: ${punchTimeStr}`);
        const punchTime = new Date(punchTimeStr + ' +05:30');

        let activeLog = null;
        const latestLog = { ...currentRecord };

        if (latestLog && latestLog.check_out === null) {
            activeLog = latestLog;
        }

        const reqPunches = parseInt(employee.shift_total_punches || 2);
        if (!activeLog && reqPunches !== 4) {
            activeLog = latestLog;
        }

        console.log('Resolved activeLog:', activeLog ? `ID: ${activeLog.id}, check_out: ${activeLog.check_out}, status: ${activeLog.status}` : 'null');

        if (activeLog) {
            const checkIn = dbDateToUTC(activeLog.check_in);
            const checkInMins = dateToISTMins(checkIn);
            const punchMins = dateToISTMins(punchTime);
            let workedMins = punchMins - checkInMins;
            if (workedMins < 0) workedMins += 24 * 60;
            const workedHours = workedMins / 60;

            const shiftStart = employee.shift_start || '09:00';
            const shiftEnd = employee.shift_end || '18:00';
            const outMargin = employee.shift_out_margin !== undefined ? parseInt(employee.shift_out_margin) : 0;

            const checkInDateStr = dateToISTDateString(checkIn);
            const [sHours, sMins] = shiftStart.split(':').map(Number);
            const [eHours, eMins] = shiftEnd.split(':').map(Number);
            const shiftStartDate = new Date(`${checkInDateStr} ${String(sHours).padStart(2, '0')}:${String(sMins).padStart(2, '0')}:00 +05:30`);
            let shiftEndDate = new Date(`${checkInDateStr} ${String(eHours).padStart(2, '0')}:${String(eMins).padStart(2, '0')}:00 +05:30`);
            if (shiftEndDate < shiftStartDate) {
                shiftEndDate = new Date(shiftEndDate.getTime() + 24 * 60 * 60 * 1000);
            }
            const outMarginThreshold = new Date(shiftEndDate.getTime() - outMargin * 60 * 1000);

            // Determine half day hours limit
            let halfDayLimit = 4;
            if (reqPunches === 4) {
                let diffMins = (eHours * 60 + eMins) - (sHours * 60 + sMins);
                if (diffMins < 0) diffMins += 24 * 60;
                halfDayLimit = (diffMins / 60) / 2;
            } else {
                halfDayLimit = employee?.min_hours !== undefined && employee?.min_hours !== null
                    ? parseFloat(employee.min_hours) / 2
                    : (employee?.scheme_half_day_hours !== undefined && employee?.scheme_half_day_hours !== null
                        ? parseFloat(employee.scheme_half_day_hours)
                        : parseFloat(rules.half_day_hours || 4));
            }

            let isEarly = punchTime < shiftEndDate;

            console.log(`workedHours: ${workedHours.toFixed(2)}, halfDayLimit: ${halfDayLimit}`);
            console.log(`isEarly: ${isEarly}, punchTime: ${punchTime.toISOString()}, shiftEndDate: ${shiftEndDate.toISOString()}`);

            currentRecord.check_out = punchTimeStr;

            let newStatus = activeLog.status || 'present';
            if (employee.is_flexi) {
                const minHours = parseFloat(employee.min_hours) || 8;
                if (workedHours < halfDayLimit) {
                    newStatus = 'absent';
                } else if (workedHours < minHours) {
                    newStatus = 'half-day';
                } else {
                    newStatus = 'present';
                }
            } else {
                if (outMarginThreshold && shiftEndDate && punchTime >= outMarginThreshold && punchTime < shiftEndDate) {
                    newStatus = 'early_out';
                } else if (workedHours < halfDayLimit) {
                    newStatus = 'absent';
                } else if (isEarly) {
                    newStatus = 'early_out';
                } else if (newStatus !== 'pending') {
                    newStatus = 'present';
                }
            }

            console.log(`Calculated newStatus: ${newStatus}`);
            currentRecord.status = newStatus;
        }
    }

    process.exit(0);
}

simulate().catch(console.error);
