// How many days of a month an employee is paid for. Pure: no db, no clock.
//
// Payroll and the Attendance Muster both need this answer. It lives here so the muster's
// "Payable" column and the payslip are worked out by the same code, not two copies that drift.

// Normalise any DB date value (Date object or string) to a YYYY-MM-DD calendar
// day in IST, so date comparisons never drift across a timezone boundary.
const toLocalYMD = (dateVal) => {
    if (!dateVal) return null;
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return null;
    return d.toLocaleDateString('sv-SE', { timeZone: 'Asia/Kolkata' });
};

// The payroll time period for a month is always the complete calendar month:
// the 1st day through the last day. The last day is derived dynamically —
// `new Date(year, month, 0)` is day zero of the *next* month, i.e. the last day
// of this one — so Feb resolves to 28 or 29 depending on the year, and no data
// from the following month can ever fall inside the range.
const getPayrollPeriod = (month, year) => {
    const m = parseInt(month, 10);
    const y = parseInt(year, 10);
    // Fail loudly here rather than letting NaN propagate into salary/loan math —
    // this is the single choke point for period resolution across payroll.
    if (isNaN(m) || m < 1 || m > 12) {
        throw new Error(`Invalid payroll month: ${month}. Expected 1-12.`);
    }
    if (isNaN(y) || y < 1970 || y > 9999) {
        throw new Error(`Invalid payroll year: ${year}.`);
    }
    const daysInMonth = new Date(y, m, 0).getDate();
    const mm = String(m).padStart(2, '0');
    return {
        month: m,
        year: y,
        daysInMonth,
        startDate: `${y}-${mm}-01`,
        endDate: `${y}-${mm}-${String(daysInMonth).padStart(2, '0')}`
    };
};

// The days of the month the employee was on the books: joining day through resignation day.
// startDay/endDay are day-of-month numbers; activeDays is 0 when the whole month is outside.
const resolveActiveTenure = (joiningDateStr, resignationDateStr, month, year) => {
    const { daysInMonth, startDate: startOfMonthStr, endDate: endOfMonthStr } = getPayrollPeriod(month, year);
    let startDay = 1;
    let endDay = daysInMonth;

    if (joiningDateStr) {
        const joinStr = toLocalYMD(joiningDateStr);

        if (joinStr > endOfMonthStr) {
            return { activeDays: 0, preJoiningDays: daysInMonth, postResignationDays: 0, startDay, endDay: 0 };
        }
        if (joinStr >= startOfMonthStr && joinStr <= endOfMonthStr) {
            startDay = parseInt(joinStr.split('-')[2], 10);
        }
    }

    if (resignationDateStr) {
        const resignStr = toLocalYMD(resignationDateStr);

        if (resignStr < startOfMonthStr) {
            return { activeDays: 0, preJoiningDays: 0, postResignationDays: daysInMonth, startDay, endDay: 0 };
        }
        if (resignStr >= startOfMonthStr && resignStr <= endOfMonthStr) {
            endDay = parseInt(resignStr.split('-')[2], 10);
        }
    }

    const activeDays = Math.max(0, endDay - startDay + 1);
    const preJoiningDays = startDay - 1;
    const postResignationDays = daysInMonth - endDay;

    return { activeDays, preJoiningDays, postResignationDays, startDay, endDay };
};

// Paid off days: up to N absent days a month are paid instead of cut. Unused days lapse.
// companyDefault NULL = feature off for the company (entitled null, nothing covered).
// N is prorated for a part-month tenure and rounded down to the half day, so a mid-month
// joiner does not get the full allowance. shortfall is the tenure days neither worked nor
// otherwise paid; it is fractional for half days, so a half day is covered as 0.5.
const resolvePaidOffDays = (companyDefault, employeeValue, activeDays, daysInMonth, shortfall) => {
    if (companyDefault === null || companyDefault === undefined) return { used: 0, entitled: null };
    const perMonth = Number(employeeValue ?? companyDefault) || 0;
    const entitled = Math.floor(perMonth * (activeDays / daysInMonth) * 2) / 2;
    return { used: Math.min(shortfall, entitled), entitled };
};

// Paid days for one employee-month from the attendance matrix stats.
//
// elapsedDay is for a month still running (the muster on today's date): days after it have
// not happened, so they are not a shortfall yet and must not eat the paid-days-off allowance.
// Payroll passes nothing and gets the whole tenure, exactly as before. The entitlement is
// always the full month's - only what has been used so far is capped.
const computePaidDays = (stats, tenure, daysInMonth, companyDefault, employeeValue, elapsedDay = null) => {
    const workedOrPaidDays = stats.P + stats.L + stats.OFF + stats.H + (stats.PL || 0);
    const daysSoFar = elapsedDay === null
        ? tenure.activeDays
        : Math.max(0, Math.min(tenure.endDay, elapsedDay) - tenure.startDay + 1);
    const { used: paidOffDaysUsed, entitled: paidOffDaysEntitled } = resolvePaidOffDays(
        companyDefault, employeeValue,
        tenure.activeDays, daysInMonth, Math.max(0, daysSoFar - workedOrPaidDays)
    );
    return {
        workedOrPaidDays,
        paidOffDaysUsed,
        paidOffDaysEntitled,
        paidDays: workedOrPaidDays + paidOffDaysUsed
    };
};

module.exports = {
    toLocalYMD,
    getPayrollPeriod,
    resolveActiveTenure,
    resolvePaidOffDays,
    computePaidDays
};
