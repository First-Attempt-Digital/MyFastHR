const db = require('../config/db');

class AnalyticsRepository {
    async getEmployeeStats(companyId, period) {
        // 1. Years In Service Distribution
        const serviceDistribution = await db.raw(`
            SELECT 
                CASE 
                    WHEN DATEDIFF(CURRENT_DATE, joining_date) / 365 < 1 THEN '< 1'
                    WHEN DATEDIFF(CURRENT_DATE, joining_date) / 365 BETWEEN 1 AND 2 THEN '1-2'
                    WHEN DATEDIFF(CURRENT_DATE, joining_date) / 365 BETWEEN 2 AND 4 THEN '2-4'
                    WHEN DATEDIFF(CURRENT_DATE, joining_date) / 365 BETWEEN 4 AND 7 THEN '4-7'
                    ELSE '> 7'
                END AS years,
                COUNT(*) as count
            FROM employees 
            WHERE company_id = ? AND joining_date IS NOT NULL
            GROUP BY years
        `, [companyId]);

        // 2. Additions & Attrition (Last 24 Months)
        const trends = await db.raw(`
            SELECT 
                DATE_FORMAT(joining_date, '%b %Y') as month,
                COUNT(*) as joined,
                SUM(CASE WHEN resignation_date IS NOT NULL THEN 1 ELSE 0 END) as resigned
            FROM employees
            WHERE company_id = ? AND joining_date >= DATE_SUB(CURRENT_DATE, INTERVAL 2 YEAR)
            GROUP BY month
            ORDER BY MIN(joining_date)
        `, [companyId]);

        let filteredTrends = trends[0] || [];
        if (period === '6_months') {
            const sixMonthsAgo = new Date();
            sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
            filteredTrends = filteredTrends.filter(t => {
                const d = new Date(t.month);
                return d >= sixMonthsAgo;
            });
        } else if (period === 'fiscal_year') {
            const now = new Date();
            const fiscalStartYear = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
            const fiscalStart = new Date(fiscalStartYear, 3, 1); // April 1st
            filteredTrends = filteredTrends.filter(t => {
                const d = new Date(t.month);
                return d >= fiscalStart;
            });
        }

        // 3. Location Distribution
        const locationDist = await db('employees')
            .where({ company_id: companyId })
            .select('office_location as location')
            .count('* as count')
            .avg('salary_basis as avg_ctc')
            .groupBy('office_location');

        // 4. Gender Distribution
        const genderDist = await db('employees')
            .where({ company_id: companyId })
            .select('gender')
            .count('* as count')
            .groupBy('gender');

        // 5. Age Distribution
        const ageDist = await db.raw(`
            SELECT 
                CASE 
                    WHEN TIMESTAMPDIFF(YEAR, date_of_birth, CURRENT_DATE) < 20 THEN '< 20'
                    WHEN TIMESTAMPDIFF(YEAR, date_of_birth, CURRENT_DATE) BETWEEN 20 AND 25 THEN '20-25'
                    WHEN TIMESTAMPDIFF(YEAR, date_of_birth, CURRENT_DATE) BETWEEN 25 AND 30 THEN '25-30'
                    WHEN TIMESTAMPDIFF(YEAR, date_of_birth, CURRENT_DATE) BETWEEN 30 AND 50 THEN '30-50'
                    ELSE '> 50'
                END AS age_range,
                COUNT(*) as count
            FROM employees 
            WHERE company_id = ? AND date_of_birth IS NOT NULL
            GROUP BY age_range
        `, [companyId]);

        // 6. Monthly CTC (Last 12 Months Payroll Components)
        const monthlyCTCRaw = await db('payrolls')
            .where({ company_id: companyId })
            .select('month', 'year')
            .sum('base_salary as base')
            .sum('total_allowances as allowances')
            .sum('total_deductions as deductions')
            .sum('net_salary as net')
            .groupBy('year', 'month')
            .orderBy('year', 'asc')
            .orderBy('month', 'asc')
            .limit(12);

        const monthlyCTC = monthlyCTCRaw.map(row => ({
            month: parseInt(row.month),
            year: parseInt(row.year),
            base: parseFloat(row.base) || 0,
            allowances: parseFloat(row.allowances) || 0,
            deductions: parseFloat(row.deductions) || 0,
            net: parseFloat(row.net) || 0
        }));

        // 7. Department Headcount Distribution
        const departmentDist = await db('employees')
            .leftJoin('departments', 'employees.department_id', 'departments.id')
            .where('employees.company_id', companyId)
            .select(db.raw('COALESCE(departments.name, employees.department, "Unassigned") as name'))
            .count('* as count')
            .groupByRaw('COALESCE(departments.name, employees.department, "Unassigned")');

        return {
            serviceDistribution: serviceDistribution[0],
            trends: filteredTrends,
            locationDist,
            genderDist,
            ageDist: ageDist[0],
            monthlyCTC,
            departmentDist
        };
    }

    async getManagerTeamStats(managerId) {
        // Team Overview
        const teamMetrics = await db('employees')
            .where({ manager_id: managerId })
            .select(
                db.raw('COUNT(*) as total_team'),
                db.raw('SUM(CASE WHEN status = "active" THEN 1 ELSE 0 END) as active_members')
            )
            .first();

        // Team Attendance Today
        const teamAttendance = await db('attendance')
            .join('employees', 'attendance.employee_id', 'employees.id')
            .where('employees.manager_id', managerId)
            .whereRaw('DATE(attendance.check_in) = CURRENT_DATE')
            .count('* as present_today');

        // Pending Team Leaves
        const pendingLeaves = await db('leaves')
            .join('employees', 'leaves.employee_id', 'employees.id')
            .where('employees.manager_id', managerId)
            .where('leaves.status', 'pending')
            .count('* as pending_count');

        // Team Tenure (Similar to main stats but filtered)
        const serviceDistribution = await db.raw(`
            SELECT 
                CASE 
                    WHEN DATEDIFF(CURRENT_DATE, joining_date) / 365 < 1 THEN '< 1'
                    WHEN DATEDIFF(CURRENT_DATE, joining_date) / 365 BETWEEN 1 AND 2 THEN '1-2'
                    ELSE '> 2'
                END AS years,
                COUNT(*) as count
            FROM employees 
            WHERE manager_id = ? AND joining_date IS NOT NULL
            GROUP BY years
        `, [managerId]);

        return {
            totalTeam: teamMetrics.total_team,
            activeMembers: teamMetrics.active_members,
            presentToday: teamAttendance[0].present_today,
            pendingLeaves: pendingLeaves[0].pending_count,
            serviceDistribution: serviceDistribution[0]
        };
    }

    async getEmployeePersonalStats(employeeId) {
        const employee = await db('employees')
            .leftJoin('departments', 'employees.department_id', 'departments.id')
            .where('employees.id', employeeId)
            .select('employees.*', db.raw('COALESCE(departments.name, employees.department) as department_name'))
            .first();
            
        if (!employee) return {};

        const employeeName = `${employee.first_name} ${employee.last_name}`;
        const employeeIdNumber = employee.employee_id_number;
        const department = employee.department_name;
        const designation = employee.designation;
        const companyId = employee.company_id;
        const currentMonth = new Date().getMonth() + 1;
        const currentYear = new Date().getFullYear();

        // 1. Fetch Company Rules for enforcement
        const rules = await db('working_rules').where({ company_id: companyId }).first() || {
            max_late_allowed: 3,
            late_deduction_type: 'none',
            shift_start: '10:00',
            shift_end: '18:00'
        };

        const shiftStart = rules.shift_start;
        const shiftEnd = rules.shift_end || '18:00';

        // 2. Personal Leave Balance
        const leaveStats = await db('leaves')
            .where({ employee_id: employeeId })
            .select('status')
            .count('* as count')
            .groupBy('status');

        // 3. Attendance Trend & Late Count (Current Month)
        const attendanceStats = await db('attendance')
            .where({ employee_id: employeeId })
            .whereRaw('MONTH(check_in) = ? AND YEAR(check_in) = ?', [currentMonth, currentYear])
            .select('status')
            .count('* as count')
            .groupBy('status');
        
        const lateCount = parseInt(attendanceStats.find(s => s.status === 'L' || s.status === 'late')?.count || 0);

        // 4. Projected Salary (Quick Preview)
        const salary = await db('salary_structures').where({ employee_id: employeeId, company_id: companyId }).first();
        let projectedNet = null;
        if (salary) {
            const base = parseFloat(salary.base_salary);
            const extraLates = lateCount;
            const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
            const dailyRate = base / daysInMonth;
            
            let deduction = 0;
            if (rules.late_deduction_type === 'half_day') deduction = extraLates * (dailyRate * 0.5);
            else if (rules.late_deduction_type === 'full_day') deduction = extraLates * dailyRate;

            projectedNet = (base - deduction).toFixed(2);
        }

        // 5. Upcoming Holidays
        const upcomingHolidays = await db('holidays')
            .where({ company_id: companyId })
            .where('date', '>=', db.raw('CURRENT_DATE'))
            .orderBy('date', 'asc')
            .limit(5);

        // 6. Current Attendance Status
        const currentAttendance = await db('attendance')
            .where({ employee_id: employeeId, company_id: companyId, check_out: null })
            .whereRaw('DATE(check_in) = CURRENT_DATE')
            .first();

        return {
            employee_name: employeeName,
            employee_id_number: employeeIdNumber,
            department,
            designation,
            shift_start: shiftStart,
            shift_end: shiftEnd,
            leaveStats,
            lateCount,
            maxLateAllowed: rules.max_late_allowed,
            lateDeductionType: rules.late_deduction_type,
            projectedNet,
            upcomingHolidays,
            leaveBalance: 12 - (leaveStats.find(s => s.status === 'approved')?.count || 0),
            is_checked_in: !!currentAttendance
        };
    }

    async getPlatformStats() {
        const isSqlite = db.client.config.client === 'sqlite3';
        
        // 1. Core KPIs
        const totalCompanies = await db('companies').count('* as count').first();
        const totalEmployees = await db('employees').count('* as count').first();
        const activeUsers = await db('users').where({ status: 'active' }).count('* as count').first();
        
        const totalPayrollRes = await db('payrolls').sum('net_salary as total').first();
        const totalPayroll = parseFloat(totalPayrollRes?.total) || 0;

        // Current Date local string ISO
        const now = new Date();
        const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        
        const attendanceTodayRes = await db('attendance')
            .whereRaw('DATE(check_in) = ?', [todayStr])
            .countDistinct('employee_id as count')
            .first();
        const attendanceToday = attendanceTodayRes?.count || 0;

        // 2. Compliance Matrix (Global KYC Health)
        const compliance = await db('employee_documents')
            .select('status')
            .count('* as count')
            .groupBy('status');

        // 3. Tenant Growth Velocity (Last 6 Months)
        const dateExpr = isSqlite ? "strftime('%m-%Y', created_at)" : "DATE_FORMAT(created_at, '%b %Y')";
        const growth = await db('companies')
            .select(db.raw(`${dateExpr} as month`))
            .count('* as count')
            .groupBy('month')
            .orderBy(db.raw('MIN(created_at)'))
            .limit(6);

        // 4. Company Breakdown
        const companies = await db('companies').select('id', 'name', 'subscription_status');
        const companiesBreakdown = [];
        for (const company of companies) {
            const empCountRes = await db('employees').where({ company_id: company.id, status: 'active' }).count('* as count').first();
            const payrollSumRes = await db('payrolls').where({ company_id: company.id }).sum('net_salary as total').first();
            const attTodayRes = await db('attendance')
                .where('company_id', company.id)
                .whereRaw('DATE(check_in) = ?', [todayStr])
                .countDistinct('employee_id as count')
                .first();

            companiesBreakdown.push({
                id: company.id,
                name: company.name,
                status: company.subscription_status || 'active',
                employees: empCountRes?.count || 0,
                totalPayroll: parseFloat(payrollSumRes?.total) || 0,
                attendanceToday: attTodayRes?.count || 0
            });
        }

        // 5. Global Monthly Payroll Trend (Last 6 Months)
        const payrollTrendRaw = await db('payrolls')
            .select('month', 'year')
            .sum('net_salary as amount')
            .groupBy('year', 'month')
            .orderBy('year', 'desc')
            .orderBy('month', 'desc')
            .limit(6);
        
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const payrollTrend = payrollTrendRaw.map(row => ({
            month: `${monthNames[row.month - 1]} ${row.year}`,
            amount: parseFloat(row.amount) || 0
        })).reverse();

        // 6. Global Attendance Source Distribution
        const sourcesRaw = await db('attendance')
            .select('punch_source')
            .count('* as count')
            .groupBy('punch_source');

        // 7. Additional Real Data Metrics
        const avgSalaryRes = await db('employees').where({ status: 'active' }).avg('salary_basis as average').first();
        const avgSalary = parseFloat(avgSalaryRes?.average) || 0;

        const onLeaveTodayRes = await db('leaves')
            .where('status', 'approved')
            .whereRaw('? BETWEEN start_date AND end_date', [todayStr])
            .countDistinct('employee_id as count')
            .first();
        const onLeaveToday = onLeaveTodayRes?.count || 0;

        const recentSignups = await db('companies')
            .select('id', 'name', 'created_at')
            .orderBy('created_at', 'desc')
            .limit(5);

        const tiersRes = await db('companies')
            .select('subscription_status')
            .count('* as count')
            .groupBy('subscription_status');

        return {
            totalCompanies: totalCompanies.count,
            totalEmployees: totalEmployees.count,
            activeUsers: activeUsers.count,
            totalPayroll,
            attendanceToday,
            avgSalary,
            onLeaveToday,
            recentSignups,
            tierDistribution: tiersRes,
            compliance,
            growth,
            companiesBreakdown,
            payrollTrend,
            sourcesDistribution: sourcesRaw
        };
    }

    async getLeaveAttendanceOverview(companyId, employeeId, role, monthName, year) {
        // 1. Determine active employee IDs in scope
        let employeeIds = [];
        if (role === 'super_admin' || role === 'company_admin') {
            const emps = await db('employees')
                .where({ company_id: companyId, status: 'active' })
                .select('id');
            employeeIds = emps.map(e => e.id);
        } else if (role === 'manager') {
            const emps = await db('employees')
                .where({ company_id: companyId, manager_id: employeeId, status: 'active' })
                .select('id');
            employeeIds = emps.map(e => e.id);
        } else {
            employeeIds = [employeeId];
        }

        // If no employees are in scope, return zeroed structure immediately
        if (employeeIds.length === 0) {
            return {
                presentToday: 0,
                activeEmployees: 0,
                pendingLeaves: 0,
                punctualRate: '100%',
                deficitHours: '0.0h',
                yearlyTrend: Array(12).fill(0).map((_, i) => ({ month: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][i], count: 0 })),
                summary: {
                    averageWorkHours: '00:00',
                    absentDays: 0,
                    holidays: 0
                },
                attendanceSources: [
                    { label: 'Mobile App', count: 0, icon: 'Smartphone', color: 'text-indigo-600', bg: 'bg-indigo-50' },
                    { label: 'Web Portal', count: 0, icon: 'Monitor', color: 'text-emerald-600', bg: 'bg-emerald-50' },
                    { label: 'Machine', count: 0, icon: 'HardDrive', color: 'text-rose-600', bg: 'bg-rose-50' }
                ],
                whosIn: [],
                leaveTypes: [],
                topTakers: [],
                pendingWorkflow: []
            };
        }

        // Map month name to number
        const monthMap = {
            'Jan': 1, 'Feb': 2, 'Mar': 3, 'Apr': 4, 'May': 5, 'Jun': 6,
            'Jul': 7, 'Aug': 8, 'Sep': 9, 'Oct': 10, 'Nov': 11, 'Dec': 12
        };
        const currentMonthNum = new Date().getMonth() + 1;
        const monthNum = monthMap[monthName] || currentMonthNum;

        // Dialect checking
        const isSqlite = db.client.config.client === 'sqlite3';
        const yearExpr = isSqlite ? "strftime('%Y', check_in)" : "YEAR(check_in)";
        const monthExpr = isSqlite ? "strftime('%m', check_in)" : "MONTH(check_in)";

        // Today date calculation (local)
        const nowTime = new Date();
        const todayStr = `${nowTime.getFullYear()}-${String(nowTime.getMonth() + 1).padStart(2, '0')}-${String(nowTime.getDate()).padStart(2, '0')}`;

        // A. Stats: Present Today
        const presentTodayRes = await db('attendance')
            .whereIn('employee_id', employeeIds)
            .whereRaw('DATE(check_in) = ?', [todayStr])
            .countDistinct('employee_id as count')
            .first();
        const presentToday = presentTodayRes ? parseInt(presentTodayRes.count) || 0 : 0;

        // B. Stats: Active Employees (Total)
        const activeEmployees = employeeIds.length;

        // C. Stats: Pending Leaves
        const pendingLeavesRes = await db('leaves')
            .whereIn('employee_id', employeeIds)
            .where('status', 'pending')
            .count('* as count')
            .first();
        const pendingLeaves = pendingLeavesRes ? parseInt(pendingLeavesRes.count) || 0 : 0;

        // D. Stats: Punctual Rate (selected month/year checkins that are 'present')
        const checkinsRes = await db('attendance')
            .whereIn('employee_id', employeeIds)
            .whereRaw(isSqlite 
                ? `strftime('%m', check_in) = ? AND strftime('%Y', check_in) = ?`
                : `MONTH(check_in) = ? AND YEAR(check_in) = ?`,
                [String(monthNum).padStart(2, '0'), String(year)])
            .select('status')
            .count('* as count')
            .groupBy('status');

        let totalCheckins = 0;
        let presentCheckins = 0;
        for (const row of checkinsRes) {
            const count = parseInt(row.count) || 0;
            totalCheckins += count;
            if (row.status === 'present' || row.status === 'on-time') {
                presentCheckins += count;
            }
        }
        const punctualRate = totalCheckins > 0 ? Math.round((presentCheckins / totalCheckins) * 100) : 100;

        // E. Stats: Deficit Hours (today's deficit based on check-in duration vs shift rules)
        const todayAttendance = await db('attendance')
            .leftJoin('employees', 'attendance.employee_id', 'employees.id')
            .leftJoin('shifts', 'employees.shift_id', 'shifts.id')
            .whereIn('attendance.employee_id', employeeIds)
            .whereRaw('DATE(attendance.check_in) = ?', [todayStr])
            .select('attendance.*', 'shifts.start_time', 'shifts.end_time');

        let totalDeficitMinutes = 0;
        for (const record of todayAttendance) {
            const checkInTime = new Date(record.check_in);
            const checkOutTime = record.check_out ? new Date(record.check_out) : nowTime;
            const workedMins = Math.floor((checkOutTime - checkInTime) / 60000);

            let shiftMins = 540; // 9 hours
            if (record.start_time && record.end_time) {
                const [sh, sm] = record.start_time.split(':').map(Number);
                const [eh, em] = record.end_time.split(':').map(Number);
                let diff = (eh * 60 + em) - (sh * 60 + sm);
                if (diff < 0) diff += 24 * 60; // night shift
                shiftMins = diff;
            }

            if (workedMins < shiftMins) {
                totalDeficitMinutes += (shiftMins - workedMins);
            }
        }
        const deficitHours = (totalDeficitMinutes / 60).toFixed(1);

        // F. Attendance Pulse (Yearly Trend)
        const yearlyTrendRes = await db('attendance')
            .whereIn('employee_id', employeeIds)
            .whereRaw(isSqlite ? `strftime('%Y', check_in) = ?` : `YEAR(check_in) = ?`, [String(year)])
            .select(db.raw(`${monthExpr} as month_num`))
            .count('* as count')
            .groupBy('month_num');

        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const yearlyTrend = monthNames.map((m, idx) => {
            const found = yearlyTrendRes.find(r => parseInt(r.month_num) === (idx + 1));
            return {
                month: m,
                count: found ? parseInt(found.count) || 0 : 0
            };
        });

        // G. Summary: Average Work Hours, Absent Days, Holidays
        let avgSeconds = 0;
        if (isSqlite) {
            const res = await db('attendance')
                .whereIn('employee_id', employeeIds)
                .whereRaw(`strftime('%m', check_in) = ? AND strftime('%Y', check_in) = ?`, [String(monthNum).padStart(2, '0'), String(year)]);
            let totalSeconds = 0;
            let count = 0;
            for (const row of res) {
                if (row.check_out) {
                    totalSeconds += Math.floor((new Date(row.check_out) - new Date(row.check_in)) / 1000);
                    count++;
                }
            }
            avgSeconds = count > 0 ? (totalSeconds / count) : 0;
        } else {
            const res = await db('attendance')
                .whereIn('employee_id', employeeIds)
                .whereRaw(`MONTH(check_in) = ? AND YEAR(check_in) = ?`, [monthNum, year])
                .whereNotNull('check_out')
                .select(db.raw('AVG(TIMESTAMPDIFF(SECOND, check_in, check_out)) as avg_seconds'))
                .first();
            avgSeconds = res ? parseFloat(res.avg_seconds) || 0 : 0;
        }

        const avgHours = Math.floor(avgSeconds / 3600);
        const avgMins = Math.floor((avgSeconds % 3600) / 60);
        const averageWorkHours = `${String(avgHours).padStart(2, '0')}:${String(avgMins).padStart(2, '0')}`;

        // Absents & Holidays
        const daysInMonth = new Date(year, monthNum, 0).getDate();
        const weekoffs = ['Sunday'];
        const rules = await db('working_rules').where({ company_id: companyId }).first();
        let rulesWeekoffs = [];
        if (rules && rules.weekoffs) {
            try {
                rulesWeekoffs = typeof rules.weekoffs === 'string' ? JSON.parse(rules.weekoffs) : rules.weekoffs;
            } catch (e) {}
        }
        const activeWeekoffs = rulesWeekoffs.length > 0 ? rulesWeekoffs : weekoffs;

        const holidays = await db('holidays')
            .where({ company_id: companyId })
            .whereRaw(isSqlite 
                ? `strftime('%m', date) = ? AND strftime('%Y', date) = ?`
                : `MONTH(date) = ? AND YEAR(date) = ?`,
                [String(monthNum).padStart(2, '0'), String(year)])
            .select('date');
        const holidayDates = holidays.map(h => {
            const d = new Date(h.date);
            return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        });

        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        let workingDays = [];
        const maxDay = (year === nowTime.getFullYear() && monthNum === (nowTime.getMonth() + 1)) ? nowTime.getDate() : daysInMonth;

        for (let d = 1; d <= maxDay; d++) {
            const dateObj = new Date(year, monthNum - 1, d);
            const dayName = dayNames[dateObj.getDay()];
            const dateStr = `${year}-${String(monthNum).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

            if (activeWeekoffs.includes(dayName)) continue;
            if (holidayDates.includes(dateStr)) continue;

            workingDays.push(dateStr);
        }

        const checkins = await db('attendance')
            .whereIn('employee_id', employeeIds)
            .whereRaw(isSqlite 
                ? `strftime('%m', check_in) = ? AND strftime('%Y', check_in) = ?`
                : `MONTH(check_in) = ? AND YEAR(check_in) = ?`,
                [String(monthNum).padStart(2, '0'), String(year)])
            .select('employee_id', 'check_in');

        const approvedLeaves = await db('leaves')
            .whereIn('employee_id', employeeIds)
            .where('status', 'approved')
            .select('employee_id', 'start_date', 'end_date');

        let absentDays = 0;
        for (const empId of employeeIds) {
            for (const wDay of workingDays) {
                const hasCheckin = checkins.some(c => {
                    const d = new Date(c.check_in);
                    const cStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                    return c.employee_id === empId && cStr === wDay;
                });

                if (hasCheckin) continue;

                const hasLeave = approvedLeaves.some(l => {
                    const start = new Date(l.start_date).toISOString().slice(0, 10);
                    const end = new Date(l.end_date).toISOString().slice(0, 10);
                    return l.employee_id === empId && wDay >= start && wDay <= end;
                });

                if (hasLeave) continue;

                absentDays++;
            }
        }

        // H. Attendance Sources
        const sourcesRes = await db('attendance')
            .whereIn('employee_id', employeeIds)
            .whereRaw('DATE(check_in) = ?', [todayStr])
            .select('punch_source')
            .count('* as count')
            .groupBy('punch_source');

        const attendanceSources = [
            { label: 'Mobile App', count: 0, icon: 'Smartphone', color: 'text-indigo-600', bg: 'bg-indigo-50', key: 'mobile' },
            { label: 'Web Portal', count: 0, icon: 'Monitor', color: 'text-emerald-600', bg: 'bg-emerald-50', key: 'web' },
            { label: 'Machine', count: 0, icon: 'HardDrive', color: 'text-rose-600', bg: 'bg-rose-50', key: 'machine' }
        ];

        for (const row of sourcesRes) {
            const src = (row.punch_source || 'web').toLowerCase();
            if (src === 'mobile') attendanceSources[0].count = parseInt(row.count) || 0;
            else if (src === 'web') attendanceSources[1].count = parseInt(row.count) || 0;
            else attendanceSources[2].count = parseInt(row.count) || 0;
        }

        // I. Who's In Today
        const whosInRaw = await db('attendance')
            .join('employees', 'attendance.employee_id', 'employees.id')
            .whereIn('attendance.employee_id', employeeIds)
            .whereRaw('DATE(attendance.check_in) = ?', [todayStr])
            .select(
                'employees.first_name',
                'employees.last_name',
                'attendance.check_in',
                'attendance.punch_source',
                'attendance.status'
            )
            .orderBy('attendance.check_in', 'asc');

        const whosIn = whosInRaw.map(w => {
            const firstName = w.first_name || '';
            const lastName = w.last_name || '';
            const initials = (firstName.slice(0, 1) + lastName.slice(0, 1)).toUpperCase();

            const checkInDate = new Date(w.check_in);
            const timeStr = checkInDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata' });

            const rawSource = w.punch_source || 'web';
            const source = rawSource.charAt(0).toUpperCase() + rawSource.slice(1).toLowerCase();
            const status = w.status === 'present' ? 'On-time' : w.status === 'late' ? 'Late' : w.status;

            return {
                name: `${firstName} ${lastName}`,
                time: timeStr,
                source: source,
                avatar: initials,
                status: status
            };
        });

        // J. Leave Mix (percentage by type)
        const leaveMixRaw = await db('leaves')
            .join('leave_types', 'leaves.leave_type_id', 'leave_types.id')
            .whereIn('leaves.employee_id', employeeIds)
            .where('leaves.status', 'approved')
            .whereRaw(isSqlite 
                ? `strftime('%m', leaves.start_date) = ? AND strftime('%Y', leaves.start_date) = ?`
                : `MONTH(leaves.start_date) = ? AND YEAR(leaves.start_date) = ?`,
                [String(monthNum).padStart(2, '0'), String(year)])
            .select('leave_types.name', 'leave_types.color')
            .sum('leaves.days as total_days')
            .groupBy('leave_types.name', 'leave_types.color');

        const totalLeaveDays = leaveMixRaw.reduce((sum, item) => sum + (parseFloat(item.total_days) || 0), 0);
        const leaveTypes = leaveMixRaw.map(item => {
            const val = totalLeaveDays > 0 ? Math.round(((parseFloat(item.total_days) || 0) / totalLeaveDays) * 100) : 0;
            return {
                name: item.name.replace(' Leave', ''),
                value: val,
                color: item.color || '#6366f1'
            };
        });

        // K. Top Absence Record (approved leave days count)
        const topTakersRaw = await db('leaves')
            .join('employees', 'leaves.employee_id', 'employees.id')
            .leftJoin('departments', 'employees.department_id', 'departments.id')
            .whereIn('leaves.employee_id', employeeIds)
            .where('leaves.status', 'approved')
            .whereRaw(isSqlite 
                ? `strftime('%m', leaves.start_date) = ? AND strftime('%Y', leaves.start_date) = ?`
                : `MONTH(leaves.start_date) = ? AND YEAR(leaves.start_date) = ?`,
                [String(monthNum).padStart(2, '0'), String(year)])
            .select(
                'employees.first_name',
                'employees.last_name',
                'departments.name as dept'
            )
            .sum('leaves.days as count')
            .groupBy('employees.id', 'employees.first_name', 'employees.last_name', 'departments.name')
            .orderBy('count', 'desc')
            .limit(5);

        const topTakers = topTakersRaw.map(t => {
            const firstName = t.first_name || '';
            const lastName = t.last_name || '';
            const initials = (firstName.slice(0, 1) + lastName.slice(0, 1)).toUpperCase();
            return {
                name: `${firstName} ${lastName}`,
                count: parseFloat(t.count) || 0,
                dept: t.dept || 'General',
                avatar: initials
            };
        });

        // L. Pending Workflow
        const pendingWorkflowRaw = await db('leaves')
            .join('employees', 'leaves.employee_id', 'employees.id')
            .join('leave_types', 'leaves.leave_type_id', 'leave_types.id')
            .whereIn('leaves.employee_id', employeeIds)
            .where('leaves.status', 'pending')
            .select(
                'leaves.id',
                'employees.first_name',
                'employees.last_name',
                'leave_types.name as leave_type',
                'leaves.days',
                'leaves.created_at'
            )
            .orderBy('leaves.created_at', 'desc');

        const getRelativeTime = (dateStr) => {
            const created = new Date(dateStr);
            const diffMs = new Date() - created;
            const diffMins = Math.floor(diffMs / 60000);
            const diffHours = Math.floor(diffMins / 60);
            const diffDays = Math.floor(diffHours / 24);

            if (diffMins < 60) return `${diffMins}m ago`;
            if (diffHours < 24) return `${diffHours}h ago`;
            return `${diffDays}d ago`;
        };

        const pendingWorkflow = pendingWorkflowRaw.map(p => {
            return {
                id: p.id,
                name: `${p.first_name || ''} ${p.last_name || ''}`,
                leaveType: (p.leave_type || 'Leave').replace(' Leave', ''),
                applied: getRelativeTime(p.created_at),
                days: p.days
            };
        });
        return {
            presentToday,
            activeEmployees,
            pendingLeaves,
            punctualRate: `${punctualRate}%`,
            deficitHours: `${deficitHours}h`,
            yearlyTrend,
            summary: {
                averageWorkHours: averageWorkHours,
                absentDays: absentDays,
                holidays: holidayDates.length
            },
            attendanceSources,
            whosIn,
            leaveTypes,
            topTakers,
            pendingWorkflow
        };
    }

        async getRecentActivities(companyId) {
            try {
                // Fetch concurrent records from different operational areas
                const [hires, leaves, regularizations, separations, overrides] = await Promise.all([
                    // 1. Employees (Hires / Onboarding)
                    db('employees')
                        .where('company_id', companyId)
                        .select('first_name', 'last_name', 'created_at', 'designation', 'onboarding_status')
                        .orderBy('created_at', 'desc')
                        .limit(10),

                    // 2. Leaves
                    db('leaves as l')
                        .join('employees as e', 'l.employee_id', 'e.id')
                        .join('leave_types as lt', 'l.leave_type_id', 'lt.id')
                        .where('e.company_id', companyId)
                        .select('l.created_at', 'l.status', 'l.days', 'e.first_name', 'e.last_name', 'lt.name as leave_type')
                        .orderBy('l.created_at', 'desc')
                        .limit(10),

                    // 3. Regularizations
                    db('attendance_regularizations as ar')
                        .join('employees as e', 'ar.employee_id', 'e.id')
                        .where('e.company_id', companyId)
                        .select('ar.created_at', 'ar.status', 'ar.date', 'e.first_name', 'e.last_name')
                        .orderBy('ar.created_at', 'desc')
                        .limit(10),

                    // 4. Separations
                    db('employee_separations as es')
                        .join('employees as e', 'es.employee_id', 'e.id')
                        .where('e.company_id', companyId)
                        .select('es.created_at', 'es.settlement_status', 'e.first_name', 'e.last_name')
                        .orderBy('es.created_at', 'desc')
                        .limit(10),

                    // 5. Overrides
                    db('attendance_override_history as aoh')
                        .join('employees as e', 'aoh.employee_id', 'e.id')
                        .where('e.company_id', companyId)
                        .select('aoh.created_at', 'aoh.overridden_by_name', 'e.first_name', 'e.last_name', 'aoh.attendance_date', 'aoh.updated_status')
                        .orderBy('aoh.created_at', 'desc')
                        .limit(10)
                ]);

                const activities = [];

                // Helpers for name abbreviation and relative time
                const formatName = (first, last) => {
                    const f = first || '';
                    const l = last ? last.charAt(0) + '.' : '';
                    return `${f} ${l}`.trim();
                };

                const getRelativeTime = (date) => {
                    const created = new Date(date);
                    const diffMs = new Date() - created;
                    const diffMins = Math.floor(diffMs / 60000);
                    const diffHours = Math.floor(diffMins / 60);
                    const diffDays = Math.floor(diffHours / 24);

                    if (isNaN(created.getTime())) return 'unknown time';
                    if (diffMins < 1) return 'just now';
                    if (diffMins < 60) return `${diffMins} mins ago`;
                    if (diffHours < 24) return `${diffHours} hours ago`;
                    if (diffDays === 1) return 'yesterday';
                    return `${diffDays} days ago`;
                };

                // Map employees
                hires.forEach(h => {
                    const name = formatName(h.first_name, h.last_name);
                    if (h.onboarding_status === 'approved') {
                        activities.push({
                            user: name,
                            action: `Joined as ${h.designation || 'Staff'}`,
                            time: getRelativeTime(h.created_at),
                            timestamp: new Date(h.created_at),
                            type: 'hiring'
                        });
                    } else if (h.onboarding_status === 'submitted') {
                        activities.push({
                            user: name,
                            action: `Submitted onboarding profile`,
                            time: getRelativeTime(h.created_at),
                            timestamp: new Date(h.created_at),
                            type: 'hiring'
                        });
                    } else {
                        activities.push({
                            user: 'System',
                            action: `Generated onboarding link for ${name}`,
                            time: getRelativeTime(h.created_at),
                            timestamp: new Date(h.created_at),
                            type: 'system'
                        });
                    }
                });

                // Map leaves
                leaves.forEach(l => {
                    const name = formatName(l.first_name, l.last_name);
                    const lName = (l.leave_type || 'Leave').replace(' Leave', '');
                    if (l.status === 'pending') {
                        activities.push({
                            user: name,
                            action: `Applied for ${lName} (${l.days} days)`,
                            time: getRelativeTime(l.created_at),
                            timestamp: new Date(l.created_at),
                            type: 'leave'
                        });
                    } else {
                        activities.push({
                            user: 'Admin',
                            action: `${l.status.charAt(0).toUpperCase() + l.status.slice(1)} leave for ${name}`,
                            time: getRelativeTime(l.created_at),
                            timestamp: new Date(l.created_at),
                            type: 'leave'
                        });
                    }
                });

                // Map regularizations
                regularizations.forEach(ar => {
                    const name = formatName(ar.first_name, ar.last_name);
                    const d = new Date(ar.date);
                    const dateStr = d.toLocaleDateString([], { month: 'short', day: 'numeric' });
                    if (ar.status === 'pending') {
                        activities.push({
                            user: name,
                            action: `Requested regularization for ${dateStr}`,
                            time: getRelativeTime(ar.created_at),
                            timestamp: new Date(ar.created_at),
                            type: 'attendance'
                        });
                    } else {
                        activities.push({
                            user: 'Admin',
                            action: `${ar.status.charAt(0).toUpperCase() + ar.status.slice(1)} regularization for ${name}`,
                            time: getRelativeTime(ar.created_at),
                            timestamp: new Date(ar.created_at),
                            type: 'attendance'
                        });
                    }
                });

                // Map separations
                separations.forEach(es => {
                    const name = formatName(es.first_name, es.last_name);
                    if (es.settlement_status === 'settled') {
                        activities.push({
                            user: 'Admin',
                            action: `Settled FNF parameters for ${name}`,
                            time: getRelativeTime(es.created_at),
                            timestamp: new Date(es.created_at),
                            type: 'system'
                        });
                    } else {
                        activities.push({
                            user: name,
                            action: `Requested resignation / separation`,
                            time: getRelativeTime(es.created_at),
                            timestamp: new Date(es.created_at),
                            type: 'system'
                        });
                    }
                });

                // Map overrides
                overrides.forEach(aoh => {
                    const name = formatName(aoh.first_name, aoh.last_name);
                    const uStatus = String(aoh.updated_status).toLowerCase();
                    activities.push({
                        user: aoh.overridden_by_name || 'Admin',
                        action: `Modified attendance of ${name} to ${uStatus}`,
                        time: getRelativeTime(aoh.created_at),
                        timestamp: new Date(aoh.created_at),
                        type: 'security'
                    });
                });

                // Sort by timestamp desc and take the top 8
                activities.sort((a, b) => b.timestamp - a.timestamp);
                return activities.slice(0, 8);
            } catch (err) {
                console.error('Error fetching activities:', err);
                return [];
            }
        }
    }

module.exports = new AnalyticsRepository();

