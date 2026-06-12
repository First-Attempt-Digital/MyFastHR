const attendanceRepository = require('../repositories/attendanceRepository');
const db = require('../config/db');
const notificationService = require('./notificationService');

function toLocalYMD(dateVal) {
    if (!dateVal) return null;
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return null;
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}

function safeFormatTime(dateTimeVal) {
    if (!dateTimeVal) return null;
    let d;
    if (dateTimeVal instanceof Date) {
        d = dateTimeVal;
    } else {
        let str = String(dateTimeVal).trim();
        if (str.includes(' ') && !str.includes('T')) {
            str = str.replace(' ', 'T');
        }
        d = new Date(str);
    }
    if (isNaN(d.getTime())) return null;
    return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

function mapDbStatusToFrontend(status) {
    if (status === null || status === undefined) return 'A';
    const s = String(status).trim().toLowerCase();
    if (s === 'pending') return '-';
    if (s === '') return 'P';
    if (s === 'present' || s === 'p') return 'P';
    if (s === 'absent' || s === 'a' || s === 'short') return 'A';
    if (s === 'late' || s === 'l' || s === 'late_in' || s === 'late-in') return 'L';
    if (s === 'early_out' || s === 'early-out' || s === 'eo' || s === 'earlyout') return 'E';
    if (s === 'off') return 'OFF';
    if (s === 'regularized' || s === 'r') return 'R';
    if (s === 'half-day' || s === 'hd' || s === 'half_day') return 'HD';
    return 'P';
}

function mapFrontendStatusToDb(status) {
    if (!status) return 'absent';
    const s = status.toUpperCase();
    if (s === 'P') return 'present';
    if (s === 'A') return 'absent';
    if (s === 'OFF') return 'off';
    if (s === 'R') return 'regularized';
    if (s === 'HD') return 'half-day';
    if (s === 'E' || s === 'EO') return 'early_out';
    return 'present';
}


function calculateSplitShiftStatus(dayLogs, shift, rules) {
    const reqPunches = parseInt(shift.total_punches_required || shift.shift_total_punches || 2);

    const timeToMins = (timeStr) => {
        if (!timeStr) return 0;
        const [h, m] = timeStr.split(':').map(Number);
        return h * 60 + m;
    };

    const dateToMins = (dateVal) => {
        if (!dateVal) return 0;
        const d = new Date(dateVal);
        return d.getHours() * 60 + d.getMinutes();
    };

    const s1Start = timeToMins(shift.start_time || shift.shift_start || '09:00');
    const s1End = timeToMins(shift.end_time || shift.shift_end || '18:00');
    const grace1In = parseInt(shift.grace_period || shift.shift_grace || rules.grace_period || 15);
    const grace1Out = parseInt(shift.session1_grace_out || shift.shift_session1_grace_out || 0);

    if (reqPunches === 4) {
        const s2Start = timeToMins(shift.session2_start_time || shift.shift_session2_start || '14:00');
        const s2End = timeToMins(shift.session2_end_time || shift.shift_session2_end || '18:00');
        const grace2In = parseInt(shift.session2_grace_in || shift.shift_session2_grace_in || 15);
        const grace2Out = parseInt(shift.session2_grace_out || shift.shift_session2_grace_out || 0);
        const s2InMargin = parseInt(shift.session2_in_margin || shift.shift_session2_in_margin || 30);

        // Classify logs using the dynamic Session 2 In Margin
        const s1Logs = dayLogs.filter(log => dateToMins(log.check_in) < (s2Start - s2InMargin));
        const s2Logs = dayLogs.filter(log => dateToMins(log.check_in) >= (s2Start - s2InMargin));

        let s1Present = false;
        let s1Late = false;
        let s1Early = false;
        let s1PunchText = 'S1: Missed';

        const s1Log = s1Logs[0];
        if (s1Log) {
            const inMins = dateToMins(s1Log.check_in);
            s1Late = inMins > (s1Start + grace1In);

            if (s1Log.check_out) {
                const outMins = dateToMins(s1Log.check_out);
                s1Early = outMins < (s1End - grace1Out);
                s1Present = true;
                s1PunchText = `S1: ${s1Late ? 'Late' : 'On-Time'} (${safeFormatTime(s1Log.check_in)} - ${safeFormatTime(s1Log.check_out)})`;
            } else {
                s1PunchText = `S1: No Out (${safeFormatTime(s1Log.check_in)} - --:--)`;
            }
        }

        let s2Present = false;
        let s2Late = false;
        let s2Early = false;
        let s2PunchText = 'S2: Missed';

        const s2Log = s2Logs[0];
        if (s2Log) {
            const inMins = dateToMins(s2Log.check_in);
            s2Late = inMins > (s2Start + grace2In);

            if (s2Log.check_out) {
                const outMins = dateToMins(s2Log.check_out);
                s2Early = outMins < (s2End - grace2Out);
                s2Present = true;
                s2PunchText = `S2: ${s2Late ? 'Late' : 'On-Time'} (${safeFormatTime(s2Log.check_in)} - ${safeFormatTime(s2Log.check_out)})`;
            } else {
                s2PunchText = `S2: No Out (${safeFormatTime(s2Log.check_in)} - --:--)`;
            }
        }

        let status = 'A';
        if (s1Present && s2Present) {
            if (s1Late || s2Late) {
                status = 'L';
            } else if (s1Early || s2Early) {
                status = 'E';
            } else {
                status = 'P';
            }
        } else if (s1Present || s2Present) {
            status = 'HD';
        } else {
            status = 'A';
        }

        return {
            status,
            session1_status: s1Present ? (s1Late ? 'Late' : 'Present') : 'Absent',
            session2_status: s2Present ? (s2Late ? 'Late' : 'Present') : 'Absent',
            explanation: `${s1PunchText} | ${s2PunchText}`,
            punch_count: dayLogs.length * 2
        };
    } else {
        // Standard 2-punch shift
        const log = dayLogs[0];
        if (!log) {
            return { status: 'A', explanation: 'Missed', punch_count: 0 };
        }

        const inMins = dateToMins(log.check_in);
        const isLate = inMins > (s1Start + grace1In);

        if (log.check_out) {
            const outMins = dateToMins(log.check_out);
            const isEarly = outMins < (s1End - grace1Out);
            let status = 'P';
            if (isLate) status = 'L';
            else if (isEarly) status = 'E';

            return {
                status,
                explanation: `S1: ${isLate ? 'Late' : 'On-Time'} (${safeFormatTime(log.check_in)} - ${safeFormatTime(log.check_out)})`,
                punch_count: 2
            };
        } else {
            return {
                status: 'A',
                explanation: `S1: Incomplete (${safeFormatTime(log.check_in)} - --:--)`,
                punch_count: 1
            };
        }
    }
}


class AttendanceService {
    async getEmployeeId(userId, companyId, existingEmpId = null) {
        if (existingEmpId) return existingEmpId;

        const employee = await db('employees').where({ user_id: userId, company_id: companyId }).first();
        if (!employee) {
            // Fallback: search by userId only if company_id mismatch is suspected
            const fallback = await db('employees').where({ user_id: userId }).first();
            if (fallback) return fallback.id;

            throw new Error('Employee record not found for this user');
        }
        return employee.id;
    }

    async checkIn(user, companyId, location, ip) {
        const empId = await this.getEmployeeId(user.id, companyId, user.employee_id);

        // 1. Fetch Employee with Shift Info and Scheme Info
        const employee = await db('employees')
            .leftJoin('shifts', 'employees.shift_id', 'shifts.id')
            .leftJoin('attendance_schemes', 'employees.attendance_scheme_id', 'attendance_schemes.id')
            .where('employees.id', empId)
            .select(
                'employees.*',
                'shifts.start_time as shift_start',
                'shifts.end_time as shift_end',
                'shifts.grace_period as shift_grace',
                'shifts.is_flexi as shift_is_flexi',
                'attendance_schemes.grace_period as scheme_grace'
            )
            .first();

        // 2. Fetch Company Rules as Fallback
        const rules = await db('working_rules').where({ company_id: companyId }).first() || {
            shift_start: '09:00',
            grace_period: 15
        };

        let status = 'present';
        const now = new Date();
        const punchTimeStr = now.toISOString().slice(0, 19).replace('T', ' ');
        const dateStr = now.toISOString().split('T')[0];

        let isCheckoutAttempt = false;
        if (employee && employee.shift_end && !employee.shift_is_flexi) {
            const shiftEndStr = employee.shift_end;
            const [eHours, eMins] = shiftEndStr.split(':').map(Number);
            const thresholdMins = eHours * 60 + eMins - 120; // 2 hours prior to shift end
            const punchMins = now.getHours() * 60 + now.getMinutes();
            if (punchMins >= thresholdMins) {
                isCheckoutAttempt = true;
                status = 'no_in';
            }
        }

        // Check if there is an approved Entry/Exit Request for this date and type 'late_in'
        const approvedRequest = await db('attendance_entry_requests')
            .where({ employee_id: empId, company_id: companyId, date: dateStr, request_type: 'late_in', status: 'approved' })
            .first();

        if (!isCheckoutAttempt && !approvedRequest && !employee?.shift_is_flexi) {
            const shiftStart = employee?.shift_start || rules.shift_start || '09:00';
            const grace = employee?.scheme_grace ?? employee?.shift_grace ?? rules.grace_period ?? 15;

            const [sHours, sMins] = shiftStart.split(':').map(Number);
            const shiftAllowed = new Date(now);
            shiftAllowed.setHours(sHours, sMins + (parseInt(grace) || 0), 0, 0);

            if (now > shiftAllowed) {
                // AUTO-CREATE PENDING ENTRY/EXIT REQUEST
                const existingRequest = await db('attendance_entry_requests')
                    .where({ employee_id: empId, company_id: companyId, date: dateStr, request_type: 'late_in' })
                    .first();
                if (!existingRequest) {
                    await db('attendance_entry_requests').insert({
                        company_id: companyId,
                        employee_id: empId,
                        date: dateStr,
                        request_type: 'late_in',
                        punch_time: punchTimeStr,
                        location_data: JSON.stringify({ location, ip, source: 'web' }),
                        status: 'pending',
                        created_at: db.fn.now(),
                        updated_at: db.fn.now()
                    });

                    await this.notifyAdminsAndManager(
                        companyId,
                        empId,
                        'Late In Approval Required',
                        `${employee?.first_name || ''} ${employee?.last_name || ''} has punched in late and requires approval.`
                    );
                }
                throw new Error('LATE_IN_APPROVAL_REQUIRED: Check-in blocked. Late In request has been auto-submitted for approval.');
            }
        }

        const [id] = await attendanceRepository.punchIn(empId, companyId, status, location, ip);
        return await db('attendance').where({ id }).first();
    }

    async checkOut(user, companyId, locationData = {}) {
        const empId = await this.getEmployeeId(user.id, companyId, user.employee_id);

        // Fetch the active attendance record before punching out
        const activeEntry = await db('attendance')
            .where({ employee_id: empId, company_id: companyId, check_out: null })
            .orderBy('check_in', 'desc')
            .first();

        if (!activeEntry) {
            throw new Error('No active check-in found.');
        }

        const employee = await db('employees')
            .leftJoin('shifts', 'employees.shift_id', 'shifts.id')
            .where('employees.id', empId)
            .select('shifts.is_flexi', 'shifts.min_hours', 'shifts.end_time')
            .first();

        const now = new Date();
        const punchTimeStr = now.toISOString().slice(0, 19).replace('T', ' ');
        const dateStr = now.toISOString().split('T')[0];

        // Check if there is an approved Entry/Exit Request for this date and type 'early_out'
        const approvedRequest = await db('attendance_entry_requests')
            .where({ employee_id: empId, company_id: companyId, date: dateStr, request_type: 'early_out', status: 'approved' })
            .first();

        if (!approvedRequest) {
            let isEarly = false;
            const checkIn = new Date(activeEntry.check_in);
            const workedHours = (now - checkIn) / (1000 * 60 * 60);
            const minHours = parseFloat(employee?.min_hours) || 8;
            const halfDayLimit = minHours / 2;

            if (employee?.is_flexi) {
                if (workedHours < minHours) {
                    isEarly = true;
                }
            } else {
                const shiftEnd = employee?.end_time || '18:00';
                const [eHours, eMins] = shiftEnd.split(':').map(Number);
                const shiftEndLimit = new Date(now);
                shiftEndLimit.setHours(eHours, eMins, 0, 0);
                if (now < shiftEndLimit) {
                    isEarly = true;
                }
            }

            // Only trigger early out request if employee has completed at least the half day hours.
            // If they punch out before half day, we ignore the early out request.
            if (isEarly && workedHours < halfDayLimit) {
                isEarly = false;
            }

            if (isEarly) {
                // AUTO-CREATE PENDING ENTRY/EXIT REQUEST
                const existingRequest = await db('attendance_entry_requests')
                    .where({ employee_id: empId, company_id: companyId, date: dateStr, request_type: 'early_out' })
                    .first();
                if (!existingRequest) {
                    await db('attendance_entry_requests').insert({
                        company_id: companyId,
                        employee_id: empId,
                        date: dateStr,
                        request_type: 'early_out',
                        punch_time: punchTimeStr,
                        location_data: JSON.stringify({ ...locationData, source: 'web' }),
                        status: 'pending',
                        created_at: db.fn.now(),
                        updated_at: db.fn.now()
                    });

                    await this.notifyAdminsAndManager(
                        companyId,
                        empId,
                        'Early Out Approval Required',
                        `${employee?.first_name || ''} ${employee?.last_name || ''} has punched out early and requires approval.`
                    );
                }
                throw new Error('EARLY_OUT_APPROVAL_REQUIRED: Check-out blocked. Early Out request has been auto-submitted for approval.');
            }
        }

        await attendanceRepository.punchOut(empId, companyId, locationData);

        // Flexi shift: calculate worked hours and update status accordingly
        if (employee?.is_flexi) {
            const checkIn = new Date(activeEntry.check_in);
            const workedHours = (now - checkIn) / (1000 * 60 * 60);
            const minHours = parseFloat(employee.min_hours) || 8;
            const halfDayThreshold = minHours / 2;

            let newStatus = 'present';
            if (workedHours < halfDayThreshold) {
                newStatus = 'short';
            } else if (workedHours < minHours) {
                newStatus = 'half-day';
            }

            await db('attendance')
                .where({ id: activeEntry.id })
                .update({ status: newStatus });
        }

        return await attendanceRepository.getCurrentStatus(empId, companyId);
    }

    async getHistory(user, companyId, month, year, extended = false) {
        const empId = await this.getEmployeeId(user.id, companyId, user.employee_id);
        const attendance = await attendanceRepository.getHistory(empId, companyId, month, year);

        if (!extended) {
            return attendance;
        }

        const leaves = await db('leaves')
            .where({ employee_id: empId, company_id: companyId })
            .whereIn('status', ['approved', 'pending'])
            .whereRaw('((MONTH(start_date) = ? AND YEAR(start_date) = ?) OR (MONTH(end_date) = ? AND YEAR(end_date) = ?))', [month, year, month, year]);

        const holidays = await db('holidays')
            .where({ company_id: companyId })
            .whereRaw('MONTH(date) = ? AND YEAR(date) = ?', [month, year]);

        const regularizations = await db('attendance_regularizations')
            .where({ employee_id: empId, company_id: companyId })
            .whereRaw('MONTH(date) = ? AND YEAR(date) = ?', [month, year]);

        const emp = await db('employees')
            .leftJoin('attendance_schemes', 'employees.attendance_scheme_id', 'attendance_schemes.id')
            .where('employees.id', empId)
            .select('attendance_schemes.weekoffs')
            .first();

        let weekoffs = ['Sunday'];
        if (emp?.weekoffs) {
            try {
                weekoffs = JSON.parse(emp.weekoffs);
            } catch (e) {
                // ignore
            }
        }

        return {
            attendance,
            leaves,
            holidays,
            regularizations,
            weekoffs
        };
    }

    async getCurrentStatus(user, companyId) {
        const empId = await this.getEmployeeId(user.id, companyId, user.employee_id);
        return await attendanceRepository.getCurrentStatus(empId, companyId);
    }

    async getMatrix(user, month, year) {
        const companyId = user.company_id;

        // 1. Fetch Company Rules
        const rules = await db('working_rules').where({ company_id: companyId }).first() || {
            shift_start: '09:00',
            grace_period: 15,
            weekoffs: JSON.stringify(['Sunday'])
        };

        const weekoffs = typeof rules.weekoffs === 'string' ? JSON.parse(rules.weekoffs) : (rules.weekoffs || []);
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

        // 2. Fetch Raw Data (Employees, Attendance, Leaves, Holidays)
        const holidays = await db('holidays')
            .where({ company_id: companyId })
            .whereRaw('MONTH(date) = ? AND YEAR(date) = ?', [month, year]);

        const raw = await attendanceRepository.getCompanyMatrix(user, month, year);
        const daysInMonth = new Date(year, month, 0).getDate();

        const matrix = raw.employees.map(emp => {
            const grid = {};
            const grid_timings = {};
            const grid_meta = {};
            const stats = { P: 0, L: 0, A: 0, PL: 0, UL: 0, OFF: 0, H: 0 };

            // Resolve employee specific weekoffs from scheme if assigned
            const empWeekoffs = emp.scheme_weekoffs
                ? (typeof emp.scheme_weekoffs === 'string' ? JSON.parse(emp.scheme_weekoffs) : emp.scheme_weekoffs)
                : weekoffs;

            const toLocalYMD = (dateVal) => {
                if (!dateVal) return null;
                const d = new Date(dateVal);
                if (isNaN(d.getTime())) return null;
                const y = d.getFullYear();
                const m = String(d.getMonth() + 1).padStart(2, '0');
                const day = String(d.getDate()).padStart(2, '0');
                return `${y}-${m}-${day}`;
            };

            const empJoinStr = emp.joining_date ? toLocalYMD(emp.joining_date) : null;
            const empResignStr = emp.resignation_date ? toLocalYMD(emp.resignation_date) : null;

            for (let d = 1; d <= daysInMonth; d++) {
                const date = new Date(year, month - 1, d);
                const dayName = dayNames[date.getDay()];
                const targetDateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

                // Check joining date constraint
                if (empJoinStr && targetDateStr < empJoinStr) {
                    grid[d] = '-';
                    continue;
                }

                // Check resignation date constraint
                if (empResignStr && targetDateStr > empResignStr) {
                    grid[d] = '-';
                    continue;
                }

                let status = '-'; // Default unknown

                // A. Check Week-offs
                if (empWeekoffs.includes(dayName)) {
                    status = 'OFF';
                    stats.OFF++;
                }
                // B. Check Holidays
                else if (holidays.some(h => new Date(h.date).getDate() === d)) {
                    status = 'H';
                    stats.H++;
                }
                // C. Check Attendance
                const dayLogs = raw.attendance.filter(a =>
                    a.employee_id === emp.id &&
                    new Date(a.check_in).getDate() === d
                ).sort((a, b) => new Date(a.check_in) - new Date(b.check_in));

                const getDayOfDate = (dateVal) => {
                    if (!dateVal) return null;
                    const dObj = new Date(dateVal);
                    return dObj.getDate();
                };

                const dayRegularization = raw.regularizations?.find(r =>
                    r.employee_id === emp.id &&
                    getDayOfDate(r.date) === d
                );

                const dayEarlyOut = raw.entryRequests?.find(er =>
                    er.employee_id === emp.id &&
                    getDayOfDate(er.date) === d
                );

                if (dayLogs.length > 0) {
                    const firstLog = dayLogs[0];
                    const dbStatus = firstLog.status ? firstLog.status.toLowerCase() : '';

                    if (dbStatus === 'pending') {
                        status = '-';
                    } else if (firstLog.punch_source === 'manual' || firstLog.punch_source === 'manual_override') {
                        status = mapDbStatusToFrontend(dbStatus);
                        if (status === 'P') stats.P++;
                        else if (status === 'HD') stats.P += 0.5;
                        else if (status === 'L') stats.L++;
                        else if (status === 'E') stats.P++;
                        else if (status === 'A') stats.A++;
                    } else if (dayRegularization || dbStatus === 'regularized' || dbStatus === 'r' || firstLog.punch_source === 'regularization') {
                        status = 'R';
                        stats.P++;
                    } else if (firstLog.punch_source === 'entry_request' || dayEarlyOut) {
                        if (dbStatus === 'half-day' || dbStatus === 'half_day' || dbStatus === 'hd') {
                            status = 'HD';
                            stats.P += 0.5;
                        } else if (dbStatus === 'late-in' || dbStatus === 'late_in' || dbStatus === 'late' || dbStatus === 'l') {
                            status = 'L';
                            stats.L++;
                        } else if (dbStatus === 'present' || dbStatus === 'p') {
                            status = 'P';
                            stats.P++;
                        } else if (dbStatus === 'absent' || dbStatus === 'a') {
                            status = 'A';
                            stats.A++;
                        } else if (dbStatus === 'early-out' || dbStatus === 'early_out' || dbStatus === 'eo' || dbStatus === 'e') {
                            status = 'E';
                            stats.P++;
                        } else {
                            status = 'E';
                            stats.P++;
                        }
                    } else if (dbStatus === 'absent' || dbStatus === 'a') {
                        status = 'A';
                        stats.A++;
                    } else if (dbStatus === 'off') {
                        status = 'OFF';
                        stats.OFF++;
                    } else if (dbStatus === 'half-day' || dbStatus === 'half_day' || dbStatus === 'hd') {
                        status = 'HD';
                        stats.P += 0.5;
                    } else if (dbStatus === 'early-out' || dbStatus === 'early_out' || dbStatus === 'eo' || dbStatus === 'e') {
                        status = 'E';
                        stats.P++;
                    } else if (dbStatus === 'short') {
                        status = 'A';
                        stats.A++;
                    } else if (emp.shift_is_flexi) {
                        status = 'P';
                        stats.P++;
                    } else {
                        // Compute status using split-shift helper
                        const calc = calculateSplitShiftStatus(dayLogs, emp, rules);
                        status = calc.status;
                        if (status === 'P') stats.P++;
                        else if (status === 'HD') stats.P += 0.5;
                        else if (status === 'L') stats.L++;
                        else if (status === 'E') stats.P++; // Early out still counts as present/hours completed
                        else if (status === 'A') stats.A++;
                    }
                } else if (dayRegularization) {
                    status = 'R';
                    stats.P++;
                } else if (dayEarlyOut) {
                    status = 'E';
                    stats.P++;
                } else {
                    // C. Check Leaves
                    const onLeave = raw.leaves.find(l =>
                        l.employee_id === emp.id &&
                        new Date(l.start_date) <= date &&
                        new Date(l.end_date) >= date
                    );

                    if (onLeave) {
                        const isPaid = !onLeave.leave_type_name.toLowerCase().includes('unpaid') &&
                            !onLeave.leave_type_name.toLowerCase().includes('lop');
                        status = isPaid ? 'PL' : 'UL';
                        if (isPaid) stats.PL++; else stats.UL++;
                    } else {
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        if (date < today) {
                            status = 'A'; // Absent
                            stats.A++;
                        }
                    }
                }
                let in1 = null, out1 = null, in2 = null, out2 = null;
                let isGrace = false;

                const timeToMinsLocal = (timeStr) => {
                    if (!timeStr) return 0;
                    const [h, m] = timeStr.split(':').map(Number);
                    return h * 60 + m;
                };
                const dateToMinsLocal = (dateVal) => {
                    if (!dateVal) return 0;
                    const dObj = new Date(dateVal);
                    return dObj.getHours() * 60 + dObj.getMinutes();
                };

                const reqPunches = parseInt(emp.shift_total_punches || 2);
                if (dayLogs && dayLogs.length > 0) {
                    const s1Start = timeToMinsLocal(emp.shift_start || '09:00');
                    const grace1In = parseInt(emp.shift_grace || rules.grace_period || 15);

                    if (reqPunches === 4) {
                        const s2Start = timeToMinsLocal(emp.shift_session2_start || '14:00');
                        const grace2In = parseInt(emp.shift_session2_grace_in || 15);
                        const s2InMargin = parseInt(emp.shift_session2_in_margin || 30);

                        const s1Logs = dayLogs.filter(log => dateToMinsLocal(log.check_in) < (s2Start - s2InMargin));
                        const s2Logs = dayLogs.filter(log => dateToMinsLocal(log.check_in) >= (s2Start - s2InMargin));

                        if (s1Logs[0]) {
                            in1 = s1Logs[0].check_in;
                            out1 = s1Logs[0].check_out;
                            const inMins1 = dateToMinsLocal(s1Logs[0].check_in);
                            if (inMins1 > s1Start && inMins1 <= (s1Start + grace1In)) {
                                isGrace = true;
                            }
                        }
                        if (s2Logs[0]) {
                            in2 = s2Logs[0].check_in;
                            out2 = s2Logs[0].check_out;
                            const inMins2 = dateToMinsLocal(s2Logs[0].check_in);
                            if (inMins2 > s2Start && inMins2 <= (s2Start + grace2In)) {
                                isGrace = true;
                            }
                        }
                    } else {
                        if (dayLogs[0]) {
                            in1 = dayLogs[0].check_in;
                            out1 = dayLogs[0].check_out;
                            const inMins = dateToMinsLocal(dayLogs[0].check_in);
                            if (inMins > s1Start && inMins <= (s1Start + grace1In)) {
                                isGrace = true;
                            }
                        }
                    }
                }
                grid[d] = status;
                grid_timings[d] = { in1, out1, in2, out2 };
                grid_meta[d] = {
                    is_override: dayLogs.length > 0 && (dayLogs[0].punch_source === 'manual' || dayLogs[0].punch_source === 'manual_override'),
                    is_grace: isGrace
                };
            }

            return {
                id: emp.id,
                name: `${emp.first_name} ${emp.last_name}`,
                code: emp.employee_id_number,
                role: emp.designation,
                department: emp.department_name || 'General',
                location: emp.office_location || 'Unassigned',
                days: grid,
                timings: grid_timings,
                meta: grid_meta,
                stats
            };
        });

        return { matrix, days: daysInMonth };
    }
    async manualOverride(user, data) {
        // data: { employee_id, date, status, check_in, check_out }
        const { employee_id, date, status, check_in, check_out } = data;
        const companyId = user.company_id;
        const dbStatus = mapFrontendStatusToDb(status);

        // Check if record exists for that date
        const existing = await db('attendance')
            .where({ employee_id, company_id: companyId })
            .whereRaw('DATE(check_in) = ?', [date])
            .first();

        if (existing) {
            await db('attendance')
                .where({ id: existing.id })
                .update({
                    status: dbStatus,
                    check_in: check_in || existing.check_in,
                    check_out: check_out || existing.check_out,
                    punch_source: 'manual',
                    updated_at: db.fn.now()
                });
        } else {
            await db('attendance').insert({
                employee_id,
                company_id: companyId,
                status: dbStatus,
                check_in: check_in || `${date} 09:00:00`,
                check_out: check_out || `${date} 18:00:00`,
                punch_source: 'manual',
                created_at: db.fn.now()
            });
        }
        return { message: 'Attendance record updated successfully' };
    }
    async getWhosInStats(user, dateStr) {
        const companyId = user.company_id;

        // Robust Date Handling (Avoid UTC shifts for Local reporting)
        let dateObj;
        if (dateStr) {
            dateObj = new Date(dateStr);
            if (isNaN(dateObj.getTime())) dateObj = new Date();
        } else {
            dateObj = new Date();
        }

        const y = dateObj.getFullYear();
        const m = String(dateObj.getMonth() + 1).padStart(2, '0');
        const d = String(dateObj.getDate()).padStart(2, '0');
        const formattedDate = `${y}-${m}-${d}`;

        // 1. Fetch Company Rules (Fallback)
        const rules = await db('working_rules').where({ company_id: companyId }).first() || {
            shift_start: '09:00',
            grace_period: 15
        };

        // 2. Fetch All Employees with Shift Info and Scheme Info
        const employees = await db('employees')
            .leftJoin('shifts', 'employees.shift_id', 'shifts.id')
            .leftJoin('attendance_schemes', 'employees.attendance_scheme_id', 'attendance_schemes.id')
            .leftJoin('departments', 'employees.department_id', 'departments.id')
            .where({ 'employees.company_id': companyId, 'employees.status': 'active' })
            .select(
                'employees.id',
                'employees.first_name',
                'employees.last_name',
                'employees.employee_id_number',
                'employees.office_location',
                'employees.designation',
                'departments.name as department_name',
                'shifts.start_time as shift_start',
                'shifts.grace_period as shift_grace',
                'shifts.name as shift_name',
                'shifts.is_flexi as shift_is_flexi',
                'attendance_schemes.grace_period as scheme_grace'
            );

        // 3. Fetch Attendance for the target date
        const attendance = await db('attendance')
            .where({ company_id: companyId })
            .whereRaw('DATE(check_in) = ?', [formattedDate])
            .select(
                'employee_id',
                'check_in',
                'check_out',
                'status',
                'latitude',
                'longitude',
                'accuracy',
                'punch_location',
                'remarks',
                'out_latitude',
                'out_longitude',
                'out_accuracy',
                'out_punch_location',
                'out_remarks'
            );

        // 4. Fetch Leaves for the target date
        const leaves = await db('leaves')
            .where({ company_id: companyId, status: 'approved' })
            .where('start_date', '<=', formattedDate)
            .where('end_date', '>=', formattedDate)
            .select('employee_id');

        // Fetch shift assignments active on this specific date (order by ID descending to respect latest override)
        const assignments = await db('employee_shift_assignments as esa')
            .join('shifts as s', 'esa.shift_id', 's.id')
            .where('esa.company_id', companyId)
            .where('esa.from_date', '<=', formattedDate)
            .andWhere(function () {
                this.where('esa.to_date', '>=', formattedDate).orWhereNull('esa.to_date');
            })
            .select('esa.employee_id', 's.start_time', 's.grace_period', 's.name', 's.is_flexi')
            .orderBy('esa.id', 'desc');

        // 5. Categorize
        const onTime = [];
        const lateArrivals = [];
        const notYetIn = [];
        const onLeave = leaves.map(l => l.employee_id);

        for (const emp of employees) {
            if (onLeave.includes(emp.id)) continue;

            const record = attendance.find(a => a.employee_id === emp.id);

            // Resolve overridden shift
            const activeAssignment = assignments.find(a => a.employee_id === emp.id);

            // Determine if this employee is on a flexi/anytime shift
            const isFlexi = activeAssignment ? !!activeAssignment.is_flexi : !!emp.shift_is_flexi;

            const shiftStart = activeAssignment ? activeAssignment.start_time : (emp.shift_start || rules.shift_start);
            const grace = activeAssignment
                ? activeAssignment.grace_period
                : (emp.scheme_grace !== undefined && emp.scheme_grace !== null
                    ? emp.scheme_grace
                    : (emp.shift_grace !== undefined && emp.shift_grace !== null ? emp.shift_grace : rules.grace_period));
            const shiftName = activeAssignment ? activeAssignment.name : (emp.shift_name || 'General');

            if (!record) {
                notYetIn.push({
                    name: `${emp.first_name} ${emp.last_name}`,
                    id: emp.employee_id_number,
                    time: isFlexi ? 'Flexi' : shiftStart,
                    shift_name: shiftName,
                    office_location: emp.office_location || 'Unassigned',
                    designation: emp.designation || 'Staff',
                    department: emp.department_name || 'General'
                });
            } else {
                const checkIn = new Date(record.check_in);
                const timeStr = checkIn.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
                const checkOutTimeStr = record.check_out ? new Date(record.check_out).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : null;

                const baseEntry = {
                    name: `${emp.first_name} ${emp.last_name}`,
                    id: emp.employee_id_number,
                    time: timeStr,
                    shift_name: shiftName,
                    latitude: record.latitude,
                    longitude: record.longitude,
                    accuracy: record.accuracy,
                    punch_location: record.punch_location,
                    remarks: record.remarks,
                    out_latitude: record.out_latitude,
                    out_longitude: record.out_longitude,
                    out_accuracy: record.out_accuracy,
                    out_punch_location: record.out_punch_location,
                    out_remarks: record.out_remarks,
                    check_out: checkOutTimeStr,
                    office_location: emp.office_location || 'Unassigned',
                    designation: emp.designation || 'Staff',
                    department: emp.department_name || 'General'
                };

                // Flexi shift employees are always "On-Time" — no late calculation
                if (isFlexi) {
                    onTime.push({ ...baseEntry, early: 'Flexi' });
                } else {
                    const [sHours, sMins] = shiftStart.split(':').map(Number);
                    const shiftStartLimit = new Date(dateObj);
                    shiftStartLimit.setHours(sHours, sMins + (parseInt(grace) || 0), 0, 0);

                    const isLate = checkIn > shiftStartLimit;

                    if (isLate) {
                        const diffMs = checkIn - shiftStartLimit;
                        const lateMins = Math.floor(diffMs / 60000);
                        const lateHours = Math.floor(lateMins / 60);
                        const lateStr = `${String(lateHours).padStart(2, '0')}:${String(lateMins % 60).padStart(2, '0')}`;
                        lateArrivals.push({ ...baseEntry, late: lateStr });
                    } else {
                        const diffMs = shiftStartLimit - checkIn;
                        const earlyMins = Math.floor(diffMs / 60000);
                        const earlyHours = Math.floor(earlyMins / 60);
                        const earlyStr = `${String(earlyHours).padStart(2, '0')}:${String(earlyMins % 60).padStart(2, '0')}`;
                        onTime.push({ ...baseEntry, early: earlyStr });
                    }
                }
            }
        }

        const total = employees.length;
        return {
            summary: [
                { label: 'Not Yet In', count: notYetIn.length, percentage: total > 0 ? Math.round((notYetIn.length / total) * 100) + '%' : '0%', color: 'text-rose-500', bg: 'bg-rose-50' },
                { label: 'Late Arrivals', count: lateArrivals.length, percentage: total > 0 ? Math.round((lateArrivals.length / total) * 100) + '%' : '0%', color: 'text-amber-500', bg: 'bg-amber-50' },
                { label: 'On-Time', count: onTime.length, percentage: total > 0 ? Math.round((onTime.length / total) * 100) + '%' : '0%', color: 'text-emerald-500', bg: 'bg-emerald-50' },
                { label: 'Out of Office', count: onLeave.length, percentage: total > 0 ? Math.round((onLeave.length / total) * 100) + '%' : '0%', color: 'text-slate-400', bg: 'bg-slate-50' }
            ],
            notYetIn,
            lateArrivals,
            onTime,
            onLeaveCount: onLeave.length
        };
    }

    async getShifts(companyId) {
        return await db('shifts').where({ company_id: companyId });
    }

    async getEmployeesByShift(companyId, shiftId, fromDate, toDate) {
        // Fetch all active employees in the company with department/designation details
        const employees = await db('employees')
            .leftJoin('departments', 'employees.department_id', 'departments.id')
            .where({ 'employees.company_id': companyId, 'employees.status': 'active' })
            .select(
                'employees.id',
                'employees.first_name',
                'employees.last_name',
                'employees.employee_id_number',
                'employees.shift_id',
                'employees.office_location',
                'employees.designation',
                'departments.name as department_name'
            );

        // Fetch all shift assignments active during the period
        const assignments = await db('employee_shift_assignments')
            .where('company_id', companyId)
            .where('from_date', '<=', toDate || fromDate)
            .andWhere(function () {
                this.where('to_date', '>=', fromDate).orWhereNull('to_date');
            })
            .select('employee_id', 'shift_id', 'id')
            .orderBy('id', 'asc');

        // Map assignments to employee ID for easy lookup
        const assignmentMap = {};
        assignments.forEach(a => {
            assignmentMap[a.employee_id] = a.shift_id;
        });

        // Filter employees based on resolved shift
        const filtered = employees.filter(emp => {
            const resolvedShiftId = assignmentMap[emp.id] !== undefined ? assignmentMap[emp.id] : emp.shift_id;

            if (shiftId === 'all' || String(shiftId).toLowerCase() === 'all') {
                return true;
            }
            return String(resolvedShiftId) === String(shiftId);
        });

        return filtered.map(emp => ({
            id: emp.id,
            first_name: emp.first_name,
            last_name: emp.last_name,
            employee_id_number: emp.employee_id_number,
            office_location: emp.office_location,
            designation: emp.designation,
            department_name: emp.department_name
        }));
    }

    async shiftOverrideLogic(user, companyId, data) {
        const { employee_ids, from_date, to_date } = data;
        const start = new Date(from_date);
        const end = new Date(to_date || from_date);

        await db.transaction(async (trx) => {
            for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
                const dateStr = d.toISOString().split('T')[0];

                for (const empId of employee_ids) {
                    // Check existing attendance
                    const existing = await trx('attendance')
                        .where({ employee_id: empId, company_id: companyId })
                        .whereRaw('DATE(check_in) = ?', [dateStr])
                        .first();

                    if (!existing) {
                        // Mark Absent as Present
                        const [id] = await trx('attendance').insert({
                            employee_id: empId,
                            company_id: companyId,
                            check_in: `${dateStr} 09:00:00`,
                            check_out: `${dateStr} 18:00:00`,
                            status: 'present',
                            created_at: db.fn.now()
                        });

                        await this.logOverride(trx, user, empId, companyId, dateStr, 'A', 'P', 'Shift Bulk Override');
                    }
                }
            }
        });

        return { message: 'Override applied successfully' };
    }

    async getEmployeeAttendanceHistory(companyId, employeeId, from, to) {
        const attendance = await db('attendance')
            .where({ employee_id: employeeId, company_id: companyId })
            .whereRaw('DATE(check_in) >= ? AND DATE(check_in) <= ?', [from, to])
            .orderBy('check_in', 'asc');

        const shifts = await db('employee_shift_assignments as esa')
            .join('shifts as s', 'esa.shift_id', 's.id')
            .where({ 'esa.employee_id': employeeId })
            .select('s.name', 'esa.from_date', 'esa.to_date')
            .orderBy('esa.id', 'desc');

        const employee = await db('employees as e')
            .leftJoin('shifts as s', 'e.shift_id', 's.id')
            .where('e.id', employeeId)
            .select('s.name as default_shift_name')
            .first();
        const defaultShiftName = employee?.default_shift_name || '---';

        // Map into a daily sheet
        const start = new Date(from);
        const end = new Date(to);
        const sheet = [];

        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            const dateStr = toLocalYMD(d);
            const dayLogs = attendance.filter(a => toLocalYMD(a.check_in) === dateStr);
            const record = dayLogs[0]; // fallback/primary status record
            const shift = shifts.find(s => {
                const fromStr = toLocalYMD(s.from_date);
                const toStr = toLocalYMD(s.to_date);
                return dateStr >= fromStr && (!toStr || dateStr <= toStr);
            });

            const s1Ms = dayLogs[0] && dayLogs[0].check_out ? (new Date(dayLogs[0].check_out) - new Date(dayLogs[0].check_in)) : 0;
            const s2Ms = dayLogs[1] && dayLogs[1].check_out ? (new Date(dayLogs[1].check_out) - new Date(dayLogs[1].check_in)) : 0;

            sheet.push({
                date: dateStr,
                shift_code: shift?.name || defaultShiftName,
                status: mapDbStatusToFrontend(record ? (record.status || 'present') : 'A'),
                first_in: dayLogs[0] ? safeFormatTime(dayLogs[0].check_in) : null,
                last_out: dayLogs[dayLogs.length - 1] ? safeFormatTime(dayLogs[dayLogs.length - 1].check_out) : null,
                session1: s1Ms > 0 ? `${(s1Ms / 3600000).toFixed(1)}h` : '0.0h',
                session2: s2Ms > 0 ? `${(s2Ms / 3600000).toFixed(1)}h` : '0.0h'
            });
        }
        return sheet;
    }

    async getDateWiseAttendance(companyId, date) {
        const employees = await db('employees')
            .leftJoin('departments', 'employees.department_id', 'departments.id')
            .where({ 'employees.company_id': companyId })
            .select(
                'employees.id',
                'employees.first_name',
                'employees.last_name',
                'employees.employee_id_number',
                'employees.shift_id',
                'employees.office_location',
                'employees.designation',
                'departments.name as department_name'
            );

        // Fetch shift assignments active on this specific date (order by ID descending to respect latest override)
        const assignments = await db('employee_shift_assignments as esa')
            .join('shifts as s', 'esa.shift_id', 's.id')
            .where('esa.company_id', companyId)
            .where('esa.from_date', '<=', date)
            .andWhere(function () {
                this.where('esa.to_date', '>=', date).orWhereNull('esa.to_date');
            })
            .select('esa.employee_id', 's.name as shift_name')
            .orderBy('esa.id', 'desc');

        const shifts = await db('shifts').where({ company_id: companyId });

        const attendance = await db('attendance')
            .where({ company_id: companyId })
            .whereRaw('DATE(check_in) = ?', [date]);

        return employees.map(emp => {
            const empLogs = attendance.filter(a => a.employee_id === emp.id);
            const record = empLogs[0];
            const activeAssignment = assignments.find(a => a.employee_id === emp.id);
            const defaultShift = shifts.find(s => s.id === emp.shift_id);
            const shiftName = activeAssignment?.shift_name || defaultShift?.name || '---';

            const s1Ms = empLogs[0] && empLogs[0].check_out ? (new Date(empLogs[0].check_out) - new Date(empLogs[0].check_in)) : 0;
            const s2Ms = empLogs[1] && empLogs[1].check_out ? (new Date(empLogs[1].check_out) - new Date(empLogs[1].check_in)) : 0;

            return {
                id: emp.id,
                first_name: emp.first_name,
                last_name: emp.last_name,
                employee_id_number: emp.employee_id_number,
                office_location: emp.office_location,
                designation: emp.designation,
                department_name: emp.department_name,
                shift_name: shiftName,
                shift_code: shiftName,
                status: mapDbStatusToFrontend(record ? (record.status || 'present') : 'A'),
                first_in: empLogs[0] ? safeFormatTime(empLogs[0].check_in) : null,
                last_out: empLogs[empLogs.length - 1] ? safeFormatTime(empLogs[empLogs.length - 1].check_out) : null,
                session1: s1Ms > 0 ? `${(s1Ms / 3600000).toFixed(1)}h` : '0.0h',
                session2: s2Ms > 0 ? `${(s2Ms / 3600000).toFixed(1)}h` : '0.0h'
            };
        });
    }

    async manualUpdateAttendance(user, companyId, data) {
        const { employee_id, date, status } = data;
        const dbStatus = mapFrontendStatusToDb(status);

        await db.transaction(async (trx) => {
            const existing = await trx('attendance')
                .where({ employee_id, company_id: companyId })
                .whereRaw('DATE(check_in) = ?', [date])
                .first();

            const prevStatus = existing?.status || 'absent';

            if (existing) {
                await trx('attendance')
                    .where({ id: existing.id })
                    .update({
                        status: dbStatus,
                        punch_source: 'manual',
                        updated_at: db.fn.now()
                    });
            } else {
                await trx('attendance').insert({
                    employee_id,
                    company_id: companyId,
                    check_in: `${date} 09:00:00`,
                    check_out: `${date} 18:00:00`,
                    status: dbStatus,
                    punch_source: 'manual',
                    created_at: db.fn.now()
                });
            }

            await this.logOverride(trx, user, employee_id, companyId, date, mapDbStatusToFrontend(prevStatus), status, 'Manual Individual Update');
        });

        return { message: 'Attendance updated successfully' };
    }

    async logOverride(trx, user, employeeId, companyId, attendanceDate, prevStatus, newStatus, type) {
        // Ensure history table exists (Lazy check)
        const hasTable = await trx.schema.hasTable('attendance_override_history');
        if (!hasTable) {
            await trx.schema.createTable('attendance_override_history', table => {
                table.increments('id').primary();
                table.integer('company_id').notNullable();
                table.integer('employee_id').notNullable();
                table.string('attendance_date').notNullable();
                table.string('previous_status');
                table.string('updated_status');
                table.string('override_type');
                table.string('overridden_by_name');
                table.timestamp('created_at').defaultTo(db.fn.now());
            });
        }

        let operatorName = user?.full_name || 'Admin';
        if (user?.id) {
            const operatorEmployee = await trx('employees')
                .where({ user_id: user.id })
                .select('first_name', 'last_name')
                .first();
            if (operatorEmployee) {
                operatorName = `${operatorEmployee.first_name} ${operatorEmployee.last_name}`.trim();
            }
        }

        await trx('attendance_override_history').insert({
            company_id: companyId,
            employee_id: employeeId,
            attendance_date: attendanceDate,
            previous_status: prevStatus,
            updated_status: newStatus,
            override_type: type,
            overridden_by_name: operatorName
        });
    }

    async getOverrideHistory(companyId) {
        const history = await db('attendance_override_history as h')
            .join('employees as e', 'h.employee_id', 'e.id')
            .join('companies as c', 'h.company_id', 'c.id')
            .where('h.company_id', companyId)
            .select(
                'e.first_name', 'e.last_name', 'e.employee_id_number as employee_id',
                'c.name as company_name',
                'h.previous_status', 'h.updated_status', 'h.override_type',
                'h.attendance_date', 'h.overridden_by_name as overridden_by',
                'h.created_at'
            )
            .orderBy('h.created_at', 'desc');

        return history.map(h => ({
            ...h,
            employee_name: `${h.first_name} ${h.last_name}`
        }));
    }

    async getEligibleEmployees(companyId) {
        console.log('>>> [DEBUG]: Fetching Eligible Employees for Company:', companyId);
        const today = new Date().toISOString().split('T')[0];

        // Fetch all employees with department/designation details
        const employees = await db('employees')
            .leftJoin('departments', 'employees.department_id', 'departments.id')
            .where({ 'employees.company_id': companyId })
            .select(
                'employees.id',
                'employees.first_name',
                'employees.last_name',
                'employees.employee_id_number',
                'employees.status',
                'employees.office_location',
                'employees.designation',
                'departments.name as department_name'
            );

        console.log(`>>> [DEBUG]: Found ${employees.length} employees`);

        // Fetch current shift assignments
        const assignments = await db('employee_shift_assignments')
            .join('shifts', 'employee_shift_assignments.shift_id', 'shifts.id')
            .where('employee_shift_assignments.company_id', companyId)
            .where('from_date', '<=', today)
            .andWhere(function () {
                this.where('to_date', '>=', today).orWhereNull('to_date');
            })
            .select('employee_id', 'shifts.name as shift_name');

        const assignmentMap = {};
        assignments.forEach(a => {
            assignmentMap[a.employee_id] = a.shift_name;
        });

        return employees.map(emp => ({
            ...emp,
            assigned_shift: assignmentMap[emp.id] || null
        }));
    }
    async assignShift(user, companyId, data) {
        const { employee_ids, shift_id, from_date, to_date } = data;

        if (!employee_ids || !shift_id || !from_date) {
            throw new Error('Employees, Shift, and From Date are required');
        }

        const ids = Array.isArray(employee_ids) ? employee_ids : [employee_ids];

        // 1. Transactional Update
        await db.transaction(async (trx) => {
            for (const empId of ids) {
                // Check for overlapping assignments if needed, for now we just append
                // or we could replace existing one for the same period.
                // Requirement: Employees with assigned shifts should NOT be selectable in UI.
                // So here we assume they are fresh.
                await trx('employee_shift_assignments').insert({
                    company_id: companyId,
                    employee_id: empId,
                    shift_id,
                    from_date,
                    to_date: to_date || null
                });

                // Backward compatibility: update current shift_id in employees table if this is "Permanent" or "Latest"
                if (!to_date) {
                    await trx('employees').where({ id: empId }).update({ shift_id });
                }
            }
        });

        return { message: 'Shifts assigned successfully' };
    }
    async createShift(companyId, data) {
        const {
            name, start_time, end_time, grace_period, grace_count_limit, is_night_shift, is_flexi, min_hours,
            total_punches_required, session2_start_time, session2_end_time,
            session1_grace_out, session2_grace_in, session2_grace_out,
            session1_in_margin, session1_out_margin, session2_in_margin, session2_out_margin
        } = data;

        // For flexi shifts, start/end time are optional (informational only)
        if (!name) {
            throw new Error('Shift Name is required');
        }
        if (!is_flexi && (!start_time || !end_time)) {
            throw new Error('Name, Start Time, and End Time are required');
        }

        const [id] = await db('shifts').insert({
            company_id: companyId,
            name,
            start_time: start_time || '09:00',
            end_time: end_time || '18:00',
            grace_period: grace_period !== undefined ? grace_period : 15,
            grace_count_limit: grace_count_limit !== undefined ? grace_count_limit : 3,
            is_night_shift: !!is_night_shift,
            is_flexi: !!is_flexi,
            min_hours: min_hours !== undefined && min_hours !== null ? parseFloat(min_hours) : 8.0,
            total_punches_required: total_punches_required !== undefined ? parseInt(total_punches_required) : 2,
            session2_start_time: session2_start_time || null,
            session2_end_time: session2_end_time || null,
            session1_grace_out: session1_grace_out !== undefined ? parseInt(session1_grace_out) : 0,
            session2_grace_in: session2_grace_in !== undefined ? parseInt(session2_grace_in) : 15,
            session2_grace_out: session2_grace_out !== undefined ? parseInt(session2_grace_out) : 0,
            session1_in_margin: session1_in_margin !== undefined ? parseInt(session1_in_margin) : 0,
            session1_out_margin: session1_out_margin !== undefined ? parseInt(session1_out_margin) : 0,
            session2_in_margin: session2_in_margin !== undefined ? parseInt(session2_in_margin) : 0,
            session2_out_margin: session2_out_margin !== undefined ? parseInt(session2_out_margin) : 0,
            created_at: db.fn.now(),
            updated_at: db.fn.now()
        });

        return { id, message: 'Shift created successfully' };
    }

    async updateShift(companyId, id, data) {
        const {
            name, start_time, end_time, grace_period, grace_count_limit, is_night_shift, is_flexi, min_hours,
            total_punches_required, session2_start_time, session2_end_time,
            session1_grace_out, session2_grace_in, session2_grace_out,
            session1_in_margin, session1_out_margin, session2_in_margin, session2_out_margin
        } = data;

        if (!id) {
            throw new Error('Shift ID is required');
        }

        await db('shifts')
            .where({ company_id: companyId, id })
            .update({
                name,
                start_time: start_time || '09:00',
                end_time: end_time || '18:00',
                grace_period: grace_period !== undefined ? grace_period : 15,
                grace_count_limit: grace_count_limit !== undefined ? grace_count_limit : 3,
                is_night_shift: !!is_night_shift,
                is_flexi: !!is_flexi,
                min_hours: min_hours !== undefined && min_hours !== null ? parseFloat(min_hours) : 8.0,
                total_punches_required: total_punches_required !== undefined ? parseInt(total_punches_required) : 2,
                session2_start_time: session2_start_time || null,
                session2_end_time: session2_end_time || null,
                session1_grace_out: session1_grace_out !== undefined ? parseInt(session1_grace_out) : 0,
                session2_grace_in: session2_grace_in !== undefined ? parseInt(session2_grace_in) : 15,
                session2_grace_out: session2_grace_out !== undefined ? parseInt(session2_grace_out) : 0,
                session1_in_margin: session1_in_margin !== undefined ? parseInt(session1_in_margin) : 0,
                session1_out_margin: session1_out_margin !== undefined ? parseInt(session1_out_margin) : 0,
                session2_in_margin: session2_in_margin !== undefined ? parseInt(session2_in_margin) : 0,
                session2_out_margin: session2_out_margin !== undefined ? parseInt(session2_out_margin) : 0,
                updated_at: db.fn.now()
            });

        return { message: 'Shift updated successfully' };
    }

    async deleteShift(companyId, id) {
        if (!id) {
            throw new Error('Shift ID is required');
        }

        // Safety: update employees referencing this shift to null
        await db('employees')
            .where({ company_id: companyId, shift_id: id })
            .update({ shift_id: null });

        // Clean up assignment periods for this shift
        await db('employee_shift_assignments')
            .where({ company_id: companyId, shift_id: id })
            .del();

        // Delete shift record
        await db('shifts')
            .where({ company_id: companyId, id })
            .del();

        return { message: 'Shift deleted successfully' };
    }

    async getShiftRoster(companyId, month, year, filters = {}) {
        const daysInMonth = new Date(year, month, 0).getDate();
        const fromDate = `${year}-${String(month).padStart(2, '0')}-01`;
        const toDate = `${year}-${String(month).padStart(2, '0')}-${daysInMonth}`;

        // 1. Get employees (joined with shifts, attendance_schemes and departments)
        let employeeQuery = db('employees as e')
            .leftJoin('shifts as s', 'e.shift_id', 's.id')
            .leftJoin('attendance_schemes as asch', 'e.attendance_scheme_id', 'asch.id')
            .leftJoin('departments as d', 'e.department_id', 'd.id');

        if (companyId) {
            employeeQuery = employeeQuery.where({ 'e.company_id': companyId });
        }

        if (filters.employee_id && filters.employee_id !== 'All') {
            employeeQuery = employeeQuery.where('e.id', filters.employee_id);
        }

        let employees = await employeeQuery.select(
            'e.id',
            'e.first_name',
            'e.last_name',
            'e.employee_id_number',
            'e.designation',
            'e.office_location as location',
            'e.department_id',
            's.name as default_shift_name',
            'asch.weekoffs as scheme_weekoffs',
            'asch.name as scheme_name',
            'asch.id as scheme_id',
            'd.name as department_name'
        );

        // Demo fallback for immediate visibility
        if (employees.length === 0) {
            employees = [
                { id: 101, first_name: 'Aashi', last_name: 'Chaurasia', employee_id_number: '2011341', designation: 'HR Intern', location: 'Jaipur', default_shift_name: 'General Shift', scheme_weekoffs: '["Sunday"]', scheme_id: 1, scheme_name: 'Default Attendance Cycle', department_id: 1, department_name: 'Human Resources' },
                { id: 102, first_name: 'Ayushi', last_name: 'Gupta', employee_id_number: '2011342', designation: 'HR Intern', location: 'Jaipur', default_shift_name: 'General Shift', scheme_weekoffs: '["Sunday"]', scheme_id: 1, scheme_name: 'Default Attendance Cycle', department_id: 1, department_name: 'Human Resources' },
                { id: 103, first_name: 'Komal', last_name: 'Saini', employee_id_number: '2011344', designation: 'Front Office', location: 'Jaipur', default_shift_name: 'General Shift', scheme_weekoffs: '["Sunday"]', scheme_id: 1, scheme_name: 'Default Attendance Cycle', department_id: 2, department_name: 'Front Office' },
                { id: 104, first_name: 'Kanisk', last_name: 'Kumar Singh', employee_id_number: '2011345', designation: 'HR Intern', location: 'Jaipur', default_shift_name: 'General Shift', scheme_weekoffs: '["Sunday"]', scheme_id: 1, scheme_name: 'Default Attendance Cycle', department_id: 1, department_name: 'Human Resources' },
                { id: 105, first_name: 'Sony', last_name: 'Kumari', employee_id_number: '2011346', designation: 'HR Intern', location: 'Jaipur', default_shift_name: 'General Shift', scheme_weekoffs: '["Sunday"]', scheme_id: 1, scheme_name: 'Default Attendance Cycle', department_id: 1, department_name: 'Human Resources' }
            ];
        }

        // Fetch company rules
        const rules = await db('working_rules').where({ company_id: companyId }).first() || {
            weekoffs: JSON.stringify(['Sunday'])
        };
        const companyWeekoffs = typeof rules.weekoffs === 'string' ? JSON.parse(rules.weekoffs) : (rules.weekoffs || []);

        // Fetch corporate holidays
        const holidays = await db('holidays')
            .where({ company_id: companyId })
            .whereRaw('MONTH(date) = ? AND YEAR(date) = ?', [month, year]);

        // Fetch weekend overrides
        const weekendOverrides = await db('weekend_overrides')
            .where({ company_id: companyId })
            .whereRaw('MONTH(override_date) = ? AND YEAR(override_date) = ?', [month, year]);

        // Fetch approved leaves
        const employeeIds = employees.map(emp => emp.id);
        const leaves = await db('leaves as l')
            .join('leave_types as lt', 'l.leave_type_id', 'lt.id')
            .whereIn('l.employee_id', employeeIds)
            .where({ 'l.status': 'approved' })
            .whereRaw('(MONTH(l.start_date) = ? OR MONTH(l.end_date) = ?) AND (YEAR(l.start_date) = ? OR YEAR(l.end_date) = ?)', [month, month, year, year])
            .select('l.employee_id', 'l.start_date', 'l.end_date', 'lt.name as leave_type_name');

        // Fetch manual overrides / attendance status
        const attendance = await db('attendance')
            .whereIn('employee_id', employeeIds)
            .whereRaw('MONTH(check_in) = ? AND YEAR(check_in) = ?', [month, year])
            .select('employee_id', 'check_in', 'status');

        // 2. Get shift assignments
        const qb = db('employee_shift_assignments as esa')
            .join('shifts as s', 'esa.shift_id', 's.id')
            .where('esa.from_date', '<=', toDate)
            .andWhere(function () {
                this.where('esa.to_date', '>=', fromDate).orWhereNull('esa.to_date');
            });

        if (companyId) {
            qb.where('esa.company_id', companyId);
        }

        const assignmentList = await qb.select('esa.id', 'esa.employee_id', 'esa.from_date', 'esa.to_date', 's.name')
            .orderBy('esa.id', 'desc');

        // Helper to format date to YYYY-MM-DD in local time
        const toLocalYMD = (dateVal) => {
            if (!dateVal) return null;
            const d = new Date(dateVal);
            if (isNaN(d.getTime())) return null;
            const y = d.getFullYear();
            const m = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            return `${y}-${m}-${day}`;
        };

        // 3. Build Roster Matrix
        const roster = employees.map(emp => {
            const empAssignments = assignmentList.filter(a => a.employee_id === emp.id);
            const empWeekoffs = emp.scheme_weekoffs
                ? (typeof emp.scheme_weekoffs === 'string' ? JSON.parse(emp.scheme_weekoffs) : emp.scheme_weekoffs)
                : companyWeekoffs;
            const empLeaves = leaves.filter(l => l.employee_id === emp.id);
            const empAttendance = attendance.filter(a => a.employee_id === emp.id);
            const empWeekendOverrides = weekendOverrides.filter(wo => wo.employee_id === emp.id);

            const days = {};
            let wd = 0;
            let off = 0;

            for (let d = 1; d <= daysInMonth; d++) {
                const dateObj = new Date(year, month - 1, d);
                const targetDateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dateObj.getDay()];

                // A. Check Holiday
                const isHoliday = holidays.some(h => toLocalYMD(h.date) === targetDateStr);
                if (isHoliday) {
                    days[d] = 'H';
                    off++;
                    continue;
                }

                // B. Check Weekend Override
                const weekendOverride = empWeekendOverrides.find(wo => toLocalYMD(wo.override_date) === targetDateStr);
                if (weekendOverride) {
                    if (weekendOverride.override_type === 'off') {
                        days[d] = 'OFF';
                        off++;
                        continue;
                    }
                    // If weekendOverride.override_type === 'working', it skips the standard week-off check
                }

                // C. Check Standard Week-off (only if no 'working' weekend override exists)
                const isStandardWeekoff = empWeekoffs.includes(dayName);
                if (isStandardWeekoff && (!weekendOverride || weekendOverride.override_type !== 'working')) {
                    days[d] = 'OFF';
                    off++;
                    continue;
                }

                // D. Check Approved Leaves
                const onLeave = empLeaves.some(l => {
                    const fromStr = toLocalYMD(l.start_date);
                    const toStr = toLocalYMD(l.end_date);
                    return targetDateStr >= fromStr && targetDateStr <= toStr;
                });
                if (onLeave) {
                    days[d] = 'OFF';
                    off++;
                    continue;
                }

                // E. Check Manual Override / Attendance Status
                const dayAtt = empAttendance.find(a => toLocalYMD(a.check_in) === targetDateStr);
                if (dayAtt && (dayAtt.status === 'off' || dayAtt.status === 'leave')) {
                    days[d] = 'OFF';
                    off++;
                    continue;
                }

                // F. Demo shift data if no assignments exist for demo employees
                if (empAssignments.length === 0 && emp.id >= 101 && emp.id <= 105) {
                    days[d] = '10-6';
                    wd++;
                    continue;
                }

                // G. Check Shift Assignments
                const assignment = empAssignments.find(a => {
                    const fromStr = toLocalYMD(a.from_date);
                    const toStr = a.to_date ? toLocalYMD(a.to_date) : null;
                    return targetDateStr >= fromStr && (!toStr || targetDateStr <= toStr);
                });

                if (assignment) {
                    days[d] = assignment.name;
                    wd++;
                } else {
                    // Fall back to employee's default shift
                    if (emp.default_shift_name) {
                        days[d] = emp.default_shift_name;
                        wd++;
                    } else {
                        days[d] = '---';
                    }
                }
            }

            return {
                id: emp.id,
                first_name: emp.first_name,
                last_name: emp.last_name,
                employee_id_number: emp.employee_id_number,
                designation: emp.designation,
                location: emp.location,
                department_id: emp.department_id,
                department_name: emp.department_name,
                scheme_id: emp.scheme_id,
                scheme_name: emp.scheme_name,
                wd,
                off,
                days
            };
        });

        return { roster, daysInMonth };
    }

    async getDayDetail(companyId, employeeId, dateStr) {
        if (!employeeId || !dateStr) {
            throw new Error('Employee ID and date are required');
        }

        // 1. Fetch Employee
        const emp = await db('employees as e')
            .leftJoin('shifts as s', 'e.shift_id', 's.id')
            .leftJoin('attendance_schemes as asch', 'e.attendance_scheme_id', 'asch.id')
            .where({ 'e.id': employeeId, 'e.company_id': companyId })
            .select(
                'e.id', 'e.first_name', 'e.last_name', 'e.employee_id_number', 'e.designation', 'e.city as location',
                's.name as default_shift_name', 's.start_time as default_shift_start', 's.end_time as default_shift_end',
                's.total_punches_required as default_shift_total_punches',
                's.session2_start_time as default_shift_session2_start',
                's.session2_end_time as default_shift_session2_end',
                's.grace_period as default_shift_grace_period',
                's.session1_grace_out as default_shift_session1_grace_out',
                's.session2_grace_in as default_shift_session2_grace_in',
                's.session2_grace_out as default_shift_session2_grace_out',
                's.session1_in_margin as default_shift_session1_in_margin',
                's.session1_out_margin as default_shift_session1_out_margin',
                's.session2_in_margin as default_shift_session2_in_margin',
                's.session2_out_margin as default_shift_session2_out_margin',
                'asch.weekoffs as scheme_weekoffs'
            )
            .first();

        if (!emp) {
            throw new Error('Employee not found');
        }

        // 2. Resolve Weekoff
        const rules = await db('working_rules').where({ company_id: companyId }).first() || {
            weekoffs: JSON.stringify(['Sunday'])
        };
        const companyWeekoffs = typeof rules.weekoffs === 'string' ? JSON.parse(rules.weekoffs) : (rules.weekoffs || []);
        const empWeekoffs = emp.scheme_weekoffs
            ? (typeof emp.scheme_weekoffs === 'string' ? JSON.parse(emp.scheme_weekoffs) : emp.scheme_weekoffs)
            : companyWeekoffs;

        const dateObj = new Date(dateStr);
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const dayName = dayNames[dateObj.getDay()];
        const isStandardWeekoff = empWeekoffs.includes(dayName);

        // 3. Fetch Holiday
        const holiday = await db('holidays')
            .where({ company_id: companyId, date: dateStr })
            .first();

        // 4. Fetch Weekend Override
        const weekendOverride = await db('weekend_overrides as wo')
            .leftJoin('employees as creator', 'wo.created_by', 'creator.id')
            .where({ 'wo.company_id': companyId, 'wo.employee_id': employeeId, 'wo.override_date': dateStr })
            .select(
                'wo.override_type', 'wo.reason', 'wo.created_at',
                'creator.first_name as created_by_first_name', 'creator.last_name as created_by_last_name'
            )
            .first();

        // 5. Fetch All Attendance logs
        const attendanceLogs = await db('attendance')
            .where({ employee_id: employeeId, company_id: companyId })
            .whereRaw('DATE(check_in) = ?', [dateStr])
            .orderBy('check_in', 'asc');

        const attendance = attendanceLogs[0] || null;

        // 6. Fetch Leave
        const leave = await db('leaves as l')
            .join('leave_types as lt', 'l.leave_type_id', 'lt.id')
            .leftJoin('employees as approver', 'l.approved_by', 'approver.id')
            .where('l.employee_id', employeeId)
            .where('l.company_id', companyId)
            .where('l.status', 'approved')
            .where('l.start_date', '<=', dateStr)
            .where('l.end_date', '>=', dateStr)
            .select(
                'l.id', 'l.reason', 'l.created_at', 'l.start_date', 'l.end_date', 'l.status',
                'lt.name as leave_type_name', 'lt.color as leave_type_color',
                'approver.first_name as approved_by_first_name', 'approver.last_name as approved_by_last_name'
            )
            .first();

        // 7. Fetch Regularization
        const regularization = await db('attendance_regularizations as r')
            .leftJoin('users as u', 'r.approved_by', 'u.id')
            .leftJoin('employees as approver', 'u.id', 'approver.user_id')
            .leftJoin('roles as rlt', 'u.role_id', 'rlt.id')
            .where('r.employee_id', employeeId)
            .where('r.company_id', companyId)
            .where('r.date', dateStr)
            .select(
                'r.id', 'r.reason', 'r.status', 'r.check_in as req_check_in', 'r.check_out as req_check_out', 'r.created_at',
                'approver.first_name as approved_by_first_name', 'approver.last_name as approved_by_last_name',
                'rlt.name as approver_role', 'u.email as approver_email'
            )
            .first();

        // 7b. Fetch Entry/Exit Requests (Late In/Early Out)
        const entryRequest = await db('attendance_entry_requests as er')
            .leftJoin('users as u', 'er.approved_by', 'u.id')
            .leftJoin('employees as approver', 'u.id', 'approver.user_id')
            .leftJoin('roles as rlt', 'u.role_id', 'rlt.id')
            .where('er.employee_id', employeeId)
            .where('er.company_id', companyId)
            .where('er.date', dateStr)
            .select(
                'er.id', 'er.request_type', 'er.punch_time', 'er.status', 'er.created_at',
                'approver.first_name as approved_by_first_name', 'approver.last_name as approved_by_last_name',
                'rlt.name as approver_role', 'u.email as approver_email'
            )
            .first();

        // 8. Fetch Override History
        const overrideHistory = await db('attendance_override_history')
            .where({ employee_id: employeeId, company_id: companyId, attendance_date: dateStr })
            .orderBy('id', 'desc')
            .first();

        // 9. Fetch Active Shift for the date
        const assignments = await db('employee_shift_assignments as esa')
            .join('shifts as s', 'esa.shift_id', 's.id')
            .where('esa.employee_id', employeeId)
            .where('esa.from_date', '<=', dateStr)
            .andWhere(function () {
                this.where('esa.to_date', '>=', dateStr).orWhereNull('esa.to_date');
            })
            .select(
                's.name', 's.start_time', 's.end_time', 's.total_punches_required',
                's.session2_start_time', 's.session2_end_time', 's.grace_period',
                's.session1_grace_out', 's.session2_grace_in', 's.session2_grace_out',
                's.session1_in_margin', 's.session1_out_margin', 's.session2_in_margin', 's.session2_out_margin'
            )
            .orderBy('esa.id', 'desc')
            .first();

        const activeShift = assignments || {
            name: emp.default_shift_name || 'General Shift',
            start_time: emp.default_shift_start || '09:00',
            end_time: emp.default_shift_end || '18:00',
            total_punches_required: emp.default_shift_total_punches || 2,
            session2_start_time: emp.default_shift_session2_start || null,
            session2_end_time: emp.default_shift_session2_end || null,
            grace_period: emp.default_shift_grace_period || 15,
            session1_grace_out: emp.default_shift_session1_grace_out || 0,
            session2_grace_in: emp.default_shift_session2_grace_in || 15,
            session2_grace_out: emp.default_shift_session2_grace_out || 0,
            session1_in_margin: emp.default_shift_session1_in_margin || 0,
            session1_out_margin: emp.default_shift_session1_out_margin || 0,
            session2_in_margin: emp.default_shift_session2_in_margin || 0,
            session2_out_margin: emp.default_shift_session2_out_margin || 0
        };

        let splitShiftDetails = null;
        if (attendanceLogs.length > 0) {
            splitShiftDetails = calculateSplitShiftStatus(attendanceLogs, activeShift, rules);
            if (attendance && (attendance.punch_source === 'manual' || attendance.punch_source === 'manual_override')) {
                splitShiftDetails.status = mapDbStatusToFrontend(attendance.status);
            }
        }

        return {
            employee: {
                id: emp.id,
                name: `${emp.first_name} ${emp.last_name}`,
                code: emp.employee_id_number,
                designation: emp.designation,
                location: emp.location
            },
            date: dateStr,
            day_name: dayName,
            is_weekoff: isStandardWeekoff,
            active_shift: activeShift,
            split_shift_details: splitShiftDetails,
            attendance_logs: attendanceLogs,
            attendance: attendance ? {
                id: attendance.id,
                check_in: attendance.check_in,
                check_out: attendance.check_out,
                status: splitShiftDetails ? splitShiftDetails.status : attendance.status,
                punch_source: attendance.punch_source,
                device_id: attendance.device_id,
                latitude: attendance.latitude,
                longitude: attendance.longitude,
                punch_location: attendance.punch_location,
                remarks: attendance.remarks,
                out_latitude: attendance.out_latitude,
                out_longitude: attendance.out_longitude,
                out_punch_location: attendance.out_punch_location,
                out_remarks: attendance.out_remarks
            } : null,
            leave: leave ? {
                id: leave.id,
                leave_type_name: leave.leave_type_name,
                leave_type_color: leave.leave_type_color,
                reason: leave.reason,
                status: leave.status,
                created_at: leave.created_at,
                start_date: leave.start_date,
                end_date: leave.end_date,
                approved_by: leave.approved_by_first_name ? `${leave.approved_by_first_name} ${leave.approved_by_last_name}` : 'System'
            } : null,
            holiday: holiday ? {
                id: holiday.id,
                name: holiday.name,
                type: holiday.type
            } : null,
            weekend_override: weekendOverride ? {
                override_type: weekendOverride.override_type,
                reason: weekendOverride.reason,
                created_at: weekendOverride.created_at,
                created_by: weekendOverride.created_by_first_name ? `${weekendOverride.created_by_first_name} ${weekendOverride.created_by_last_name}` : 'Admin'
            } : null,
            regularization: regularization ? {
                id: regularization.id,
                reason: regularization.reason,
                status: regularization.status,
                req_check_in: regularization.req_check_in,
                req_check_out: regularization.req_check_out,
                created_at: regularization.created_at,
                approved_by: regularization.approved_by_first_name ? `${regularization.approved_by_first_name} ${regularization.approved_by_last_name}` : (regularization.approver_email || 'Admin')
            } : null,
            entry_request: entryRequest ? {
                id: entryRequest.id,
                request_type: entryRequest.request_type,
                punch_time: entryRequest.punch_time,
                status: entryRequest.status,
                created_at: entryRequest.created_at,
                approved_by: entryRequest.approved_by_first_name
                    ? `${entryRequest.approved_by_first_name} ${entryRequest.approved_by_last_name}`
                    : (entryRequest.approver_email || 'Admin'),
                approver_role: entryRequest.approver_role
            } : null,
            override_history: overrideHistory ? {
                previous_status: overrideHistory.previous_status,
                updated_status: overrideHistory.updated_status,
                override_type: overrideHistory.override_type,
                overridden_by_name: overrideHistory.overridden_by_name,
                created_at: overrideHistory.created_at
            } : null
        };
    }

    async processMachineLog(payload) {
        console.log('>>> [BIOMETRIC]: Processing push logs:', JSON.stringify(payload));

        let logs = [];
        if (Array.isArray(payload)) {
            logs = payload;
        } else if (payload && typeof payload === 'object') {
            if (Array.isArray(payload.logs)) {
                logs = payload.logs;
            } else if (Array.isArray(payload.data)) {
                logs = payload.data;
            } else {
                logs = [payload];
            }
        }

        const results = {
            total: logs.length,
            successCount: 0,
            skippedCount: 0,
            failedCount: 0,
            details: []
        };

        for (const log of logs) {
            try {
                const empCode = log.employee_code || log.employee_id || log.EnrollNumber || log.UserId || log.badgenumber || log.emp_code || log.CardNo;
                const rawTime = log.timestamp || log.log_time || log.datetime || log.PunchTime || log.time;
                const deviceId = log.device_id || log.device_serial || log.serial_number || log.device || 'BIOMETRIC_DEV';

                if (!empCode || !rawTime) {
                    results.failedCount++;
                    results.details.push({ log, status: 'error', reason: 'Missing employee code or timestamp' });
                    continue;
                }

                const employee = await db('employees').where({ employee_id_number: empCode }).first();
                if (!employee) {
                    results.skippedCount++;
                    results.details.push({ empCode, time: rawTime, status: 'skipped', reason: `Employee code ${empCode} not found in database` });
                    continue;
                }

                const empId = employee.id;
                const companyId = employee.company_id;
                const rawTimeStr = typeof rawTime === 'string' ? rawTime : String(rawTime);
                const punchTime = new Date(rawTimeStr.includes('+') ? rawTimeStr : `${rawTimeStr} +05:30`);

                if (isNaN(punchTime.getTime())) {
                    results.failedCount++;
                    results.details.push({ empCode, time: rawTime, status: 'error', reason: 'Invalid timestamp format' });
                    continue;
                }

                const logDate = punchTime.toISOString().split('T')[0];

                const existing = await db('attendance')
                    .where({ employee_id: empId, company_id: companyId })
                    .whereRaw('DATE(check_in) = ?', [logDate])
                    .first();

                if (!existing) {
                    const employeeWithShift = await db('employees')
                        .leftJoin('shifts', 'employees.shift_id', 'shifts.id')
                        .leftJoin('attendance_schemes', 'employees.attendance_scheme_id', 'attendance_schemes.id')
                        .where('employees.id', empId)
                        .select(
                            'employees.*',
                            'shifts.start_time as shift_start',
                            'shifts.grace_period as shift_grace',
                            'attendance_schemes.grace_period as scheme_grace'
                        )
                        .first();

                    const rules = await db('working_rules').where({ company_id: companyId }).first() || {
                        shift_start: '09:00',
                        grace_period: 15
                    };

                    const shiftStart = employeeWithShift?.shift_start || rules.shift_start;
                    const grace = employeeWithShift?.scheme_grace ?? employeeWithShift?.shift_grace ?? rules.grace_period;

                    const [sHours, sMins] = shiftStart.split(':').map(Number);
                    const totalMins = sMins + (parseInt(grace) || 0);
                    const allowedHours = String(sHours + Math.floor(totalMins / 60)).padStart(2, '0');
                    const allowedMins = String(totalMins % 60).padStart(2, '0');
                    const shiftAllowed = new Date(`${logDate} ${allowedHours}:${allowedMins}:00 +05:30`);

                    const status = punchTime > shiftAllowed ? 'late' : 'present';

                    await db('attendance').insert({
                        employee_id: empId,
                        company_id: companyId,
                        check_in: punchTime,
                        check_out: null,
                        status: status,
                        punch_source: 'biometric',
                        device_id: deviceId,
                        created_at: db.fn.now()
                    });

                    results.successCount++;
                    results.details.push({ empCode, time: rawTime, action: 'check-in', status });
                } else {
                    const currentCheckIn = new Date(existing.check_in);

                    if (punchTime > currentCheckIn) {
                        if (!existing.check_out || punchTime > new Date(existing.check_out)) {
                            await db('attendance')
                                .where({ id: existing.id })
                                .update({
                                    check_out: punchTime,
                                    punch_source: 'biometric',
                                    device_id: deviceId
                                });

                            results.successCount++;
                            results.details.push({ empCode, time: rawTime, action: 'check-out' });
                        } else {
                            results.skippedCount++;
                            results.details.push({ empCode, time: rawTime, action: 'none', reason: 'Punch time is older than current check-out' });
                        }
                    } else {
                        results.skippedCount++;
                        results.details.push({ empCode, time: rawTime, action: 'none', reason: 'Punch time is older than current check-in' });
                    }
                }
            } catch (err) {
                console.error('>>> [BIOMETRIC]: Error processing log row:', err);
                results.failedCount++;
                results.details.push({ log, status: 'error', reason: err.message });
            }
        }

        console.log(`>>> [BIOMETRIC]: Processing completed. Success: ${results.successCount}, Skipped: ${results.skippedCount}, Failed: ${results.failedCount}`);
        return results;
    }

    async getWeekendOverrides(companyId, month, year) {
        const weekendOverrideRepository = require('../repositories/weekendOverrideRepository');
        return await weekendOverrideRepository.getAll(companyId, month, year);
    }

    async createWeekendOverride(user, companyId, data) {
        const weekendOverrideRepository = require('../repositories/weekendOverrideRepository');
        // data should have: employee_ids (array), override_date, override_type, reason
        const results = [];
        for (const empId of data.employee_ids) {
            const result = await weekendOverrideRepository.create(companyId, {
                employee_id: empId,
                override_date: data.override_date,
                override_type: data.override_type || 'working',
                reason: data.reason || null,
                created_by: user.id
            });
            results.push(result);
        }
        return { message: `Weekend override applied to ${results.length} employee(s)`, count: results.length };
    }

    async deleteWeekendOverride(companyId, id) {
        const weekendOverrideRepository = require('../repositories/weekendOverrideRepository');
        await weekendOverrideRepository.delete(id, companyId);
        return { message: 'Override removed' };
    }

    async getEmployeesForWeekendOverride(companyId) {
        const employees = await db('employees as e')
            .leftJoin('departments as d', 'e.department_id', 'd.id')
            .where('e.company_id', companyId)
            .select('e.id', 'e.first_name', 'e.last_name', 'e.employee_id_number', 'e.department_id', 'e.designation', 'e.office_location', 'd.name as department_name');
        return employees;
    }

    async getSchemes(companyId) {
        return await db('attendance_schemes').where({ company_id: companyId });
    }

    async createScheme(companyId, data) {
        const {
            name, shift_id, weekoffs, grace_period, max_late_allowed,
            late_deduction_type, half_day_hours, late_marks_for_half_day,
            ot_enabled, ot_min_minutes, ot_rate_multiplier, max_missed_punches
        } = data;

        if (!name) {
            throw new Error('Scheme name is required');
        }

        const [id] = await db('attendance_schemes').insert({
            company_id: companyId,
            name,
            shift_id: shift_id || null,
            weekoffs: Array.isArray(weekoffs) ? JSON.stringify(weekoffs) : (weekoffs || '[]'),
            grace_period: grace_period !== undefined && grace_period !== null ? parseInt(grace_period) : 15,
            max_late_allowed: max_late_allowed !== undefined && max_late_allowed !== null ? parseInt(max_late_allowed) : 3,
            late_deduction_type: late_deduction_type || 'none',
            half_day_hours: half_day_hours !== undefined && half_day_hours !== null ? parseFloat(half_day_hours) : 4.0,
            late_marks_for_half_day: late_marks_for_half_day !== undefined && late_marks_for_half_day !== null ? parseInt(late_marks_for_half_day) : 3,
            ot_enabled: !!ot_enabled,
            ot_min_minutes: ot_min_minutes !== undefined && ot_min_minutes !== null ? parseInt(ot_min_minutes) : 60,
            ot_rate_multiplier: ot_rate_multiplier !== undefined && ot_rate_multiplier !== null ? parseFloat(ot_rate_multiplier) : 1.5,
            max_missed_punches: max_missed_punches !== undefined && max_missed_punches !== null ? parseInt(max_missed_punches) : 2,
            created_at: db.fn.now(),
            updated_at: db.fn.now()
        });

        return { id, message: 'Attendance scheme created successfully' };
    }

    async updateScheme(companyId, id, data) {
        const {
            name, shift_id, weekoffs, grace_period, max_late_allowed,
            late_deduction_type, half_day_hours, late_marks_for_half_day,
            ot_enabled, ot_min_minutes, ot_rate_multiplier, max_missed_punches
        } = data;

        if (!id) {
            throw new Error('Scheme ID is required');
        }

        await db('attendance_schemes')
            .where({ company_id: companyId, id })
            .update({
                name,
                shift_id: shift_id || null,
                weekoffs: Array.isArray(weekoffs) ? JSON.stringify(weekoffs) : (weekoffs || '[]'),
                grace_period: grace_period !== undefined && grace_period !== null ? parseInt(grace_period) : 15,
                max_late_allowed: max_late_allowed !== undefined && max_late_allowed !== null ? parseInt(max_late_allowed) : 3,
                late_deduction_type: late_deduction_type || 'none',
                half_day_hours: half_day_hours !== undefined && half_day_hours !== null ? parseFloat(half_day_hours) : 4.0,
                late_marks_for_half_day: late_marks_for_half_day !== undefined && late_marks_for_half_day !== null ? parseInt(late_marks_for_half_day) : 3,
                ot_enabled: !!ot_enabled,
                ot_min_minutes: ot_min_minutes !== undefined && ot_min_minutes !== null ? parseInt(ot_min_minutes) : 60,
                ot_rate_multiplier: ot_rate_multiplier !== undefined && ot_rate_multiplier !== null ? parseFloat(ot_rate_multiplier) : 1.5,
                max_missed_punches: max_missed_punches !== undefined && max_missed_punches !== null ? parseInt(max_missed_punches) : 2,
                updated_at: db.fn.now()
            });

        return { message: 'Attendance scheme updated successfully' };
    }

    async deleteScheme(companyId, id) {
        if (!id) {
            throw new Error('Scheme ID is required');
        }

        await db.transaction(async (trx) => {
            // Nullify employee references
            await trx('employees')
                .where({ company_id: companyId, attendance_scheme_id: id })
                .update({ attendance_scheme_id: null });

            // Delete the scheme
            await trx('attendance_schemes')
                .where({ company_id: companyId, id })
                .del();
        });

        return { message: 'Attendance scheme deleted successfully' };
    }

    async getSchemeAssignments(companyId) {
        const employees = await db('employees as e')
            .leftJoin('departments as d', 'e.department_id', 'd.id')
            .leftJoin('shifts as s', 'e.shift_id', 's.id')
            .leftJoin('attendance_schemes as asch', 'e.attendance_scheme_id', 'asch.id')
            .where('e.company_id', companyId)
            .select(
                'e.id',
                'e.first_name',
                'e.last_name',
                'e.employee_id_number',
                'e.designation',
                'e.status',
                'e.office_location',
                'd.name as department_name',
                's.id as shift_id',
                's.name as shift_name',
                'asch.id as attendance_scheme_id',
                'asch.name as attendance_scheme_name'
            );

        const seenIds = new Set();
        return employees.filter(emp => {
            if (seenIds.has(emp.id)) {
                return false;
            }
            seenIds.add(emp.id);
            return true;
        });
    }

    async assignScheme(user, companyId, employeeIds, schemeId) {
        if (!employeeIds || !Array.isArray(employeeIds) || employeeIds.length === 0) {
            throw new Error('Employee list is required');
        }

        await db.transaction(async (trx) => {
            let shiftId = null;

            if (schemeId) {
                // Get shift_id from scheme to sync it
                const scheme = await trx('attendance_schemes')
                    .where({ company_id: companyId, id: schemeId })
                    .first();
                if (!scheme) {
                    throw new Error('Attendance scheme not found');
                }
                shiftId = scheme.shift_id;
            }

            for (const empId of employeeIds) {
                const updates = { attendance_scheme_id: schemeId || null };

                // For backward compatibility and UI consistency, also sync shift_id if scheme has a shift
                if (shiftId) {
                    updates.shift_id = shiftId;
                }

                await trx('employees')
                    .where({ company_id: companyId, id: empId })
                    .update(updates);
            }
        });

        return { message: `Scheme assigned to ${employeeIds.length} employee(s) successfully` };
    }

    async getTodayNotCheckedIn(companyId, user) {
        const today = new Date().toISOString().split('T')[0];
        const isAdmin = ['company_admin', 'super_admin'].includes(user.role_name);

        let empQuery = db('employees as e')
            .leftJoin('shifts as s', 'e.shift_id', 's.id')
            .where({ 'e.company_id': companyId, 'e.status': 'active' });

        if (!isAdmin) {
            // Manager role: get subordinates
            const manager = await db('employees').where({ user_id: user.id }).first();
            if (!manager) return [];
            empQuery = empQuery.where('e.manager_id', manager.id);
        }

        const employees = await empQuery.select(
            'e.id',
            'e.first_name',
            'e.last_name',
            'e.employee_id_number',
            's.name as shift_name',
            's.start_time as shift_start',
            's.end_time as shift_end'
        );

        // Fetch check-in logs for today
        const checkedInIds = await db('attendance')
            .where({ company_id: companyId })
            .whereRaw('DATE(check_in) = ?', [today])
            .pluck('employee_id');

        // Fetch pre-approved/pending requests for today
        const requests = await db('attendance_entry_requests')
            .where({ company_id: companyId, date: today });

        const results = employees.map(emp => {
            const isCheckedIn = checkedInIds.includes(emp.id);
            const lateInRequest = requests.find(r => r.employee_id === emp.id && r.request_type === 'late_in');
            const earlyOutRequest = requests.find(r => r.employee_id === emp.id && r.request_type === 'early_out');

            return {
                id: emp.id,
                first_name: emp.first_name,
                last_name: emp.last_name,
                employee_id_number: emp.employee_id_number,
                shift_name: emp.shift_name,
                shift_start: emp.shift_start,
                shift_end: emp.shift_end,
                is_checked_in: isCheckedIn,
                late_in_status: lateInRequest ? lateInRequest.status : null,
                early_out_status: earlyOutRequest ? earlyOutRequest.status : null
            };
        });

        // Filter: only show employees who are not checked in AND do NOT have an approved late-in request today
        return results.filter(r => !r.is_checked_in && r.late_in_status !== 'approved');
    }

    async preApproveException(companyId, user, employeeId, type, date) {
        if (!['late_in', 'early_out'].includes(type)) {
            throw new Error('Invalid request type');
        }

        const targetDate = date || new Date().toISOString().split('T')[0];

        const existing = await db('attendance_entry_requests')
            .where({ employee_id: employeeId, company_id: companyId, date: targetDate, request_type: type })
            .first();

        if (existing) {
            await db('attendance_entry_requests')
                .where({ id: existing.id })
                .update({
                    status: 'approved',
                    approved_by: user.id,
                    updated_at: db.fn.now()
                });
        } else {
            const nowStr = new Date().toISOString().slice(0, 19).replace('T', ' ');
            await db('attendance_entry_requests').insert({
                company_id: companyId,
                employee_id: employeeId,
                date: targetDate,
                request_type: type,
                punch_time: nowStr,
                location_data: JSON.stringify({ source: 'pre-approve', operator: user.id }),
                status: 'approved',
                approved_by: user.id,
                created_at: db.fn.now(),
                updated_at: db.fn.now()
            });
        }

        return { message: `${type === 'late_in' ? 'Late In' : 'Early Out'} pre-approved successfully.` };
    }

    async getEntryExitRequests(companyId, user, statusFilter) {
        const isAdmin = ['company_admin', 'super_admin'].includes(user.role_name);
        const employee = await db('employees').where({ user_id: user.id }).first();

        let query = db('attendance_entry_requests as r')
            .join('employees as e', 'r.employee_id', 'e.id')
            .where('r.company_id', companyId);

        if (statusFilter === 'history') {
            query = query.whereIn('r.status', ['approved', 'rejected']);
        } else if (statusFilter === 'pending') {
            query = query.where('r.status', 'pending');
        } else {
            // Default to pending if not specified
            query = query.where('r.status', 'pending');
        }

        if (!isAdmin) {
            if (!employee) return [];
            query = query.where('e.manager_id', employee.id);
        }

        return await query.select(
            'r.*',
            'e.first_name',
            'e.last_name',
            'e.employee_id_number as employee_code'
        ).orderBy('r.created_at', 'desc');
    }

    async approveRejectEntryExitRequest(companyId, user, requestId, status, attendanceStatus = 'present') {
        if (!['approved', 'rejected'].includes(status)) {
            throw new Error('Invalid status value');
        }

        const request = await db('attendance_entry_requests').where({ id: requestId, company_id: companyId }).first();
        if (!request) throw new Error('Request not found');

        // Update request status
        await db('attendance_entry_requests')
            .where({ id: requestId })
            .update({
                status,
                approved_by: user.id,
                updated_at: db.fn.now()
            });

        // Write punch to attendance table if approved
        if (status === 'approved') {
            const dateStr = request.date;
            const punchTimeStr = request.punch_time;

            let dbStatus = 'present';
            if (attendanceStatus === 'late_in' || attendanceStatus === 'late') {
                dbStatus = 'late';
            } else if (attendanceStatus === 'half_day' || attendanceStatus === 'half-day') {
                dbStatus = 'half-day';
            } else if (attendanceStatus === 'early_out' || attendanceStatus === 'early-out') {
                dbStatus = 'early_out';
            } else if (attendanceStatus === 'present' || attendanceStatus === 'p') {
                dbStatus = 'present';
            } else if (attendanceStatus === 'absent' || attendanceStatus === 'a') {
                dbStatus = 'absent';
            }

            if (request.request_type === 'late_in') {
                const existingAtt = await db('attendance')
                    .where({ employee_id: request.employee_id })
                    .whereRaw('DATE(check_in) = ?', [dateStr])
                    .first();

                if (!existingAtt) {
                    await db('attendance').insert({
                        employee_id: request.employee_id,
                        company_id: companyId,
                        check_in: punchTimeStr,
                        check_out: null,
                        status: dbStatus,
                        punch_source: 'entry_request',
                        created_at: db.fn.now()
                    });
                } else {
                    await db('attendance')
                        .where({ id: existingAtt.id })
                        .update({
                            status: dbStatus,
                            punch_source: 'entry_request',
                            updated_at: db.fn.now()
                        });
                }
            } else if (request.request_type === 'early_out') {
                const existingAtt = await db('attendance')
                    .where({ employee_id: request.employee_id })
                    .whereRaw('DATE(check_in) = ?', [dateStr])
                    .first();

                if (existingAtt) {
                    const updates = {
                        status: dbStatus,
                        punch_source: 'entry_request',
                        updated_at: db.fn.now()
                    };
                    if (!existingAtt.check_out && punchTimeStr) {
                        updates.check_out = punchTimeStr;
                    }
                    await db('attendance')
                        .where({ id: existingAtt.id })
                        .update(updates);
                } else {
                    await db('attendance').insert({
                        employee_id: request.employee_id,
                        company_id: companyId,
                        check_in: punchTimeStr || `${dateStr} 09:00:00`,
                        check_out: punchTimeStr || `${dateStr} 18:00:00`,
                        status: dbStatus,
                        punch_source: 'entry_request',
                        created_at: db.fn.now()
                    });
                }
            }
        }

        return { message: `Request ${status} successfully.` };
    }

    async notifyAdminsAndManager(companyId, employeeId, title, message) {
        try {
            const employee = await db('employees').where({ id: employeeId }).first();
            if (!employee) return;

            let targetUserIds = [];
            if (employee.manager_id) {
                const manager = await db('employees').where({ id: employee.manager_id }).first();
                if (manager && manager.user_id) {
                    targetUserIds.push(manager.user_id);
                }
            }

            const admins = await db('users')
                .where({ company_id: companyId, role_name: 'company_admin' })
                .select('id');

            admins.forEach(admin => {
                if (!targetUserIds.includes(admin.id)) {
                    targetUserIds.push(admin.id);
                }
            });

            for (const userId of targetUserIds) {
                await notificationService.createNotification(
                    userId,
                    companyId,
                    title,
                    message,
                    'warning'
                );
            }
        } catch (err) {
            console.error('Failed to send entry/exit notifications', err);
        }
    }
}

module.exports = new AttendanceService();
