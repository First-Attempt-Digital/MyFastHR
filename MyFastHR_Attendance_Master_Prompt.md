# MyFastHR — Attendance & Shift Logic MASTER PROMPT

> **Purpose**: This is a self-contained reference and repair prompt. If the attendance/shift logic breaks in the future, paste this entire document to an AI assistant and it will have everything needed to diagnose and fix all shift types, all rules, and all edge cases correctly.

---

## 🏗️ PROJECT STRUCTURE (Key Files)

```
MyFastHR/
├── backend/
│   ├── src/
│   │   ├── services/
│   │   │   ├── attendanceService.js          ← Main attendance logic (web/app punches, status calc, manual override, matrix, ledger)
│   │   │   └── machineAttendanceService.js   ← Biometric device punch logic (check-in/out, night shift, deduplication)
│   │   ├── repositories/
│   │   │   └── attendanceRepository.js       ← DB queries: punchIn, punchOut, getCompanyMatrix
│   │   └── routes/
│   │       └── attendanceRoutes.js           ← API routes (POST /punch-in, POST /punch-out, PUT /manual-update, etc.)
│   └── knexfile.js                           ← DB config (timezone: +05:30)
└── frontend/
    └── src/pages/leave-attendance/
        ├── AttendanceMuster.jsx              ← Monthly grid/matrix view
        ├── Overview.jsx                      ← Employee attendance summary
        └── ManualOverride.jsx                ← Admin override UI
```

---

## 🗄️ DATABASE TABLES (Critical Ones)

| Table | Purpose | Key Columns |
|---|---|---|
| `shifts` | Shift configurations | `start_time`, `end_time`, `is_flexi`, `min_hours`, `grace_period`, `grace_count_limit`, `total_punches_required` (2 or 4), `session1_in_margin`, `session1_out_margin`, `session1_grace_out`, `session2_start_time`, `session2_end_time`, `session2_in_margin`, `session2_out_margin`, `session2_grace_in`, `session2_grace_out`, `terminate_hour` |
| `attendance_schemes` | Rules assigned to employees | `grace_period`, `max_late_allowed`, `late_deduction_type` (none/half_day/full_day), `half_day_hours`, `late_marks_for_half_day` |
| `employee_shift_assignments` | Per-employee shift overrides by date range | `employee_id`, `shift_id`, `from_date`, `to_date` |
| `working_rules` | Company-wide fallback rules | `shift_start`, `grace_period`, `weekoffs`, `half_day_hours` |
| `weekend_overrides` | Makes weekoffs working or weekdays off | `override_type` ('working'/'off'), `override_date` |
| `attendance` | Daily check-in/out records | `employee_id`, `company_id`, `check_in`, `check_out`, `status`, `punch_source` |
| `attendance_entry_requests` | Late-in / Early-out approval requests | `employee_id`, `date`, `request_type` ('late_in'/'early_out'), `punch_time`, `status` ('pending'/'approved'/'rejected') |
| `biometric_raw_logs` | Raw biometric punches audit trail | `employee_code`, `punch_time`, `device_serial`, `status` ('synced'/'skipped'/'duplicate'/'failed'), `error_details` |
| `holidays` | Company holidays | `date`, `company_id` |
| `leaves` | Employee leave applications | `employee_id`, `start_date`, `end_date`, `leave_type`, `status` |

---

## ⚡ SHIFT RESOLUTION HIERARCHY

When any punch is received, the system resolves the active shift for that employee+date in this order:

```
Priority 1: employee_shift_assignments (from_date <= targetDate <= to_date or to_date IS NULL)
Priority 2: employees.shift_id  (default shift on employee profile)
Priority 3: working_rules (company-wide defaults)
Priority 4: Hard-coded defaults (09:00 start, 15 min grace, 4hr half-day)
```

---

## 🌙 NIGHT SHIFT / ROTATIONAL SHIFT — CRITICAL RULES

### Definition
A shift is a **night shift** if: `end_time < start_time` (e.g., 20:00–02:00, 22:00–06:00).

### Helper Function (must exist in both `attendanceService.js` and `machineAttendanceService.js`)
```js
function isNightShift(shift) {
    if (!shift || !shift.start_time || !shift.end_time) return false;
    const [sH, sM] = shift.start_time.split(':').map(Number);
    const [eH, eM] = shift.end_time.split(':').map(Number);
    return (eH * 60 + eM) < (sH * 60 + sM);
}
```

### Logical Date Rule
For a night shift (e.g., June 14 → 20:00 to June 15 → 02:00):
- **Logical date = June 14** (the date the shift STARTED)
- Even though check-in happens at 00:30 AM June 15, it must be grouped under **June 14** in ALL reports (matrix, ledger, override)

### Night Shift Check-In Lookback (Biometric — `machineAttendanceService.js`)
```
When punch arrives between 00:00 and 06:00 (midnight to 6 AM):
  1. Check for open check-in on PREVIOUS day (no check_out) within last 16 hours
  2. If found → treat this punch as CHECKOUT for the previous day's night shift
  3. If NOT found → look up shift for PREVIOUS day, if isNightShift → set targetShiftDate = prevDay
  4. Otherwise → treat as fresh check-in for current day
```

### In-Margin Check — CRITICAL BUG FIX
```js
// ❌ WRONG: Uses dateStr (punch date = June 15) — will reject all after-midnight punches
const shiftStartDate = new Date(`${dateStr} ${sHours}:${sMins}:00 +05:30`);

// ✅ CORRECT: Uses targetShiftDate (logical shift date = June 14)
const shiftStartDate = new Date(`${targetShiftDate} ${sHours}:${sMins}:00 +05:30`);
```

### Night Shift Date Grouping (Reports)
```js
function getLogicalDateStr(checkInStr) {
    const checkIn = new Date(checkInStr);
    const istHour = (checkIn.getUTCHours() + 5) % 24 + (checkIn.getUTCMinutes() >= 30 ? 0 : 0);
    // Simplified: if IST hour < 6, the logical date is the PREVIOUS calendar day
    const istDate = new Date(checkIn.getTime() + 5.5 * 60 * 60 * 1000);
    if (istDate.getHours() < 6) {
        istDate.setDate(istDate.getDate() - 1);
    }
    return istDate.toISOString().slice(0, 10);
}
```
This function MUST be used in:
- `getMatrix()` — attendance muster grid
- `getEmployeeAttendanceHistory()` — attendance ledger
- `manualUpdateAttendance()` — when finding which DB record to override

---

## 📋 3 SHIFT TYPES — COMPLETE RULES

---

### TYPE 1: STANDARD 2-PUNCH SHIFT

**Config**: `total_punches_required = 2`, `is_flexi = false`

**Fields used**: `start_time`, `end_time`, `grace_period`, `grace_count_limit`, `session1_in_margin`, `session1_out_margin`, `terminate_hour`

#### CHECK-IN RULES

| Condition | Action |
|---|---|
| Punch before `start_time - session1_in_margin` | ❌ BLOCKED (`skipped` in biometric, error on web) |
| Punch between `start_time - in_margin` and `start_time` | ✅ ON TIME (Present) |
| Punch between `start_time` and `start_time + grace_period` | ✅ GRACE (check monthly grace count) |
| Monthly grace count >= `max_late_allowed` (default: 3) | ⚠️ LATE-IN (L) |
| Punch after `start_time + grace_period` | ⚠️ LATE-IN (L) |
| Punch within last 25% of shift duration (near end) | 🔄 Treated as CHECKOUT ATTEMPT |

#### LATE-IN ACTIONS
- **Web punch**: BLOCKED → auto-creates `attendance_entry_requests` with `request_type='late_in'`, `status='pending'`
- **Biometric punch**: NOT blocked → recorded with `status='pending'`, auto-creates approval request

#### CHECK-OUT RULES

| Condition | Action |
|---|---|
| `workedHours < halfDayLimit` | ❌ BLOCKED / SKIPPED (punch ignored, check_out stays null) |
| Punch before `end_time - out_margin` (early out) | ⚠️ EARLY-OUT (E) — approval request created |
| Punch between `end_time - out_margin` and `end_time` | ✅ ON TIME (Present) |
| Punch after `end_time + terminate_hour` | ❌ BLOCKED (`Shift has terminated`) |

#### HALF-DAY THRESHOLD
```
If total_punches_required = 4 (split):
    halfDayLimit = (shift_duration_hours) / 2

Else (standard 2-punch):
    halfDayLimit = min_hours / 2  OR  scheme.half_day_hours  OR  working_rules.half_day_hours  OR  4 (default)
```

#### STATUS DETERMINATION (end of day)
```
No punches → A (Absent) / OFF / H / PL depending on day type
check_in only (no check_out, today) → CI (Checked-In, active)
check_in only (no check_out, past day) → A (Absent - incomplete)
workedHours < halfDayLimit → HD (Half Day)
check_in > (start_time + grace_period) → L (Late In)
check_out < (end_time - out_margin) → E (Early Out)
All good → P (Present)
Manual override status → takes absolute priority over everything
```

---

### TYPE 2: SPLIT / SESSION SHIFT (4-PUNCH)

**Config**: `total_punches_required = 4`, `is_flexi = false`

**Additional Fields**: `session2_start_time`, `session2_end_time`, `session2_in_margin`, `session2_out_margin`, `session2_grace_in`, `session2_grace_out`, `session1_grace_out`

#### SESSION ROUTING LOGIC
```
Punch is SESSION 1 if:
  - punchTime (minutes) < session1_end_time (minutes)
  - AND no completed Session 1 record exists

Punch is SESSION 2 if:
  - Previous Session 1 check_out exists (Session 1 complete)
  - OR punchTime (minutes) >= session1_end_time (minutes)

GAP ZONE: Punches between session1_end and (session2_start - session2_in_margin) are SKIPPED
```

#### PER-SESSION RULES
Each session follows the same rules as a standard 2-punch shift but uses its respective margins/grace:

| Field | Session 1 | Session 2 |
|---|---|---|
| Start time | `start_time` | `session2_start_time` |
| End time | `end_time` (of session 1) | `session2_end_time` |
| In margin | `session1_in_margin` | `session2_in_margin` |
| Out margin | `session1_out_margin` | `session2_out_margin` |
| Grace out | `session1_grace_out` | `session2_grace_out` |
| Grace in | `grace_period` | `session2_grace_in` |

#### FINAL STATUS (Split Shift)
```
Both sessions completed (P/L/E in both) → P (or L/E if violation in either)
Only Session 1 completed → HD (Half Day)
Only Session 2 completed → HD (Half Day)
Neither session → A (Absent)
```

---

### TYPE 3: FLEXI SHIFT

**Config**: `is_flexi = true`, `min_hours` = required daily hours (e.g. 8)

**No fixed start/end time** — employee can check in anytime.

#### CHECK-IN RULES
- ✅ No in-margin check
- ✅ No late-in check
- ✅ Check-in allowed at any time

#### CHECK-OUT RULES
```
halfDayLimit = min_hours / 2

If workedHours < halfDayLimit    → BLOCKED (punch skipped)
If workedHours < min_hours       → HD (Half Day)
If workedHours >= min_hours      → P (Present)
```

#### STATUS DETERMINATION (Flexi)
```
workedHours < halfDayLimit  → A (treated as absent/short)
halfDayLimit <= workedHours < min_hours  → HD (Half Day)
workedHours >= min_hours    → P (Present)
```

---

## 📊 STATUS INDICATORS — COMPLETE GUIDE

| Code | Full Name | When It Appears |
|---|---|---|
| **P** | Present | Shift completed without violations (on time in, on time out) |
| **A** | Absent | No punches, OR incomplete punch on past day, OR hours below half-day threshold |
| **HD** | Half Day | Only 1 session done (Split Shifts), OR hours between half-day limit and full-day limit (Flexi) |
| **L** | Late In | Checked in after `start_time + grace_period`, and grace monthly limit exceeded |
| **E** | Early Out | Checked out before `end_time - out_margin` |
| **CI** | Checked In | Active open punch for TODAY (checked in, not yet checked out) |
| **—** | Blank Dash | Pending approval request exists, OR date is before employee joining date |
| **🟢** | Green Dot | Employee checked in within the grace window (on-time arrival indicator on the grid) |
| **OFF** | Week Off | Day matches employee's weekoff schedule |
| **H** | Holiday | Company holiday on that date |
| **PL** | Paid Leave | Approved paid leave for that day |
| **UL** | Unpaid Leave | LOP / unpaid leave |
| **R** | Regularized | Entry request approved by manager |

---

## ✋ MANUAL OVERRIDE — CRITICAL RULES

### Rule: Override Must Target Logical Date

When admin overrides attendance for a date (e.g., June 14 night shift), the system must:
1. Find the `attendance` record where `getLogicalDateStr(check_in) == targetDate`
2. Do NOT simply look for `DATE(check_in) = targetDate` (this fails for night shifts!)

### Correct Override Logic
```js
// In attendanceService.js → manualUpdateAttendance()
// Step 1: Fetch records for a window (targetDate and next day for night shifts)
const records = await db('attendance')
    .where({ employee_id, company_id })
    .whereRaw('DATE(check_in) BETWEEN ? AND ?', [targetDate, nextDay]);

// Step 2: Find the record whose LOGICAL date matches targetDate
const record = records.find(r => getLogicalDateStr(r.check_in) === targetDate);

// Step 3: Update that specific record's status
await db('attendance').where({ id: record.id }).update({ status: overrideStatus });
```

### Override Status Values (what admin can set)
`present` (P), `absent` (A), `half-day` (HD), `late` (L), `early_out` (E), `on_leave` (PL), `week_off` (OFF), `holiday` (H)

---

## 🔄 BIOMETRIC MACHINE LOGIC (`machineAttendanceService.js`)

### Full Punch Flow
```
Biometric device sends: { employee_code, punch_time, device_serial }

1. FIND EMPLOYEE
   → employees JOIN shifts WHERE employee_code = code AND company matches device

2. DEDUPLICATION
   → Check if punch is within 2 minutes of last check_in or check_out → skip if yes

3. NIGHT SHIFT CROSSOVER CHECK
   → If punch between 00:00–06:00 IST:
     - Check for open check-in on previous calendar day (< 16 hours old)
     - If found → this punch is CHECKOUT for that record
     - If not found → look up previous day's shift assignment → if isNightShift → set targetShiftDate = prevDay

4. DETERMINE: CHECK-IN or CHECK-OUT?
   → If no open record (no check_in without check_out) → CHECK-IN FLOW
   → If open record exists → CHECK-OUT FLOW

5. CHECK-IN FLOW
   a. In-Margin check (using targetShiftDate, NOT dateStr)
   b. Checkout-window attempt check (near end of shift → treat as checkout)
   c. Late-in check (grace + monthly count)
   d. Insert new attendance record
   e. Auto-create late_in request if late

6. CHECK-OUT FLOW
   a. Deduplicate (within 2 min of check-in or last checkout)
   b. Shift terminate hour check
   c. Calculate workedHours
   d. Half-day limit check → if workedHours < halfDayLimit → SKIP punch (log as 'skipped')
   e. Early-out check → if early → auto-create early_out request
   f. Update check_out on attendance record
   g. Recalculate final status (present/early_out/pending)
   h. Log to biometric_raw_logs as 'synced'
```

### Key Rules
- **NEVER block** a biometric punch — always log it, even if late or early (just create approval request)
- **Never update check_out if workedHours < halfDayLimit** — log as 'skipped' in `biometric_raw_logs`
- **Night shift crossover**: punch at 12:30 AM June 15 for a June 14 night shift → records as check-in under June 14 logical date

---

## 📅 MATRIX / MUSTER GRID RULES (`getMatrix` in `attendanceService.js`)

### Date Grouping
```js
// WRONG — will show night shift check-ins on wrong date
GROUP BY DATE(check_in)

// CORRECT — use logical date function
GROUP BY getLogicalDateStr(check_in)
```

### Window Query for Night Shifts
When fetching records for date range `[startDate, endDate]`, always extend the query window:
```js
// Fetch from (startDate - 1 day) to (endDate + 1 day) to catch crossover records
const queryStart = subtractDays(startDate, 1);
const queryEnd = addDays(endDate, 1);
```

### Status Priority Order in Matrix Cell
```
1. Manual Override (status = 'manual' or punch_source = 'manual') → highest priority
2. Approved entry request (status = 'approved' in attendance_entry_requests) → R
3. Active check-in today (no check_out, today's date) → CI
4. Calculated status from punch data
5. Weekoff / Holiday / Leave (if no punches)
6. Absent (fallback for past dates)
7. Blank (future dates or before joining date)
```

---

## 🐛 KNOWN BUGS FIXED (Reference for Future)

### Bug 1: Biometric checkout stored when workedHours < half-day
**Symptom**: Employee checks out at 11 AM after 9 AM check-in (only 2h worked), system stores it as check-out and marks attendance as `absent` instead of ignoring.
**Root Cause**: Old code updated `check_out` before the half-day check.
**Fix**: Move half-day check BEFORE updating `check_out`. If `workedHours < halfDayLimit`, insert `biometric_raw_logs` with `status='skipped'` and `return` immediately.

```js
// CORRECT ORDER in machineAttendanceService.js checkout flow:
// 1. Calculate workedHours
// 2. CHECK: if (workedHours < halfDayLimit) → log 'skipped' → return
// 3. THEN: update check_out
// 4. THEN: check for early_out → create request
// 5. THEN: update final status
```

### Bug 2: Night shift check-in rejected ("Punch in before allowed margin")
**Symptom**: Employee on 20:00–02:00 shift, punching in at 00:30 AM June 15, gets "before allowed margin" error.
**Root Cause**: In-margin check used `dateStr` (June 15) to build shift start time → computed `20:00 June 15 - inMargin` → 00:30 AM June 15 is way before that.
**Fix**: Use `targetShiftDate` (June 14) instead of `dateStr` in the in-margin calculation:
```js
// In machineAttendanceService.js, CHECK-IN FLOW, in-margin section:
const shiftStartDate = new Date(`${targetShiftDate} ${sH}:${sM}:00 +05:30`); // NOT dateStr
```

### Bug 3: Manual override applying to wrong date (night shift)
**Symptom**: Admin overrides June 14 attendance, but the system updates the June 15 record (because check_in is at 00:30 June 15).
**Root Cause**: Override logic used `DATE(check_in) = targetDate` directly.
**Fix**: Use `getLogicalDateStr(check_in)` to find matching record, then update by `id`.

### Bug 4: Muster matrix shows night shift under wrong day
**Symptom**: Night shift check-in (00:30 June 15) appears under June 15 column in the grid instead of June 14.
**Root Cause**: `getMatrix` grouped by `DATE(check_in)` which returns June 15.
**Fix**: Group by `getLogicalDateStr(check_in)` in the matrix query logic.

### Bug 5: Orphan closing brace syntax error
**Symptom**: `SyntaxError: Missing catch or finally after try` in `machineAttendanceService.js` at the closing brace of the checkout block.
**Root Cause**: When the half-day check was moved outside the `if (employee?.is_flexi) { } else { }` block, an extra `}` was left behind, causing the `try` block to appear unclosed before its `catch`.
**Fix**: Count braces carefully after any refactor. Remove the extra `}` after the `if (!approvedRequest && triggersEarlyOutRequest) { }` block.

---

## 🔧 HOW TO FIX ATTENDANCE LOGIC (Step-by-Step)

If attendance logic breaks in the future, follow this order:

### Step 1: Identify the shift type
```
Check shifts table: is_flexi=1 → Flexi | total_punches_required=4 → Split | else → Standard
Check if end_time < start_time → Night/Rotational shift
```

### Step 2: Check the correct file
- **Biometric device punches** → `machineAttendanceService.js`
- **Web/app punches** → `attendanceService.js`
- **Status shown in muster/ledger** → `getMatrix()` and `getEmployeeAttendanceHistory()` in `attendanceService.js`
- **Manual overrides** → `manualUpdateAttendance()` in `attendanceService.js`

### Step 3: Verify these critical functions exist and are correct
- `isNightShift(shift)` — in both service files
- `getLogicalDateStr(checkInStr)` — in `attendanceService.js`
- `checkIfLogUsedGrace(log, shift, rules)` — for monthly grace counting
- `dateToISTDateString(date)` — returns `YYYY-MM-DD` in IST timezone
- `dbDateToUTC(dbDateStr)` — converts DB datetime string to UTC Date object

### Step 4: Run verification script
Create a test script that:
1. Creates a temporary night shift (e.g., 20:00–02:00)
2. Assigns it to a test employee for a test date
3. Simulates check-in at 00:30 AM next day → verify it's accepted & grouped under correct date
4. Simulates checkout at 01:00 AM (< half-day) → verify it's SKIPPED, check_out stays null
5. Runs manual override for the logical date → verify correct record is updated
6. Checks `getMatrix()` → verify night shift appears under correct column
7. Checks `getEmployeeAttendanceHistory()` → verify ledger shows correct date

---

## 🌐 API ENDPOINTS

| Method | Route | Controller Function | Purpose |
|---|---|---|---|
| POST | `/attendance/punch-in` | `punchIn` | Employee check-in (web/app) |
| POST | `/attendance/punch-out` | `punchOut` | Employee check-out (web/app) |
| PUT | `/attendance/manual-update` | `manualUpdateAttendance` | Admin manual status override |
| GET | `/attendance/matrix` | `getMatrix` | Monthly muster grid |
| GET | `/attendance/history/:employeeId` | `getEmployeeAttendanceHistory` | Employee attendance ledger |
| POST | `/attendance/biometric/sync` | `syncBiometricPunch` | Biometric device punch sync |
| GET | `/attendance/entry-requests` | `getEntryRequests` | Pending late-in/early-out requests |
| PUT | `/attendance/entry-requests/:id` | `updateEntryRequest` | Approve/reject entry request |

---

## 💰 PAYROLL DEDUCTION RULES (Attendance → Salary)

```
Daily Wage = Basic Salary / Total Days in Month

Late Deduction:
  extraLates = totalLates - scheme.max_late_allowed (grace allowance per month)
  If extraLates > 0:
    late_deduction_type = 'half_day' → deduction = extraLates × 0.5 × Daily Wage
    late_deduction_type = 'full_day' → deduction = extraLates × 1.0 × Daily Wage
    late_deduction_type = 'none'     → no deduction

LOP / Unpaid Leave:
  deduction = count(UL days) × 1.0 × Daily Wage

Half Days:
  deduction = count(HD days) × 0.5 × Daily Wage
```

---

## 🧠 TIMEZONE RULES

- **DB Timezone**: `+05:30` (IST) — set in `knexfile.js`
- **All datetime comparisons** must be done in IST
- **All date strings** returned by `dateToISTDateString()` are in `YYYY-MM-DD` IST format
- **Night shift crossover boundary**: IST midnight (00:00) to IST 06:00 = "next calendar day but same logical shift day"
- **Never use `new Date()` raw for IST calculations** — always add `+05:30` offset explicitly:
  ```js
  const istDate = new Date(utcDate.getTime() + 5.5 * 60 * 60 * 1000);
  ```

---

## 📌 QUICK CHECKLIST BEFORE PUSHING ATTENDANCE CODE

- [ ] `isNightShift()` helper exists in both `attendanceService.js` and `machineAttendanceService.js`
- [ ] `getLogicalDateStr()` is used in `getMatrix()`, `getEmployeeAttendanceHistory()`, and `manualUpdateAttendance()`
- [ ] Biometric checkout does NOT update `check_out` if `workedHours < halfDayLimit`
- [ ] In-margin check uses `targetShiftDate` (not `dateStr`) for night shifts
- [ ] Manual override finds record by `getLogicalDateStr(check_in) === targetDate`, updates by `id`
- [ ] Night shift query window in matrix: fetches `[startDate-1, endDate+1]` to catch crossover records
- [ ] No duplicate variable declarations in async functions (`const` redeclarations crash Node.js)
- [ ] Every `try { }` block has a matching `catch { }` (count braces after every refactor)
- [ ] All date strings passed to DB are in `YYYY-MM-DD` format (IST)

---

*Last updated: June 2026 — covers Standard, Split (4-punch), Flexi, and Night/Rotational shifts.*
*All bugs listed in "Known Bugs Fixed" section have been verified with automated test scripts.*
