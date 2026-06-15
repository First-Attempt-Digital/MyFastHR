const db = require('../config/db');
const crypto = require('crypto');

/**
 * Normalizes a database datetime (which Knex/MySQL parses as local time)
 * into a UTC Date object matching the string time.
 */
function dbDateToUTC(dateVal) {
    if (!dateVal) return null;
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return null;
    
    // Treat the local fields as UTC values
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

function dateToISTDateString(dateVal) {
    if (!dateVal) return null;
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return null;
    return d.toLocaleDateString('sv-SE', { timeZone: 'Asia/Kolkata' });
}

class MachineAttendanceService {
    /**
     * Registers a biometric device and generates a secure API key.
     */
    async registerDevice(companyId, data) {
        const { device_name, device_serial, ip_address, port } = data;

        if (!device_serial || !device_name) {
            throw new Error('Device serial and name are required.');
        }

        // Check if device with the same serial already exists
        const existing = await db('biometric_devices')
            .where({ device_serial })
            .first();

        if (existing) {
            if (existing.company_id !== companyId) {
                throw new Error(`Device serial ${device_serial} is already registered under another company.`);
            }
            return {
                message: 'Device already registered.',
                device: {
                    id: existing.id,
                    company_id: existing.company_id,
                    device_name: existing.device_name,
                    device_serial: existing.device_serial,
                    ip_address: existing.ip_address,
                    port: existing.port,
                    status: existing.status,
                    api_key: existing.api_key,
                    created_at: existing.created_at
                }
            };
        }

        // Generate a cryptographically secure random API key prefixed with mfhr_device_live_
        const apiKey = `mfhr_device_live_${crypto.randomBytes(32).toString('hex')}`;

        const payload = {
            company_id: companyId,
            device_name,
            device_serial,
            ip_address,
            port: parseInt(port) || 5005,
            status: 'online',
            api_key: apiKey,
            last_ping_at: db.fn.now()
        };

        const [id] = await db('biometric_devices').insert(payload);
        const registered = await db('biometric_devices').where({ id }).first();

        return {
            message: 'Device registered successfully.',
            device: registered
        };
    }

    /**
     * Maps an employee biometric enrollment ID to a platform employee ID.
     */
    async mapEmployee(companyId, data) {
        const { employee_id, biometric_enroll_id } = data;

        if (!employee_id || !biometric_enroll_id) {
            throw new Error('Employee ID and Biometric Enrollment ID are required.');
        }

        // Verify employee belongs to company
        const employee = await db('employees')
            .where({ id: employee_id, company_id: companyId })
            .first();

        if (!employee) {
            throw new Error('Employee not found in this company.');
        }

        // Check existing mapping
        const existing = await db('employee_biometric_mapping')
            .where({ company_id: companyId, biometric_enroll_id })
            .first();

        if (existing) {
            if (existing.employee_id === parseInt(employee_id)) {
                return { message: 'Mapping already exists.', mapping: existing };
            }
            // Update mapping if enroll ID is assigned to a different employee
            await db('employee_biometric_mapping')
                .where({ id: existing.id })
                .update({ employee_id, created_at: db.fn.now() });
                
            return { message: 'Mapping updated successfully.', mapping: { ...existing, employee_id } };
        }

        const payload = {
            company_id: companyId,
            employee_id: parseInt(employee_id),
            biometric_enroll_id
        };

        const [id] = await db('employee_biometric_mapping').insert(payload);

        return {
            message: 'Employee biometric mapping created.',
            mapping: { id, ...payload }
        };
    }

    /**
     * Processes a single machine log entry.
     */
    async processPunch(companyId, deviceSerial, punch) {
        const { employee_code, timestamp } = punch;

        if (!employee_code || !timestamp) {
            return { status: 'failed', reason: 'Missing employee_code or timestamp' };
        }

        // Parse the incoming timestamp in Indian Standard Time (IST) timezone
        const rawTimeStr = typeof timestamp === 'string' ? timestamp : String(timestamp);
        const punchTime = new Date(rawTimeStr.includes('+') ? rawTimeStr : `${rawTimeStr} +05:30`);
        if (isNaN(punchTime.getTime())) {
            return { status: 'failed', reason: 'Invalid timestamp format' };
        }

        const punchTimeStr = punchTime.toISOString().slice(0, 19).replace('T', ' ');

        // 1. Duplicate Transmission Prevention (Check if raw log already exists in audit table)
        const duplicateRaw = await db('biometric_raw_logs')
            .where({
                company_id: companyId,
                device_serial: deviceSerial,
                employee_code,
                punch_time: punchTimeStr
            })
            .first();

        if (duplicateRaw) {
            return { status: 'skipped', reason: 'Duplicate log transmission' };
        }

        try {
            // 2. Resolve Employee
            let employeeId = null;

            const cleanCode = employeeCodeClean(employee_code);

            // Check mapping table first (biometric_enroll_id)
            const mapper = await db('employee_biometric_mapping')
                .where({ company_id: companyId, biometric_enroll_id: cleanCode })
                .first();

            if (mapper) {
                employeeId = mapper.employee_id;
            } else {
                // Fallback: try matching employees.employee_id_number as string
                let employee = await db('employees')
                    .where({ company_id: companyId, employee_id_number: cleanCode })
                    .first();

                // If not found, try without leading zeros (e.g. machine sends "09910" but stored as "9910")
                if (!employee && cleanCode.startsWith('0')) {
                    const strippedCode = cleanCode.replace(/^0+/, '');
                    employee = await db('employees')
                        .where({ company_id: companyId, employee_id_number: strippedCode })
                        .first();
                }

                // If still not found, try numeric comparison (employee_id_number stored as number)
                if (!employee) {
                    const numericCode = parseInt(cleanCode, 10);
                    if (!isNaN(numericCode)) {
                        employee = await db('employees')
                            .where({ company_id: companyId })
                            .whereRaw('CAST(employee_id_number AS CHAR) = ?', [String(numericCode)])
                            .first();
                    }
                }

                if (employee) {
                    employeeId = employee.id;
                }
            }

            if (!employeeId) {
                // Log unmapped punch
                await db('biometric_raw_logs').insert({
                    company_id: companyId,
                    device_serial: deviceSerial,
                    employee_code,
                    punch_time: punchTimeStr,
                    status: 'invalid_user',
                    error_details: `Unmapped biometric enroll ID: '${cleanCode}'. No employee found with this code.`
                });
                return { status: 'skipped', reason: `Employee mapping not found for code: ${cleanCode}` };
            }

            // 3. Process Check-In / Check-Out Business Logic
            const dateStr = dateToISTDateString(punchTime);

            // 3a. Check for night shift: look back on the previous date for an open check-in (< 16 hours old)
            const prevDateObj = new Date(punchTime.getTime() - 24 * 60 * 60 * 1000);
            const prevDateStr = dateToISTDateString(prevDateObj);

            let activeLog = null;

            // First check if there is an active check-in on the previous day with NO check-out
            const openPrevDayLog = await db('attendance')
                .where({ employee_id: employeeId, company_id: companyId })
                .whereRaw('DATE(check_in) = ?', [prevDateStr])
                .whereNull('check_out')
                .first();

            if (openPrevDayLog) {
                const checkInTime = dbDateToUTC(openPrevDayLog.check_in);
                const diffHours = Math.abs(punchTime.getTime() - checkInTime.getTime()) / (1000 * 60 * 60);
                if (diffHours < 16) {
                    activeLog = openPrevDayLog; // night shift checkout!
                }
            }

            // Fetch Employee with Shift Info and Scheme Info
            const employeeWithShift = await db('employees')
                .leftJoin('shifts', 'employees.shift_id', 'shifts.id')
                .leftJoin('attendance_schemes', 'employees.attendance_scheme_id', 'attendance_schemes.id')
                .where('employees.id', employeeId)
                .select(
                    'employees.*', 
                    'shifts.start_time as shift_start', 
                    'shifts.end_time as shift_end',
                    'shifts.grace_period as shift_grace',
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
                    'attendance_schemes.grace_period as scheme_grace',
                    'attendance_schemes.half_day_hours as scheme_half_day_hours'
                )
                .first();

            // Resolve overridden shift for this date
            const targetShiftDate = activeLog 
                ? dateToISTDateString(dbDateToUTC(activeLog.check_in)) 
                : dateStr;

            if (employeeWithShift) {
                const activeAssignment = await db('employee_shift_assignments as esa')
                    .join('shifts as s', 'esa.shift_id', 's.id')
                    .where('esa.employee_id', employeeId)
                    .where('esa.from_date', '<=', targetShiftDate)
                    .andWhere(function () {
                        this.where('esa.to_date', '>=', targetShiftDate).orWhereNull('esa.to_date');
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
                        's.session2_grace_out'
                    )
                    .orderBy('esa.id', 'desc')
                    .first();

                if (activeAssignment) {
                    employeeWithShift.shift_is_flexi = activeAssignment.is_flexi;
                    employeeWithShift.min_hours = activeAssignment.min_hours;
                    employeeWithShift.shift_start = activeAssignment.start_time;
                    employeeWithShift.shift_end = activeAssignment.end_time;
                    employeeWithShift.shift_grace = activeAssignment.shift_grace;
                    employeeWithShift.shift_total_punches = activeAssignment.shift_total_punches;
                    employeeWithShift.shift_in_margin = activeAssignment.shift_in_margin;
                    employeeWithShift.shift_out_margin = activeAssignment.shift_out_margin;
                    employeeWithShift.session2_start_time = activeAssignment.session2_start_time;
                    employeeWithShift.session2_end_time = activeAssignment.session2_end_time;
                    employeeWithShift.session2_in_margin = activeAssignment.session2_in_margin;
                    employeeWithShift.session2_out_margin = activeAssignment.session2_out_margin;
                    employeeWithShift.session1_grace_out = activeAssignment.session1_grace_out;
                    employeeWithShift.session2_grace_in = activeAssignment.session2_grace_in;
                    employeeWithShift.session2_grace_out = activeAssignment.session2_grace_out;
                }
            }

            // Determine if the current punch belongs to Session 2 (for 4-punch shifts)
            let isSession2 = false;
            let session2CutoffMins = 0;
            const reqPunches = parseInt(employeeWithShift?.shift_total_punches || 2);
            if (reqPunches === 4) {
                const punchMins = dateToISTMins(punchTime);
                const s2StartStr = employeeWithShift?.session2_start_time || '14:00';
                const [s2Hours, s2Mins] = s2StartStr.split(':').map(Number);
                const s2StartMins = s2Hours * 60 + s2Mins;
                const s2InMargin = parseInt(employeeWithShift?.session2_in_margin || 30);
                session2CutoffMins = s2StartMins - s2InMargin;
                if (punchMins >= session2CutoffMins) {
                    isSession2 = true;
                }
            }

            // Overwrite/map shift parameters for Session 2 if active
            if (isSession2 && employeeWithShift) {
                employeeWithShift.shift_start = employeeWithShift.session2_start_time || '14:00';
                employeeWithShift.shift_end = employeeWithShift.session2_end_time || '18:00';
                employeeWithShift.shift_in_margin = employeeWithShift.session2_in_margin !== undefined ? employeeWithShift.session2_in_margin : 30;
                employeeWithShift.shift_out_margin = employeeWithShift.session2_out_margin !== undefined ? employeeWithShift.session2_out_margin : 0;
                employeeWithShift.shift_grace = employeeWithShift.session2_grace_in !== undefined ? employeeWithShift.session2_grace_in : 15;
            }

            // If no night shift open log, search on the same day
            if (!activeLog) {
                if (reqPunches === 4) {
                    const cutoffHour = Math.floor(session2CutoffMins / 60);
                    const cutoffMin = session2CutoffMins % 60;
                    const cutoffDateObj = new Date(`${dateStr} ${String(cutoffHour).padStart(2, '0')}:${String(cutoffMin).padStart(2, '0')}:00 +05:30`);
                    const cutoffTimeUTCStr = cutoffDateObj.toISOString().slice(0, 19).replace('T', ' ');
                    
                    if (isSession2) {
                        activeLog = await db('attendance')
                            .where({ employee_id: employeeId, company_id: companyId })
                            .whereRaw('DATE(check_in) = ?', [dateStr])
                            .whereRaw('check_in >= ?', [cutoffTimeUTCStr])
                            .first();
                    } else {
                        activeLog = await db('attendance')
                            .where({ employee_id: employeeId, company_id: companyId })
                            .whereRaw('DATE(check_in) = ?', [dateStr])
                            .whereRaw('check_in < ?', [cutoffTimeUTCStr])
                            .first();
                    }
                } else {
                    activeLog = await db('attendance')
                        .where({ employee_id: employeeId, company_id: companyId })
                        .whereRaw('DATE(check_in) = ?', [dateStr])
                        .first();
                }
            }

            if (!activeLog) {
                // --- CHECK-IN ROUTINE ---

                // IN MARGIN CHECK
                if (employeeWithShift && !employeeWithShift.shift_is_flexi) {
                    const shiftStart = employeeWithShift.shift_start || '09:00';
                    const inMargin = employeeWithShift.shift_in_margin !== undefined ? parseInt(employeeWithShift.shift_in_margin) : 0;
                    if (inMargin > 0) {
                        const [sHours, sMins] = shiftStart.split(':').map(Number);
                        const shiftStartDate = new Date(`${dateStr} ${String(sHours).padStart(2, '0')}:${String(sMins).padStart(2, '0')}:00 +05:30`);
                        const earliestCheckIn = new Date(shiftStartDate.getTime() - inMargin * 60 * 1000);
                        if (punchTime < earliestCheckIn) {
                            await db('biometric_raw_logs').insert({
                                company_id: companyId,
                                device_serial: deviceSerial,
                                employee_code,
                                punch_time: punchTimeStr,
                                status: 'skipped',
                                error_details: `Punch in before allowed margin (earliest allowed: ${earliestCheckIn.toLocaleTimeString('en-GB', { timeZone: 'Asia/Kolkata' })})`
                            });
                            return { status: 'skipped', reason: 'Punch in before allowed margin' };
                        }
                    }
                }

                const rules = await db('working_rules').where({ company_id: companyId }).first() || {
                    shift_start: '09:00',
                    grace_period: 15
                };

                let status = 'present';
                let isCheckoutAttempt = false;

                if (employeeWithShift && employeeWithShift.shift_start && employeeWithShift.shift_end && !employeeWithShift.shift_is_flexi) {
                    const shiftStart = employeeWithShift.shift_start;
                    const shiftEnd = employeeWithShift.shift_end;
                    const [sHours, sMins] = shiftStart.split(':').map(Number);
                    const [eHours, eMins] = shiftEnd.split(':').map(Number);
                    const shiftStartDate = new Date(`${dateStr} ${String(sHours).padStart(2, '0')}:${String(sMins).padStart(2, '0')}:00 +05:30`);
                    let shiftEndDate = new Date(`${dateStr} ${String(eHours).padStart(2, '0')}:${String(eMins).padStart(2, '0')}:00 +05:30`);
                    if (shiftEndDate < shiftStartDate) {
                        // Midnight crossing
                        shiftEndDate = new Date(shiftEndDate.getTime() + 24 * 60 * 60 * 1000);
                    }
                    const shiftDurationMins = Math.round((shiftEndDate - shiftStartDate) / 60000);
                    const checkoutWindowMins = Math.min(120, shiftDurationMins * 0.25);
                    const thresholdDate = new Date(shiftEndDate.getTime() - checkoutWindowMins * 60 * 1000);
                    if (punchTime >= thresholdDate) {
                        isCheckoutAttempt = true;
                        status = 'no_in';
                    }
                }

                const approvedRequest = await db('attendance_entry_requests')
                    .where({ employee_id: employeeId, company_id: companyId, date: dateStr, request_type: 'late_in', status: 'approved' })
                    .first();

                if (!isCheckoutAttempt && !approvedRequest && !employeeWithShift?.shift_is_flexi) {
                    const shiftStart = employeeWithShift?.shift_start || rules.shift_start || '09:00';
                    const grace = employeeWithShift?.scheme_grace ?? employeeWithShift?.shift_grace ?? rules.grace_period ?? 15;

                    const [sHours, sMins] = shiftStart.split(':').map(Number);
                    const totalMins = sMins + (parseInt(grace) || 0);
                    const allowedHours = String(sHours + Math.floor(totalMins / 60)).padStart(2, '0');
                    const allowedMins = String(totalMins % 60).padStart(2, '0');
                    // Construct allowed shift start time in IST timezone
                    const shiftAllowed = new Date(`${dateStr} ${allowedHours}:${allowedMins}:00 +05:30`);

                    if (punchTime > shiftAllowed) {
                        // Biometric machine punch - log attendance as 'late' instead of blocking
                        // Auto-create regularization request for manager review
                        status = 'pending';
                        const existingRequest = await db('attendance_entry_requests')
                            .where({ employee_id: employeeId, company_id: companyId, date: dateStr, request_type: 'late_in' })
                            .first();
                        if (!existingRequest) {
                            await db('attendance_entry_requests').insert({
                                company_id: companyId,
                                employee_id: employeeId,
                                date: dateStr,
                                request_type: 'late_in',
                                punch_time: punchTimeStr,
                                location_data: JSON.stringify({ source: 'biometric', device_serial: deviceSerial }),
                                status: 'pending',
                                created_at: db.fn.now(),
                                updated_at: db.fn.now()
                            });
                        }
                        // NOTE: Do NOT return/skip - continue to log the attendance below
                    }
                }

                await db('attendance').insert({
                    employee_id: employeeId,
                    company_id: companyId,
                    check_in: punchTimeStr,
                    check_out: null,
                    status: status,
                    punch_source: 'biometric',
                    device_id: deviceSerial,
                    created_at: db.fn.now()
                });

                // Record audit log
                await db('biometric_raw_logs').insert({
                    company_id: companyId,
                    device_serial: deviceSerial,
                    employee_code,
                    punch_time: punchTimeStr,
                    status: 'synced'
                });

                return { status: 'check-in', record_status: status };
            } else {
                // --- CHECK-OUT ROUTINE / RE-PUNCH DEDUPLICATION ---
                const currentCheckIn = dbDateToUTC(activeLog.check_in);
                const diffMinutesFromCheckIn = Math.abs(punchTime.getTime() - currentCheckIn.getTime()) / 60000;

                // Deduplicate consecutive double punches (within 2 minutes of check-in)
                if (diffMinutesFromCheckIn < 2) {
                    await db('biometric_raw_logs').insert({
                        company_id: companyId,
                        device_serial: deviceSerial,
                        employee_code,
                        punch_time: punchTimeStr,
                        status: 'duplicate',
                        error_details: 'Punch is within 2 minutes of check-in'
                    });
                    return { status: 'skipped', reason: 'Deduplicated: within 2 minutes of check-in' };
                }

                if (activeLog.check_out) {
                    const currentCheckOut = dbDateToUTC(activeLog.check_out);
                    const diffMinutesFromCheckOut = Math.abs(punchTime.getTime() - currentCheckOut.getTime()) / 60000;

                    // Deduplicate consecutive double punches (within 2 minutes of last checkout)
                    if (diffMinutesFromCheckOut < 2) {
                        await db('biometric_raw_logs').insert({
                            company_id: companyId,
                            device_serial: deviceSerial,
                            employee_code,
                            punch_time: punchTimeStr,
                            status: 'duplicate',
                            error_details: 'Punch is within 2 minutes of check-out'
                        });
                        return { status: 'skipped', reason: 'Deduplicated: within 2 minutes of check-out' };
                    }
                }

                // If punchTime is actually before check_in, ignore it (should not happen chronologically)
                if (punchTime < currentCheckIn) {
                    await db('biometric_raw_logs').insert({
                        company_id: companyId,
                        device_serial: deviceSerial,
                        employee_code,
                        punch_time: punchTimeStr,
                        status: 'failed',
                        error_details: 'Punch timestamp is prior to recorded check-in time'
                    });
                    return { status: 'skipped', reason: 'Punch time prior to check-in' };
                }

                const employee = employeeWithShift;
                const rules = await db('working_rules').where({ company_id: companyId }).first() || {};

                const checkIn = dbDateToUTC(activeLog.check_in);
                const workedHours = (punchTime - checkIn) / (1000 * 60 * 60);

                let isEarly = false;
                let halfDayLimit = 4; // default
                let shiftEndDate = null;
                let outMarginThreshold = null;

                if (employee?.is_flexi) {
                    const minHours = parseFloat(employee?.min_hours) || 8;
                    halfDayLimit = minHours / 2;
                    if (workedHours < minHours) {
                        isEarly = true;
                    }
                } else {
                    const shiftStart = employee?.shift_start || '09:00';
                    const shiftEnd = employee?.shift_end || '18:00';
                    const outMargin = employee?.shift_out_margin !== undefined ? parseInt(employee.shift_out_margin) : 0;
                    
                    const checkInDateStr = dateToISTDateString(currentCheckIn);
                    const [sHours, sMins] = shiftStart.split(':').map(Number);
                    const [eHours, eMins] = shiftEnd.split(':').map(Number);
                    const shiftStartDate = new Date(`${checkInDateStr} ${String(sHours).padStart(2, '0')}:${String(sMins).padStart(2, '0')}:00 +05:30`);
                    shiftEndDate = new Date(`${checkInDateStr} ${String(eHours).padStart(2, '0')}:${String(eMins).padStart(2, '0')}:00 +05:30`);
                    if (shiftEndDate < shiftStartDate) {
                        // Midnight crossing
                        shiftEndDate = new Date(shiftEndDate.getTime() + 24 * 60 * 60 * 1000);
                    }

                    // 1. PUNCH OUT BEFORE SHIFT START: Ignore / Skip punch
                    if (punchTime < shiftStartDate) {
                        await db('biometric_raw_logs').insert({
                            company_id: companyId,
                            device_serial: deviceSerial,
                            employee_code,
                            punch_time: punchTimeStr,
                            status: 'skipped',
                            error_details: 'Punch out prior to shift start time'
                        });
                        return { status: 'skipped', reason: 'Punch out prior to shift start' };
                    }

                    // Determine half day hours limit
                    halfDayLimit = employee?.min_hours !== undefined && employee?.min_hours !== null
                        ? parseFloat(employee.min_hours) / 2
                        : (employee?.scheme_half_day_hours !== undefined && employee?.scheme_half_day_hours !== null
                            ? parseFloat(employee.scheme_half_day_hours)
                            : parseFloat(rules.half_day_hours || 4));

                    outMarginThreshold = new Date(shiftEndDate.getTime() - outMargin * 60 * 1000);

                    if (punchTime < shiftEndDate) {
                        isEarly = true;
                    }

                    // 2. Determine if we should generate an early out regularization request
                    let triggersEarlyOutRequest = false;

                    if (isEarly) {
                        if (punchTime < outMarginThreshold) {
                            // If they are punching out BEFORE the out margin window, triggers early out request
                            triggersEarlyOutRequest = true;
                        }
                    }

                    // Check if there is an approved Entry/Exit Request for this date and type 'early_out'
                    const approvedRequest = await db('attendance_entry_requests')
                        .where({ employee_id: employeeId, company_id: companyId, date: dateStr, request_type: 'early_out', status: 'approved' })
                        .first();

                    if (!approvedRequest && triggersEarlyOutRequest) {
                        // Biometric machine punch - log checkout anyway, just create a regularization request
                        const existingRequest = await db('attendance_entry_requests')
                            .where({ employee_id: employeeId, company_id: companyId, date: dateStr, request_type: 'early_out' })
                            .first();
                        if (!existingRequest) {
                            await db('attendance_entry_requests').insert({
                                company_id: companyId,
                                employee_id: employeeId,
                                date: dateStr,
                                request_type: 'early_out',
                                punch_time: punchTimeStr,
                                location_data: JSON.stringify({ source: 'biometric', device_serial: deviceSerial }),
                                status: 'pending',
                                created_at: db.fn.now(),
                                updated_at: db.fn.now()
                            });
                        }
                        // Update check_out and set status to 'pending' because it requires approval
                        await db('attendance')
                            .where({ id: activeLog.id })
                            .update({
                                check_out: punchTimeStr,
                                status: 'pending',
                                punch_source: 'biometric',
                                device_id: deviceIdString(deviceSerial),
                                updated_at: db.fn.now()
                            });

                        // Record audit log
                        await db('biometric_raw_logs').insert({
                            company_id: companyId,
                            device_serial: deviceSerial,
                            employee_code,
                            punch_time: punchTimeStr,
                            status: 'synced'
                        });

                        return { status: 'check-out', record_status: 'pending' };
                    }
                }

                // Normal/non-blocked checkout: Update check_out
                await db('attendance')
                    .where({ id: activeLog.id })
                    .update({
                        check_out: punchTimeStr,
                        punch_source: 'biometric',
                        device_id: deviceIdString(deviceSerial),
                        updated_at: db.fn.now()
                    });

                // Calculate and update status in database on checkout
                let newStatus = activeLog.status || 'present';
                if (employee?.is_flexi) {
                    const minHours = parseFloat(employee.min_hours) || 8;
                    if (workedHours < halfDayLimit) {
                        newStatus = 'short';
                    } else if (workedHours < minHours) {
                        newStatus = 'half-day';
                    } else {
                        newStatus = 'present';
                    }
                } else {
                    if (outMarginThreshold && shiftEndDate && punchTime >= outMarginThreshold && punchTime < shiftEndDate) {
                        newStatus = 'early_out';
                    } else if (workedHours < halfDayLimit) {
                        newStatus = 'short';
                    } else if (isEarly) {
                        newStatus = 'early_out';
                    } else if (newStatus !== 'pending') {
                        newStatus = 'present';
                    }
                }

                await db('attendance')
                    .where({ id: activeLog.id })
                    .update({ status: newStatus });

                // Record audit log
                await db('biometric_raw_logs').insert({
                    company_id: companyId,
                    device_serial: deviceSerial,
                    employee_code,
                    punch_time: punchTimeStr,
                    status: 'synced'
                });

                return { status: 'check-out' };
            }
        } catch (error) {
            console.error('[BIOMETRIC-SYNC-ERROR]:', error);
            await db('biometric_raw_logs').insert({
                company_id: companyId,
                device_serial: deviceSerial,
                employee_code,
                punch_time: punchTimeStr,
                status: 'failed',
                error_details: error.message
            });
            return { status: 'failed', reason: error.message };
        }
    }

    /**
     * Gets all biometric devices for a company.
     */
    async getDevices(companyId) {
        return await db('biometric_devices')
            .where({ company_id: companyId })
            .select('id', 'company_id', 'device_name', 'device_serial', 'ip_address', 'port', 'status', 'api_key', 'last_ping_at', 'created_at');
    }

    /**
     * Deletes a biometric device.
     */
    async deleteDevice(companyId, deviceId) {
        const deleted = await db('biometric_devices')
            .where({ id: deviceId, company_id: companyId })
            .del();
        if (!deleted) {
            throw new Error('Device not found or not authorized.');
        }
        return { message: 'Device deleted successfully.' };
    }
}

// Helper to sanitize enroll IDs (remove leading zeros or whitespace)
function employeeCodeClean(code) {
    if (typeof code !== 'string') return String(code);
    return code.trim();
}

// Helper to sanitize device serial string
function deviceIdString(serial) {
    if (typeof serial !== 'string') return 'BIOMETRIC_DEV';
    return serial.substring(0, 100);
}

module.exports = new MachineAttendanceService();
