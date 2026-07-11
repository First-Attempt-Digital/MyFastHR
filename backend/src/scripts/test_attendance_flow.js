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

function simulate() {
    // Simulated employee with shift
    const employee = {
        is_flexi: false,
        shift_start: '10:00',
        shift_end: '15:30',
        shift_grace: 15,
        shift_total_punches: 2,
        shift_out_margin: 0,
        shift_terminate_hour: 4
    };

    console.log('Employee Flexi:', employee.is_flexi);
    console.log('Employee punches required:', employee.shift_total_punches);
    console.log('Employee Shift Start:', employee.shift_start);
    console.log('Employee Shift End:', employee.shift_end);

    const punches = [
        '2026-07-02 15:39:19',
        '2026-07-02 16:03:18',
        '2026-07-02 16:11:31'
    ];

    // Let's start with check_in record having check_in = 11:04:04 and status = 'late'
    // This represents the state in DB after Check-In synced and manager approved it at 11:24
    let currentRecord = {
        id: 9162,
        check_in: '2026-07-02 11:04:04',
        check_out: null,
        status: 'late' // simulated approved
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
            // Checkout Logic
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

            const halfDayLimit = employee.min_hours ? parseFloat(employee.min_hours)/2 : 2.75;

            let isEarly = punchTime < shiftEndDate;

            console.log(`workedHours: ${workedHours.toFixed(2)}, halfDayLimit: ${halfDayLimit}`);
            console.log(`isEarly: ${isEarly}, punchTime: ${punchTime.toISOString()}, shiftEndDate: ${shiftEndDate.toISOString()}`);

            // Update check_out
            currentRecord.check_out = punchTimeStr;

            // Calculate status
            let newStatus = activeLog.status || 'present';
            if (employee.is_flexi) {
                // flexi
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
}

simulate();
