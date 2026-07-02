# 📋 MyFastHR - Attendance System Troubleshooting & Bug-Fix Guide

This document lists the major bugs discovered in the attendance engine (biometric sync, matrix generation, restore logs) along with their root causes and standard solutions. If attendance logic behaves unexpectedly in the future, refer to this guide or share it with the technical team.

---

## 🛠️ Summary of Key Fixes

### 1. The Duplicate Punch / Immediate Check-out Bug
*   **Symptom:** Employees who punched twice in a short duration (e.g., within 2–5 minutes) were marked as **Early Out (E)** or checked out immediately on the same minute, ruining their attendance status.
*   **Root Cause:** The sync/restore processor parsed the very next log entry as a check-out without verifying if there was a reasonable gap between the two punches.
*   **Solution:** 
    *   Implemented a **5-minute deduplication window** during the log restore process.
    *   Any check-out attempt occurring within 5 minutes of the check-in is ignored and discarded as a duplicate touch.
    *   *Where to check:* [restore_punches_from_debug_log.js](file:///d:/MyFastHR(18)/MyFastHR/MyFastHR/backend/src/scripts/restore_punches_from_debug_log.js).

---

### 2. Active Shift Override Sync Bug (Date-Specific Assignments)
*   **Symptom:** Historical logs restored for employees with date-specific shift overrides (e.g., changing from a morning shift to an evening shift on a specific day) were computed against their default shift, leading to false **Early Out** or **Late** flags.
*   **Root Cause:** The log-restore script resolved only the default shift from the `employees` table, ignoring date-specific overrides in `employee_shift_assignments`.
*   **Solution:**
    *   Added database lookup logic inside the restore script to check `employee_shift_assignments` by date range (`from_date` <= logDate <= `to_date`).
    *   *Where to check:* [restore_punches_from_debug_log.js](file:///d:/MyFastHR(18)/MyFastHR/MyFastHR/backend/src/scripts/restore_punches_from_debug_log.js).

---

### 3. Shift Assignment Priority Bug (The Ritesh Patel Case)
*   **Symptom:** The attendance muster grid resolved the wrong shift (e.g., default/old shift instead of the newly assigned shift), causing incorrect grace period calculations and missing orange grace dots.
*   **Root Cause:**
    *   When an employee has multiple active shift assignments without `to_date` values (e.g., shifted from Shift A to Shift B, then Shift C), the database returned them in ascending order of creation.
    *   The backend's `.find()` method matches the first element in the array. Thus, it matched the oldest assignment (first created) and ignored the latest ones.
*   **Solution:**
    *   Added sorting constraints `.orderBy('esa.from_date', 'desc').orderBy('esa.id', 'desc')` to all shift assignment queries.
    *   This forces the database to return the **newest/most recent shift assignment first**, allowing the `.find()` method to resolve the correct shift.
    *   *Where to check:* [attendanceService.js](file:///d:/MyFastHR(18)/MyFastHR/MyFastHR/backend/src/services/attendanceService.js) (inside `getMatrix`, `checkOut`, `manualOverride`, `getDayDetail`, etc.).

---

## 🔍 How to Run Diagnostics on the VPS

If an employee's attendance status or grace dot looks wrong, run these tools in the terminal at `/var/www/MyFastHR`:

### 1. Check Shift Resolution & Calculations
To print the exact shift parameters, punches, and grace calculations of an employee:
```bash
# Edit the script to replace employee code/dates if needed, then run:
node backend/src/scripts/debug_ritesh_matrix.js
```

### 2. Check the API Output Details
To verify if the API actually returns `is_grace: true` for the grid:
```bash
node backend/src/scripts/debug_ritesh_matrix_response.js
```

---

## 💡 Important Rules to Remember

1.  **Late In Requests:** If check-in time is greater than `Shift Start + Grace Limit` (even by seconds), the status becomes `pending` (displayed as `-` on the grid) and a request is raised. The orange grace dot only appears if the check-in is **within** the grace limit.
2.  **UTC vs IST Conversion:** All database datetime strings must be converted using `dbDateToUTC` to ensure calculations run in `Asia/Kolkata` time regardless of server timezone.
