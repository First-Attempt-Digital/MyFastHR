const payrollRepository = require('../repositories/payrollRepository');
const attendanceRepository = require('../repositories/attendanceRepository');
const db = require('../config/db');

function safeParseJson(data) {
    if (!data) return [];
    try {
        const parsed = typeof data === 'string' ? JSON.parse(data) : data;
        return typeof parsed === 'string' ? JSON.parse(parsed) : (parsed || []);
    } catch (e) {
        return [];
    }
}
const PDFDocument = require('pdfkit');
const notificationService = require('./notificationService');

const convertNumberToWords = (num) => {
    const a = [
        '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
        'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'
    ];
    const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    const numToWords = (n) => {
        if (n < 20) return a[n];
        if (n < 100) return b[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + a[n % 10] : '');
        if (n < 1000) return a[Math.floor(n / 100)] + ' Hundred' + (n % 100 !== 0 ? ' and ' + numToWords(n % 100) : '');
        if (n < 100000) return numToWords(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 !== 0 ? ' ' + numToWords(n % 1000) : '');
        if (n < 10000000) return numToWords(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 !== 0 ? ' ' + numToWords(n % 100000) : '');
        return numToWords(Math.floor(n / 10000000)) + ' Crore' + (n % 10000000 !== 0 ? ' ' + numToWords(n % 10000000) : '');
    };

    const parsed = parseInt(num, 10);
    if (isNaN(parsed) || parsed === 0) return 'Zero';
    return numToWords(parsed) + ' Rupees Only';
};

class PayrollService {
    resolveActiveTenure(joiningDateStr, resignationDateStr, month, year) {
        const daysInMonth = new Date(year, month, 0).getDate();
        let startDay = 1;
        let endDay = daysInMonth;

        const toLocalYMD = (dateVal) => {
            if (!dateVal) return null;
            const d = new Date(dateVal);
            if (isNaN(d.getTime())) return null;
            const y = d.getFullYear();
            const m = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            return `${y}-${m}-${day}`;
        };

        if (joiningDateStr) {
            const joinStr = toLocalYMD(joiningDateStr);
            const startOfMonthStr = `${year}-${String(month).padStart(2, '0')}-01`;
            const endOfMonthStr = `${year}-${String(month).padStart(2, '0')}-${daysInMonth}`;
            
            if (joinStr > endOfMonthStr) {
                return { activeDays: 0, preJoiningDays: daysInMonth, postResignationDays: 0 };
            }
            if (joinStr >= startOfMonthStr && joinStr <= endOfMonthStr) {
                startDay = parseInt(joinStr.split('-')[2], 10);
            }
        }

        if (resignationDateStr) {
            const resignStr = toLocalYMD(resignationDateStr);
            const startOfMonthStr = `${year}-${String(month).padStart(2, '0')}-01`;
            const endOfMonthStr = `${year}-${String(month).padStart(2, '0')}-${daysInMonth}`;
            
            if (resignStr < startOfMonthStr) {
                return { activeDays: 0, preJoiningDays: 0, postResignationDays: daysInMonth };
            }
            if (resignStr >= startOfMonthStr && resignStr <= endOfMonthStr) {
                endDay = parseInt(resignStr.split('-')[2], 10);
            }
        }

        const activeDays = Math.max(0, endDay - startDay + 1);
        const preJoiningDays = startDay - 1;
        const postResignationDays = daysInMonth - endDay;

        return { activeDays, preJoiningDays, postResignationDays };
    }

    async getActiveSalaryStructure(employeeId, companyId, month, year) {
        const lastDay = new Date(year, month, 0).getDate();
        const endOfMonthStr = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
        
        // Find latest revision that has effective_from set and is on or before the end of the month
        const activeRevision = await db('salary_structures')
            .where({ employee_id: employeeId, company_id: companyId })
            .whereNotNull('effective_from')
            .where('effective_from', '<=', endOfMonthStr)
            .orderBy('effective_from', 'desc')
            .orderBy('id', 'desc')
            .first();

        if (activeRevision) {
            return {
                ...activeRevision,
                isRevision: true
            };
        }

        // Fallback to the first/default structure without effective_from
        const legacyStructure = await db('salary_structures')
            .where({ employee_id: employeeId, company_id: companyId })
            .whereNull('effective_from')
            .first();
            
        if (legacyStructure) {
            return {
                ...legacyStructure,
                isRevision: false
            };
        }
        
        // Final fallback if only structures with effective_from exist but none matched the date query
        const fallback = await db('salary_structures')
            .where({ employee_id: employeeId, company_id: companyId })
            .orderBy('id', 'desc')
            .first();
            
        return fallback ? { ...fallback, isRevision: false } : null;
    }

    calculateProratedSalaryComponents(activeRevision, paidDays, daysInMonth, stats, rules, manDeduction, loanEmi, otBonus, unpaidLeaveDays = null, emp = null) {
        const baseSalary = parseFloat(activeRevision.basic);
        const totalAllowances = parseFloat(activeRevision.hra) + parseFloat(activeRevision.special_allowance || 0) + parseFloat(activeRevision.medical_allowance || 0);
        const totalDeductions = 0;

        const prorationFactor = paidDays / daysInMonth;
        const earnedBasic = baseSalary * prorationFactor;
        const earnedHra = (parseFloat(activeRevision.hra) || 0) * prorationFactor;
        const earnedSpecial = (parseFloat(activeRevision.special_allowance) || 0) * prorationFactor;
        const earnedMedical = (parseFloat(activeRevision.medical_allowance) || 0) * prorationFactor;
        const earnedGross = earnedBasic + earnedHra + earnedSpecial + earnedMedical;

        const dailyGross = parseFloat(activeRevision.gross_salary) / daysInMonth;
        const unpaidLeaveDeduction = unpaidLeaveDays !== null 
            ? unpaidLeaveDays * dailyGross 
            : parseFloat(activeRevision.gross_salary) - earnedGross;

        const includePf = emp ? !!emp.include_pf : true;
        const includeEsi = emp ? !!emp.include_esi : true;

        const employeePf = includePf ? (parseFloat(activeRevision.employee_pf) * prorationFactor) : 0;
        const employeeEsic = includeEsi ? (parseFloat(activeRevision.employee_esic) * prorationFactor) : 0;
        const employerPf = includePf ? (parseFloat(activeRevision.employer_pf) * prorationFactor) : 0;
        const employerEsic = includeEsi ? (parseFloat(activeRevision.employer_esic) * prorationFactor) : 0;

        const dailyRate = baseSalary / daysInMonth;
        let lateDeduction = 0;
        const extraLates = Math.max(0, (stats?.L || 0) - (parseInt(rules.max_late_allowed) || 0));
        if (extraLates > 0) {
            if (rules.late_deduction_type === 'half_day') {
                lateDeduction = extraLates * (dailyRate * 0.5);
            } else if (rules.late_deduction_type === 'full_day') {
                lateDeduction = extraLates * dailyRate;
            }
        }

        const breakdown = [];
        if (includePf) {
            breakdown.push({
                rule_name: "PF",
                employee_percentage: "12",
                employer_percentage: "12",
                employee_share: employeePf.toFixed(2),
                employer_share: employerPf.toFixed(2),
                base_on: "basic"
            });
        }
        if (includeEsi) {
            breakdown.push({
                rule_name: "ESIC",
                employee_percentage: "3.25",
                employer_percentage: "0.75",
                employee_share: employeeEsic.toFixed(2),
                employer_share: employerEsic.toFixed(2),
                base_on: "gross_salary"
            });
        }

        const netSalary = (earnedGross - lateDeduction - employeePf - employeeEsic - parseFloat(manDeduction || 0) - parseFloat(loanEmi || 0) + parseFloat(otBonus || 0)).toFixed(2);

        return {
            baseSalary: earnedBasic,
            totalAllowances: earnedHra + earnedSpecial + earnedMedical,
            totalDeductions,
            unpaidLeaveDeduction,
            lateDeduction,
            employeePf,
            employerPf,
            employeeEsic,
            employerEsic,
            breakdown,
            netSalary
        };
    }

    async calculateSingleEmployeePayrollComponents(employeeId, companyId, month, year, empRecord = null, overtimeBonus = 0, manualDeduction = 0, loanEmi = 0) {
        const daysInMonth = new Date(year, month, 0).getDate();
        
        // 1. Fetch employee
        const emp = await db('employees').where({ id: employeeId }).first();
        if (!emp) return null;

        // 2. Fetch tenure
        const tenure = this.resolveActiveTenure(emp.joining_date, emp.resignation_date, month, year);
        if (tenure.activeDays === 0) {
            return null; // Not active in this month
        }

        // 3. Fetch active revision
        let activeRevision = await this.getActiveSalaryStructure(employeeId, companyId, month, year);
        if (!activeRevision) {
            const fallbackBase = parseFloat(emp.salary_basis) || 0;
            if (fallbackBase > 0) {
                await payrollRepository.upsertSalaryStructure(employeeId, companyId, {
                    base_salary: fallbackBase,
                    allowances: [],
                    deductions: []
                });
                activeRevision = await this.getActiveSalaryStructure(employeeId, companyId, month, year);
            }
        }
        if (!activeRevision) return null;

        // 4. Fetch/calculate attendance stats if not provided
        if (!empRecord) {
            const attendanceService = require('./attendanceService');
            const { matrix } = await attendanceService.getMatrix({ 
                company_id: companyId, 
                role_name: 'company_admin' 
            }, month, year);
            empRecord = matrix.find(m => parseInt(m.id) === parseInt(employeeId)) || { 
                stats: { P: tenure.activeDays, L: 0, A: 0, OFF: 0, H: 0, PL: 0, UL: 0 } 
            };
        }

        const paidDays = empRecord.stats.P + empRecord.stats.L + empRecord.stats.OFF + empRecord.stats.H + (empRecord.stats.PL || 0);
        const unpaidLeaveDays = Math.max(0, tenure.activeDays - paidDays);

        // 5. Fetch rules
        const rules = await db('working_rules').where({ company_id: companyId }).first() || {
            max_late_allowed: 3,
            late_deduction_type: 'none',
            ot_rate_multiplier: 1.0
        };

        // Resolve active rules from employee scheme if available
        let activeRules = { ...rules };
        if (emp && emp.attendance_scheme_id) {
            const scheme = await db('attendance_schemes').where({ id: emp.attendance_scheme_id }).first();
            if (scheme) {
                activeRules = {
                    ...activeRules,
                    max_late_allowed: scheme.max_late_allowed !== undefined && scheme.max_late_allowed !== null ? scheme.max_late_allowed : activeRules.max_late_allowed,
                    late_deduction_type: scheme.late_deduction_type !== undefined && scheme.late_deduction_type !== null ? scheme.late_deduction_type : activeRules.late_deduction_type,
                    ot_rate_multiplier: scheme.ot_rate_multiplier !== undefined && scheme.ot_rate_multiplier !== null ? scheme.ot_rate_multiplier : activeRules.ot_rate_multiplier
                };
            }
        }

        const globalRules = await db('global_payroll_rules').where({ company_id: companyId, is_active: true });

        // Calculate components
        let baseSalary, totalAllowances, totalDeductions, unpaidLeaveDeduction, lateDeduction, employeePf, employerPf, employeeEsic, employerEsic, breakdown, netSalary;
        let fullBaseSalary = 0, fullTotalAllowances = 0;

        if (activeRevision.isRevision) {
            const comp = this.calculateProratedSalaryComponents(
                activeRevision,
                paidDays,
                daysInMonth,
                empRecord.stats,
                activeRules,
                manualDeduction,
                loanEmi,
                overtimeBonus,
                unpaidLeaveDays,
                emp
            );
            baseSalary = comp.baseSalary;
            totalAllowances = comp.totalAllowances;
            totalDeductions = comp.totalDeductions;
            unpaidLeaveDeduction = comp.unpaidLeaveDeduction;
            lateDeduction = comp.lateDeduction;
            employeePf = comp.employeePf;
            employerPf = comp.employerPf;
            employeeEsic = comp.employeeEsic;
            employerEsic = comp.employerEsic;
            breakdown = comp.breakdown;
            netSalary = comp.netSalary;
            
            fullBaseSalary = parseFloat(activeRevision.basic) || 0;
            fullTotalAllowances = (parseFloat(activeRevision.hra) || 0) + (parseFloat(activeRevision.special_allowance) || 0) + (parseFloat(activeRevision.medical_allowance) || 0);
        } else {
            baseSalary = parseFloat(activeRevision.base_salary);
            const allowances = safeParseJson(activeRevision.allowances);
            const deductions = safeParseJson(activeRevision.deductions);

            const dailyRate = baseSalary / daysInMonth;
            const earnedBase = dailyRate * paidDays;

            lateDeduction = 0;
            const extraLates = Math.max(0, empRecord.stats.L - (parseInt(activeRules.max_late_allowed) || 0));
            if (extraLates > 0) {
                if (activeRules.late_deduction_type === 'half_day') {
                    lateDeduction = extraLates * (dailyRate * 0.5);
                } else if (activeRules.late_deduction_type === 'full_day') {
                    lateDeduction = extraLates * dailyRate;
                }
            }

            totalAllowances = allowances.reduce((acc, curr) => acc + parseFloat(curr.amount), 0);
            const prorationFactor = paidDays / daysInMonth;
            const earnedAllowances = totalAllowances * prorationFactor;

            const filteredDeductions = deductions.filter(d => {
                const name = d.name.toLowerCase();
                return !name.includes('pf') && !name.includes('provident') && !name.includes('esic') && !name.includes('esi');
            });
            totalDeductions = filteredDeductions.reduce((acc, curr) => acc + parseFloat(curr.amount), 0);
            const earnedDeductions = totalDeductions * prorationFactor;

            const dailyGross = (baseSalary + totalAllowances) / daysInMonth;
            unpaidLeaveDeduction = unpaidLeaveDays * dailyGross;

            employeePf = 0;
            employerPf = 0;
            employeeEsic = 0;
            employerEsic = 0;
            let totalOtherStatutoryDeductions = 0;
            breakdown = [];

            for (const rule of globalRules) {
                const ruleNameLower = rule.rule_name.toLowerCase();

                // Respect employee's onboarding statutory choices
                if ((ruleNameLower.includes('pf') || ruleNameLower.includes('provident')) && !emp.include_pf) {
                    continue;
                }
                if ((ruleNameLower.includes('esic') || ruleNameLower.includes('insurance')) && !emp.include_esi) {
                    continue;
                }
                if (ruleNameLower.includes('lwf') && !emp.include_lwf) {
                    continue;
                }

                const isFlat = rule.base_on === 'flat_amount';
                const calcBaseEarned = rule.base_on === 'gross_salary' ? (earnedBase + earnedAllowances) : earnedBase;
                const eeShare = isFlat ? (parseFloat(rule.employee_percentage) || 0) * prorationFactor : (calcBaseEarned * (parseFloat(rule.employee_percentage) / 100));
                const erShare = isFlat ? (parseFloat(rule.employer_percentage) || 0) * prorationFactor : (calcBaseEarned * (parseFloat(rule.employer_percentage) / 100));

                breakdown.push({
                    rule_name: rule.rule_name,
                    employee_percentage: rule.employee_percentage,
                    employer_percentage: rule.employer_percentage,
                    employee_share: eeShare.toFixed(2),
                    employer_share: erShare.toFixed(2),
                    base_on: rule.base_on
                });

                if (ruleNameLower.includes('pf') || ruleNameLower.includes('provident')) {
                    employeePf = eeShare;
                    employerPf = erShare;
                } else if (ruleNameLower.includes('esic') || ruleNameLower.includes('insurance')) {
                    employeeEsic = eeShare;
                    employerEsic = erShare;
                } else {
                    totalOtherStatutoryDeductions += eeShare;
                }
            }

            fullBaseSalary = baseSalary;
            fullTotalAllowances = totalAllowances;

            baseSalary = earnedBase;
            totalAllowances = earnedAllowances;
            totalDeductions = earnedDeductions;
            netSalary = (earnedBase + earnedAllowances - earnedDeductions - lateDeduction - employeePf - employeeEsic - totalOtherStatutoryDeductions - manualDeduction - loanEmi + overtimeBonus).toFixed(2);
        }

        return {
            base_salary: baseSalary,
            total_allowances: totalAllowances,
            full_base_salary: fullBaseSalary,
            full_total_allowances: fullTotalAllowances,
            total_deductions: totalDeductions,
            unpaid_leave_deduction: unpaidLeaveDeduction,
            late_mark_deduction: lateDeduction,
            employee_pf: employeePf,
            employer_pf: employerPf,
            employee_esic: employeeEsic,
            employer_esic: employerEsic,
            statutory_rules_breakdown: breakdown,
            net_salary: netSalary,
            paidDays,
            unpaidLeaveDays,
            stats: empRecord.stats
        };
    }

    async processCompanyPayroll(companyId, month, year, userId, approvedLoanIds = null) {
        // Check if payroll is locked
        const controls = await this.getPayrollControls(companyId, month, year);
        if (controls.payroll_locked) {
            throw new Error(`Payroll is locked for ${month}/${year}.`);
        }

        // 1. Get matrix data
        const attendanceService = require('./attendanceService');
        const { matrix } = await attendanceService.getMatrix({ 
            company_id: companyId, 
            role_name: 'company_admin' 
        }, month, year);

        const results = [];

        for (const empRecord of matrix) {
            // --- DYNAMIC OVERTIME BONUSES / MANUAL ADJUSTMENTS ---
            const existingPayroll = await db('payrolls')
                .where({ employee_id: empRecord.id, month, year })
                .first();
            const otBonus = existingPayroll ? parseFloat(existingPayroll.overtime_bonus || 0) : 0;
            const manDeduction = existingPayroll ? parseFloat(existingPayroll.manual_deduction_override || 0) : 0;
            
            // --- DETECT ACTIVE LOANS & EMIs ---
            const activeLoan = await db('loans')
                .where({ employee_id: empRecord.id, company_id: companyId, status: 'active' })
                .first();
            
            let loanEmi = 0;
            if (activeLoan) {
                if (!approvedLoanIds) {
                    loanEmi = Math.min(parseFloat(activeLoan.monthly_emi), parseFloat(activeLoan.remaining_balance));
                } else {
                    const match = approvedLoanIds.find(item => {
                        if (item && typeof item === 'object') {
                            return item.id === activeLoan.id || item.loanId === activeLoan.id;
                        }
                        return item === activeLoan.id;
                    });
                    
                    if (match !== undefined) {
                        if (match && typeof match === 'object' && match.amount !== undefined) {
                            loanEmi = Math.min(parseFloat(match.amount), parseFloat(activeLoan.remaining_balance));
                        } else {
                            loanEmi = Math.min(parseFloat(activeLoan.monthly_emi), parseFloat(activeLoan.remaining_balance));
                        }
                    }
                }
            }

            const comp = await this.calculateSingleEmployeePayrollComponents(
                empRecord.id,
                companyId,
                month,
                year,
                empRecord,
                otBonus,
                manDeduction,
                loanEmi
            );

            if (!comp) continue;

            const payrollEntry = {
                employee_id: empRecord.id,
                company_id: companyId,
                month,
                year,
                base_salary: comp.base_salary,
                total_allowances: comp.total_allowances,
                total_deductions: comp.total_deductions,
                unpaid_leave_deduction: parseFloat(comp.unpaid_leave_deduction).toFixed(2),
                unpaid_leave_days: comp.unpaidLeaveDays,
                late_mark_deduction: parseFloat(comp.late_mark_deduction).toFixed(2),
                late_marks_count: comp.stats.L,
                overtime_bonus: otBonus.toFixed(2),
                manual_deduction_override: manDeduction.toFixed(2),
                loan_emi_deduction: loanEmi.toFixed(2),
                employee_pf: parseFloat(comp.employee_pf).toFixed(2),
                employer_pf: parseFloat(comp.employer_pf).toFixed(2),
                employee_esic: parseFloat(comp.employee_esic).toFixed(2),
                employer_esic: parseFloat(comp.employer_esic).toFixed(2),
                statutory_rules_breakdown: JSON.stringify(comp.statutory_rules_breakdown),
                net_salary: parseFloat(comp.net_salary).toFixed(2),
                status: 'generated',
                processed_at: db.fn.now()
            };

            await payrollRepository.savePayroll(payrollEntry);
            results.push({ ...payrollEntry, processed_at: new Date() });
        }

        // Notify Admin
        try {
            const notificationService = require('./notificationService');
            await notificationService.createNotification(
                userId, 
                companyId, 
                'Payroll Generated', 
                `Monthly payroll for ${new Date(year, month-1).toLocaleString('default', { month: 'long' })} ${year} processed for ${results.length} staff.`,
                'success'
            );
        } catch (err) {
            console.error('Payroll notification failed', err);
        }

        return results;
    }

    async getInteractiveRegister(companyId, month, year) {
        // 1. Fetch Attendance Matrix
        const attendanceService = require('./attendanceService');
        const { matrix } = await attendanceService.getMatrix({ 
            company_id: companyId, 
            role_name: 'company_admin' 
        }, month, year);

        // 2. Fetch already saved payroll entries for status/comparisons
        const savedEntries = await db('payrolls')
            .where({ company_id: companyId, month, year });
        const savedMap = new Map(savedEntries.map(e => [e.employee_id, e]));

        const register = [];

        for (const empRecord of matrix) {
            // --- DETECT ACTIVE LOANS & EMIs ---
            const activeLoan = await db('loans')
                .where({ employee_id: empRecord.id, company_id: companyId, status: 'active' })
                .first();
            const loanEmi = activeLoan ? Math.min(parseFloat(activeLoan.monthly_emi), parseFloat(activeLoan.remaining_balance)) : 0;

            const saved = savedMap.get(empRecord.id);
            const otBonus = saved ? parseFloat(saved.overtime_bonus || 0) : 0;
            const manDeduction = saved ? parseFloat(saved.manual_deduction_override || 0) : 0;

            const comp = await this.calculateSingleEmployeePayrollComponents(
                empRecord.id,
                companyId,
                month,
                year,
                empRecord,
                otBonus,
                manDeduction,
                loanEmi
            );

            if (!comp) continue;

            register.push({
                employee_id: empRecord.id,
                first_name: empRecord.name.split(' ')[0] || '',
                last_name: empRecord.name.split(' ').slice(1).join(' ') || '',
                employee_id_number: empRecord.code,
                designation: empRecord.role,
                base_salary: comp.base_salary,
                total_allowances: comp.total_allowances,
                full_base_salary: comp.full_base_salary,
                full_total_allowances: comp.full_total_allowances,
                total_deductions: comp.total_deductions,
                unpaid_leave_deduction: comp.unpaid_leave_deduction,
                late_mark_deduction: comp.late_mark_deduction,
                late_marks_count: comp.stats.L,
                stats: comp.stats,
                employee_pf: comp.employee_pf,
                employer_pf: comp.employer_pf,
                employee_esic: comp.employee_esic,
                employer_esic: comp.employer_esic,
                overtime_bonus: otBonus,
                manual_deduction_override: manDeduction,
                loan_emi_deduction: loanEmi,
                net_salary: saved ? saved.net_salary : parseFloat(comp.net_salary).toFixed(2),
                status: saved ? saved.status : 'draft'
            });
        }

        return register;
    }

    async updatePayroll(id, companyId, data) {
        const existing = await db('payrolls').where({ id, company_id: companyId }).first();
        if (!existing) throw new Error('Payroll record not found');

        // Check if payroll is locked
        const controls = await this.getPayrollControls(companyId, existing.month, existing.year);
        if (controls.payroll_locked) {
            throw new Error(`Payroll is locked for ${existing.month}/${existing.year}.`);
        }

        // Allow manual adjustment of net_salary, or recalculate based on provided components
        const updateData = {
            base_salary: data.base_salary || existing.base_salary,
            total_allowances: data.total_allowances || existing.total_allowances,
            total_deductions: data.total_deductions || existing.total_deductions,
            unpaid_leave_deduction: data.unpaid_leave_deduction || existing.unpaid_leave_deduction,
            status: data.status || existing.status
        };

        // If specific components were edited, recalculate Net
        if (data.base_salary || data.total_allowances || data.total_deductions || data.unpaid_leave_deduction) {
            const base = parseFloat(updateData.base_salary);
            const allow = parseFloat(updateData.total_allowances);
            const ded = parseFloat(updateData.total_deductions);
            const unpaid = parseFloat(updateData.unpaid_leave_deduction);
            const loanEmi = parseFloat(existing.loan_emi_deduction || 0);
            
            // For manual edits, we use the components directly
            updateData.net_salary = (base + allow - ded - unpaid - loanEmi).toFixed(2);
        } else if (data.net_salary) {
            updateData.net_salary = data.net_salary;
        }

        // Deduct EMI from outstanding loan balance if transitioning to 'paid'
        if (updateData.status === 'paid' && existing.status !== 'paid') {
            const activeLoan = await db('loans')
                .where({ employee_id: existing.employee_id, company_id: companyId, status: 'active' })
                .first();
            if (activeLoan) {
                const emiDeduction = parseFloat(existing.loan_emi_deduction || 0);
                if (emiDeduction > 0) {
                    const newBalance = Math.max(0, parseFloat(activeLoan.remaining_balance) - emiDeduction);
                    const newStatus = newBalance === 0 ? 'completed' : 'active';
                    await db('loans').where({ id: activeLoan.id }).update({
                        remaining_balance: newBalance,
                        status: newStatus
                    });

                    // Log the payroll repayment transaction
                    await db('loan_repayments').insert({
                        company_id: companyId,
                        loan_id: activeLoan.id,
                        amount_paid: emiDeduction,
                        payment_method: 'payroll',
                        payment_date: db.fn.now(),
                        payroll_id: existing.id,
                        notes: `Auto-EMI deducted via payroll for ${existing.month}/${existing.year}`
                    });
                }
            }
        }

        return await db('payrolls').where({ id }).update(updateData);
    }

    async getStatements(companyId, month, year) {
        return await payrollRepository.getMonthlyStatements(companyId, month, year);
    }

    async getPayrollSummary(companyId, month, year) {
        const statements = await payrollRepository.getMonthlyStatements(companyId, month, year);
        
        let netPay = 0;
        let grossPay = 0;
        let totalDeductions = 0;
        let payoutPendingCount = 0;
        
        for (const stmt of statements) {
            const net = parseFloat(stmt.net_salary || 0);
            const base = parseFloat(stmt.base_salary || 0);
            const allow = parseFloat(stmt.total_allowances || 0);
            const ded = parseFloat(stmt.total_deductions || 0);
            const unpaid = parseFloat(stmt.unpaid_leave_deduction || 0);
            const late = parseFloat(stmt.late_mark_deduction || 0);
            
            netPay += net;
            grossPay += (base + allow);
            totalDeductions += (ded + unpaid + late);
            
            if (stmt.status === 'generated' || stmt.status === 'pending') {
                payoutPendingCount++;
            }
        }
        
        // Count employees (active & joined/left details)
        const allEmployees = await db('employees').where('company_id', companyId);
        
        const totalEmployees = allEmployees.filter(e => e.status === 'active').length;
        
        let additions = 0;
        let separations = 0;
        
        allEmployees.forEach(e => {
            if (e.joining_date) {
                const joinDate = new Date(e.joining_date);
                if (joinDate.getMonth() + 1 == month && joinDate.getFullYear() == year) {
                    additions++;
                }
            }
            if (e.resignation_date) {
                const resDate = new Date(e.resignation_date);
                if (resDate.getMonth() + 1 == month && resDate.getFullYear() == year) {
                    separations++;
                }
            }
        });
        
        return {
            netPay: netPay.toFixed(2),
            grossPay: grossPay.toFixed(2),
            deductions: totalDeductions.toFixed(2),
            totalEmployees,
            additions,
            separations,
            payoutPending: payoutPendingCount,
            processedCount: statements.length
        };
    }

    async updateStructure(employeeId, companyId, data) {
        let cid = companyId;
        if (!cid) {
            const emp = await db('employees').where({ id: employeeId }).first();
            if (emp) cid = emp.company_id;
        }
        if (!cid) throw new Error('Company context could not be resolved for employee.');

        // Check if inputs are locked for the current month
        const now = new Date();
        const curMonth = now.getMonth() + 1;
        const curYear = now.getFullYear();
        const controls = await this.getPayrollControls(cid, curMonth, curYear);
        if (controls.inputs_locked) {
            throw new Error(`Payroll inputs are locked for ${curMonth}/${curYear}.`);
        }

        return await payrollRepository.upsertSalaryStructure(employeeId, cid, data);
    }

    async generatePayslipPDF(payrollId, companyId) {
        const payroll = await db('payrolls as p')
            .join('employees as e', 'p.employee_id', 'e.id')
            .join('companies as c', 'p.company_id', 'c.id')
            .where({ 'p.id': payrollId, 'p.company_id': companyId })
            .select('p.*', 'e.*', 'c.name as company_name', 'c.email as company_email')
            .first();

        if (!payroll) throw new Error('Payroll record not found');

        const doc = new PDFDocument({ size: 'A4', margin: 50 });
        
        const pageWidth = doc.page.width;
        const pageHeight = doc.page.height;
        const margin = 50;

        // Theme red accent color: rgb(220, 38, 38) -> #DC2626
        const primaryColor = '#DC2626';

        // 1. Draw Theme Accents (creative top and left borders)
        doc.rect(0, 0, pageWidth, 6).fill(primaryColor);
        doc.rect(0, 0, 4, pageHeight).fill(primaryColor);

        // 2. Draw Header Info
        const headerY = 25;
        doc.fillColor(primaryColor).font('Helvetica-Bold').fontSize(22).text('HOTEL HIGHWAY KING', margin, headerY);
        
        doc.fillColor('#000000').font('Helvetica-Bold').fontSize(7.5).text('Near Toll Plaza, Bagru, Ajmer Road, Jaipur, Rajasthan - 303007', margin, headerY + 24);
        
        // Draw logo character placeholder
        doc.fillColor(primaryColor);
        doc.roundedRect(pageWidth - margin - 22, headerY - 2, 22, 22, 4).fill();
        doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(14).text('H', pageWidth - margin - 15, headerY + 3);

        // Header separator line
        doc.strokeColor(primaryColor).lineWidth(1.5).moveTo(margin, headerY + 38).lineTo(pageWidth - margin, headerY + 38).stroke();

        // 3. Document Title
        const monthName = new Date(payroll.year, payroll.month - 1).toLocaleString('default', { month: 'long' });
        doc.fillColor('#0F172A').font('Helvetica-Bold').fontSize(13).text('PAYSLIP', margin, headerY + 52, { align: 'center' });
        doc.fontSize(8.5).font('Helvetica-Bold').fillColor('#475569').text(`FOR THE MONTH OF ${monthName.toUpperCase()} ${payroll.year}`, margin, headerY + 68, { align: 'center' });

        // 4. Employee Info Card Box
        const infoY = headerY + 84;
        const boxHeight = 75;
        doc.strokeColor('#E2E8F0').lineWidth(0.5).rect(margin, infoY, pageWidth - (margin * 2), boxHeight).stroke();

        // Row 1
        doc.fillColor('#64748B').font('Helvetica-Bold').fontSize(8.5).text('Employee Name:', margin + 15, infoY + 12);
        doc.fillColor('#0F172A').font('Helvetica-Bold').text(`${payroll.first_name} ${payroll.last_name}`, margin + 105, infoY + 12);

        doc.fillColor('#64748B').text('Employee ID:', margin + 260, infoY + 12);
        doc.fillColor('#0F172A').text(payroll.employee_id_number || 'N/A', margin + 340, infoY + 12);

        // Row 2
        doc.fillColor('#64748B').text('Designation:', margin + 15, infoY + 32);
        doc.fillColor('#0F172A').text(payroll.designation || 'N/A', margin + 105, infoY + 32);

        doc.fillColor('#64748B').text('Payment Status:', margin + 260, infoY + 32);
        const statusText = (payroll.status || 'Paid').toUpperCase();
        doc.fillColor(statusText === 'PAID' ? '#10B981' : '#F59E0B').text(statusText, margin + 340, infoY + 32);

        // Row 3
        const formatDisplayDate = (dVal) => {
            if (!dVal) return 'N/A';
            const d = new Date(dVal);
            if (isNaN(d.getTime())) return 'N/A';
            const day = String(d.getDate()).padStart(2, '0');
            const monthShort = d.toLocaleString('default', { month: 'short' });
            const yearVal = d.getFullYear();
            return `${day} ${monthShort} ${yearVal}`;
        };
        doc.fillColor('#64748B').text('Joining Date:', margin + 15, infoY + 52);
        doc.fillColor('#0F172A').text(formatDisplayDate(payroll.joining_date), margin + 105, infoY + 52);

        // 5. Earnings vs Deductions dual column table
        const tableY = infoY + boxHeight + 20;
        const colWidth = (pageWidth - (margin * 2) - 15) / 2; // Split width evenly with a 15pt gap
        const rightColX = margin + colWidth + 15;

        // Earnings Column Header
        doc.fillColor('#F8FAFC').rect(margin, tableY, colWidth, 20).fill();
        doc.strokeColor('#E2E8F0').lineWidth(0.5).rect(margin, tableY, colWidth, 20).stroke();
        doc.fillColor('#0F172A').font('Helvetica-Bold').fontSize(8.5).text('EARNINGS', margin + 10, tableY + 6);
        doc.text('Amount (INR)', margin + colWidth - 85, tableY + 6, { align: 'right', width: 75 });

        // Deductions Column Header
        doc.fillColor('#F8FAFC').rect(rightColX, tableY, colWidth, 20).fill();
        doc.strokeColor('#E2E8F0').lineWidth(0.5).rect(rightColX, tableY, colWidth, 20).stroke();
        doc.fillColor('#0F172A').font('Helvetica-Bold').text('DEDUCTIONS', rightColX + 10, tableY + 6);
        doc.text('Amount (INR)', rightColX + colWidth - 85, tableY + 6, { align: 'right', width: 75 });

        // Gather list data
        const earningsList = [
            { label: 'Basic Salary', val: parseFloat(payroll.base_salary || 0) },
            { label: 'Allowances', val: parseFloat(payroll.total_allowances || 0) }
        ];
        if (parseFloat(payroll.overtime_bonus || 0) > 0) {
            earningsList.push({ label: 'Overtime & Bonuses', val: parseFloat(payroll.overtime_bonus) });
        }

        const deductionsList = [];
        if (parseFloat(payroll.employee_pf || 0) > 0) {
            deductionsList.push({ label: 'Provident Fund (EPF)', val: parseFloat(payroll.employee_pf) });
        }
        if (parseFloat(payroll.employee_esic || 0) > 0) {
            deductionsList.push({ label: 'ESIC Contribution', val: parseFloat(payroll.employee_esic) });
        }
        if (parseFloat(payroll.late_mark_deduction || 0) > 0) {
            deductionsList.push({ label: `Late Mark Cuts (${payroll.late_marks_count || 0} Lates)`, val: parseFloat(payroll.late_mark_deduction) });
        }
        if (parseFloat(payroll.unpaid_leave_deduction || 0) > 0) {
            deductionsList.push({ label: `Unpaid Leave Deductions (${parseFloat(payroll.unpaid_leave_days || 0)} Days)`, val: parseFloat(payroll.unpaid_leave_deduction) });
        }
        if (parseFloat(payroll.loan_emi_deduction || 0) > 0) {
            deductionsList.push({ label: 'Loan EMI Deduction', val: parseFloat(payroll.loan_emi_deduction) });
        }
        if (parseFloat(payroll.manual_deduction_override || 0) > 0) {
            deductionsList.push({ label: 'Manual Deductions', val: parseFloat(payroll.manual_deduction_override) });
        }
        if (parseFloat(payroll.total_deductions || 0) > 0) {
            deductionsList.push({ label: 'Other Deductions', val: parseFloat(payroll.total_deductions) });
        }

        const maxRows = Math.max(earningsList.length, deductionsList.length);
        const rowHeight = 22;

        for (let i = 0; i < maxRows; i++) {
            const rowY = tableY + 20 + (i * rowHeight);

            // Left side cell (Earnings)
            doc.strokeColor('#E2E8F0').lineWidth(0.5).rect(margin, rowY, colWidth, rowHeight).stroke();
            if (earningsList[i]) {
                doc.fillColor('#334155').font('Helvetica').fontSize(8).text(earningsList[i].label, margin + 10, rowY + 7);
                doc.fillColor('#0F172A').font('Helvetica-Bold').text(earningsList[i].val.toLocaleString('en-IN', { minimumFractionDigits: 2 }), margin + colWidth - 85, rowY + 7, { align: 'right', width: 75 });
            }

            // Right side cell (Deductions)
            doc.strokeColor('#E2E8F0').lineWidth(0.5).rect(rightColX, rowY, colWidth, rowHeight).stroke();
            if (deductionsList[i]) {
                doc.fillColor('#334155').font('Helvetica').fontSize(8).text(deductionsList[i].label, rightColX + 10, rowY + 7);
                doc.fillColor('#EF4444').font('Helvetica-Bold').text(`- ${deductionsList[i].val.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, rightColX + colWidth - 85, rowY + 7, { align: 'right', width: 75 });
            }
        }

        // Table totals row
        const totalY = tableY + 20 + (maxRows * rowHeight);
        const totalEarnings = earningsList.reduce((acc, item) => acc + item.val, 0);
        const totalDeductionsSum = deductionsList.reduce((acc, item) => acc + item.val, 0);

        // Left total
        doc.fillColor('#F8FAFC').rect(margin, totalY, colWidth, rowHeight).fill();
        doc.strokeColor('#E2E8F0').lineWidth(0.5).rect(margin, totalY, colWidth, rowHeight).stroke();
        doc.fillColor('#0F172A').font('Helvetica-Bold').fontSize(8).text('Gross Earnings', margin + 10, totalY + 7);
        doc.text(totalEarnings.toLocaleString('en-IN', { minimumFractionDigits: 2 }), margin + colWidth - 85, totalY + 7, { align: 'right', width: 75 });

        // Right total
        doc.fillColor('#F8FAFC').rect(rightColX, totalY, colWidth, rowHeight).fill();
        doc.strokeColor('#E2E8F0').lineWidth(0.5).rect(rightColX, totalY, colWidth, rowHeight).stroke();
        doc.fillColor('#0F172A').font('Helvetica-Bold').text('Total Deductions', rightColX + 10, totalY + 7);
        doc.text(totalDeductionsSum.toLocaleString('en-IN', { minimumFractionDigits: 2 }), rightColX + colWidth - 85, totalY + 7, { align: 'right', width: 75 });

        // 6. Net Salary Shaded Callout Box
        const netBoxY = totalY + rowHeight + 18;
        const netBoxHeight = 35;
        doc.fillColor('#FEF2F2').rect(margin, netBoxY, pageWidth - (margin * 2), netBoxHeight).fill();
        doc.strokeColor('#FCA5A5').lineWidth(1).rect(margin, netBoxY, pageWidth - (margin * 2), netBoxHeight).stroke();

        doc.fillColor('#991B1B').font('Helvetica-Bold').fontSize(9).text('NET PAYABLE SALARY (ROUNDED)', margin + 15, netBoxY + 13);
        
        const netFormatted = parseFloat(payroll.net_salary || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 });
        doc.fillColor('#991B1B').font('Helvetica-Bold').fontSize(13.5).text(`INR ${netFormatted}`, pageWidth - margin - 215, netBoxY + 11, { align: 'right', width: 200 });

        // 7. Amount in Words
        const wordsY = netBoxY + netBoxHeight + 10;
        doc.fillColor('#475569').font('Helvetica-Oblique').fontSize(8.5).text(`Amount in Words: ${convertNumberToWords(Math.round(payroll.net_salary || 0))}`, margin + 5, wordsY);

        // 8. Signatures Block
        const sigsY = wordsY + 38;
        
        doc.strokeColor('#CBD5E1').lineWidth(0.5).moveTo(margin + 10, sigsY + 42).lineTo(margin + 130, sigsY + 42).stroke();
        doc.fillColor('#64748B').font('Helvetica').fontSize(8).text('Employee Signature', margin + 10, sigsY + 48);

        doc.strokeColor('#CBD5E1').lineWidth(0.5).moveTo(pageWidth - margin - 130, sigsY + 42).lineTo(pageWidth - margin - 10, sigsY + 42).stroke();
        doc.fillColor('#64748B').text('For HOTEL HIGHWAY KING', pageWidth - margin - 130, sigsY);
        doc.fillColor('#334155').font('Helvetica-Bold').text('Authorized Signatory', pageWidth - margin - 130, sigsY + 48);

        // 9. Document Footer
        const footerY = pageHeight - 42;
        doc.strokeColor(primaryColor).lineWidth(1.2).moveTo(margin, footerY).lineTo(pageWidth - margin, footerY).stroke();

        const footerText = 'Contact - +91-9829065000 | info@hotelhighwayking.com | GSTN - 08AAAAA1111A1Z1 | MSME - UDYAM-RJ-17-0000001';
        doc.fillColor('#334155').font('Helvetica-Bold').fontSize(7.5).text(footerText, margin, footerY + 6, { align: 'center', width: pageWidth - (margin * 2) });
        doc.fillColor('#64748B').font('Helvetica').fontSize(7).text('Near Toll Plaza, Bagru, Ajmer Road, Jaipur, Rajasthan - 303007', margin, footerY + 16, { align: 'center', width: pageWidth - (margin * 2) });

        return doc;
    }
    async saveBonusAdjustment(companyId, employeeId, month, year, overtimeBonus) {
        // Check if inputs are locked
        const controls = await this.getPayrollControls(companyId, month, year);
        if (controls.inputs_locked) {
            throw new Error(`Payroll inputs are locked for ${month}/${year}.`);
        }

        // 1. Check if payroll record already exists
        const existing = await db('payrolls')
            .where({ company_id: companyId, employee_id: employeeId, month, year })
            .first();

        const manDeduction = existing ? parseFloat(existing.manual_deduction_override || 0) : 0;
        const loanEmi = existing ? parseFloat(existing.loan_emi_deduction || 0) : 0;
        const otBonus = overtimeBonus;

        const comp = await this.calculateSingleEmployeePayrollComponents(
            employeeId,
            companyId,
            month,
            year,
            null, // will fetch internally
            otBonus,
            manDeduction,
            loanEmi
        );

        if (!comp) throw new Error('Employee not active in this month');

        const payrollEntry = {
            employee_id: employeeId,
            company_id: companyId,
            month,
            year,
            base_salary: comp.base_salary,
            total_allowances: comp.total_allowances,
            total_deductions: comp.total_deductions,
            unpaid_leave_deduction: parseFloat(comp.unpaid_leave_deduction).toFixed(2),
            unpaid_leave_days: comp.unpaidLeaveDays,
            late_mark_deduction: parseFloat(comp.late_mark_deduction).toFixed(2),
            late_marks_count: comp.stats.L,
            overtime_bonus: otBonus.toFixed(2),
            manual_deduction_override: manDeduction.toFixed(2),
            loan_emi_deduction: loanEmi.toFixed(2),
            employee_pf: parseFloat(comp.employee_pf).toFixed(2),
            employer_pf: parseFloat(comp.employer_pf).toFixed(2),
            employee_esic: parseFloat(comp.employee_esic).toFixed(2),
            employer_esic: parseFloat(comp.employer_esic).toFixed(2),
            statutory_rules_breakdown: JSON.stringify(comp.statutory_rules_breakdown),
            net_salary: parseFloat(comp.net_salary).toFixed(2),
            status: existing ? existing.status : 'draft'
        };

        if (existing) {
            await db('payrolls').where({ id: existing.id }).update(payrollEntry);
        } else {
            await db('payrolls').insert(payrollEntry);
        }

        return payrollEntry;
    }

    async saveDeductionAdjustment(companyId, employeeId, month, year, manualDeduction) {
        // Check if inputs are locked
        const controls = await this.getPayrollControls(companyId, month, year);
        if (controls.inputs_locked) {
            throw new Error(`Payroll inputs are locked for ${month}/${year}.`);
        }

        // 1. Check if payroll record already exists
        const existing = await db('payrolls')
            .where({ company_id: companyId, employee_id: employeeId, month, year })
            .first();

        const otBonus = existing ? parseFloat(existing.overtime_bonus || 0) : 0;
        const loanEmi = existing ? parseFloat(existing.loan_emi_deduction || 0) : 0;
        const manDeduction = manualDeduction;

        const comp = await this.calculateSingleEmployeePayrollComponents(
            employeeId,
            companyId,
            month,
            year,
            null, // will fetch internally
            otBonus,
            manDeduction,
            loanEmi
        );

        if (!comp) throw new Error('Employee not active in this month');

        const payrollEntry = {
            employee_id: employeeId,
            company_id: companyId,
            month,
            year,
            base_salary: comp.base_salary,
            total_allowances: comp.total_allowances,
            total_deductions: comp.total_deductions,
            unpaid_leave_deduction: parseFloat(comp.unpaid_leave_deduction).toFixed(2),
            unpaid_leave_days: comp.unpaidLeaveDays,
            late_mark_deduction: parseFloat(comp.late_mark_deduction).toFixed(2),
            late_marks_count: comp.stats.L,
            overtime_bonus: otBonus.toFixed(2),
            manual_deduction_override: manDeduction.toFixed(2),
            loan_emi_deduction: loanEmi.toFixed(2),
            employee_pf: parseFloat(comp.employee_pf).toFixed(2),
            employer_pf: parseFloat(comp.employer_pf).toFixed(2),
            employee_esic: parseFloat(comp.employee_esic).toFixed(2),
            employer_esic: parseFloat(comp.employer_esic).toFixed(2),
            statutory_rules_breakdown: JSON.stringify(comp.statutory_rules_breakdown),
            net_salary: parseFloat(comp.net_salary).toFixed(2),
            status: existing ? existing.status : 'draft'
        };

        if (existing) {
            await db('payrolls').where({ id: existing.id }).update(payrollEntry);
        } else {
            await db('payrolls').insert(payrollEntry);
        }

        return payrollEntry;
    }

    async getLoans(companyId) {
        return await db('loans')
            .join('employees', 'loans.employee_id', '=', 'employees.id')
            .where('loans.company_id', companyId)
            .select(
                'loans.*',
                'employees.first_name',
                'employees.last_name',
                'employees.employee_id_number'
            )
            .orderBy('loans.created_at', 'desc');
    }

    async createLoan(companyId, loanData) {
        // Check if inputs are locked for the current month
        const now = new Date();
        const curMonth = now.getMonth() + 1;
        const curYear = now.getFullYear();
        const controls = await this.getPayrollControls(companyId, curMonth, curYear);
        if (controls.inputs_locked) {
            throw new Error(`Payroll inputs are locked for ${curMonth}/${curYear}.`);
        }

        const payload = {
            company_id: companyId,
            employee_id: parseInt(loanData.employee_id),
            title: loanData.title,
            amount: parseFloat(loanData.amount),
            monthly_emi: parseFloat(loanData.monthly_emi),
            remaining_balance: parseFloat(loanData.amount),
            status: loanData.status || 'pending'
        };
        const [id] = await db('loans').insert(payload);
        return { id, ...payload };
    }

    async updateLoanStatus(companyId, loanId, status) {
        const loan = await db('loans').where({ id: loanId, company_id: companyId }).first();
        if (!loan) throw new Error('Loan record not found');

        await db('loans').where({ id: loanId }).update({ status });
        return { ...loan, status };
    }

    async getPayslipPDFBuffer(payrollId, companyId) {
        const doc = await this.generatePayslipPDF(payrollId, companyId);
        return new Promise((resolve, reject) => {
            const chunks = [];
            doc.on('data', chunk => chunks.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.on('error', err => reject(err));
            doc.end();
        });
    }

    async sendBulkEmailPayslips(companyId, month, year) {
        const mailService = require('./mailService');
        
        // 1. Get all paid payroll statements for this month and year
        const paidPayrolls = await db('payrolls as p')
            .join('employees as e', 'p.employee_id', '=', 'e.id')
            .where({ 
                'p.company_id': companyId, 
                'p.month': parseInt(month), 
                'p.year': parseInt(year),
                'p.status': 'paid'
            })
            .select('p.id as payroll_id', 'e.first_name', 'e.last_name', 'e.email', 'p.month', 'p.year');

        let successfulCount = 0;
        let failedCount = 0;

        for (const item of paidPayrolls) {
            if (!item.email) {
                failedCount++;
                continue;
            }
            try {
                const pdfBuffer = await this.getPayslipPDFBuffer(item.payroll_id, companyId);
                const monthName = new Date(item.year, item.month - 1).toLocaleString('default', { month: 'long' });
                const name = `${item.first_name} ${item.last_name}`;
                const filename = `Payslip_${item.first_name}_${monthName}_${item.year}.pdf`.replace(/\s+/g, '_');
                
                const sent = await mailService.sendPayslipEmail(
                    item.email,
                    name,
                    monthName,
                    item.year,
                    pdfBuffer,
                    filename
                );
                if (sent) {
                    successfulCount++;
                } else {
                    failedCount++;
                }
            } catch (err) {
                console.error(`Failed to send email to ${item.email}:`, err);
                failedCount++;
            }
        }

        return {
            totalCount: paidPayrolls.length,
            successfulCount,
            failedCount
        };
    }

    async generateEPFECR(companyId, month, year) {
        const statements = await db('payrolls as p')
            .join('employees as e', 'p.employee_id', '=', 'e.id')
            .where({ 
                'p.company_id': companyId, 
                'p.month': parseInt(month), 
                'p.year': parseInt(year)
            })
            .select('p.*', 'e.first_name', 'e.last_name', 'e.employee_id_number');

        let ecrText = '';
        statements.forEach((stmt) => {
            const pfWages = Math.min(15000, parseFloat(stmt.base_salary) || 0);
            const epsWages = pfWages;
            const edliWages = pfWages;
            
            const epfEmployee = parseFloat(stmt.employee_pf) || 0;
            const epsEmployer = Math.round(epsWages * 0.0833);
            const epfDiff = Math.max(0, epfEmployee - epsEmployer);
            
            const uan = stmt.employee_id_number || 'UAN1000000';
            const name = `${stmt.first_name} ${stmt.last_name}`.substring(0, 30).toUpperCase();
            const gross = parseFloat(stmt.base_salary) + (parseFloat(stmt.total_allowances) || 0);
            const ncpDays = stmt.unpaid_leave_deduction > 0 ? 2 : 0; 
            
            ecrText += `${uan}#~#${name}#~#${Math.round(gross)}#~#${Math.round(pfWages)}#~#${Math.round(epsWages)}#~#${Math.round(edliWages)}#~#${Math.round(epfEmployee)}#~#${Math.round(epsEmployer)}#~#${Math.round(epfDiff)}#~#${ncpDays}#~#0\r\n`;
        });
        
        return ecrText;
    }

    async generateESICCSV(companyId, month, year) {
        const statements = await db('payrolls as p')
            .join('employees as e', 'p.employee_id', '=', 'e.id')
            .where({ 
                'p.company_id': companyId, 
                'p.month': parseInt(month), 
                'p.year': parseInt(year)
            })
            .select('p.*', 'e.first_name', 'e.last_name', 'e.employee_id_number');

        let csvText = 'IP_Number,IP_Name,No_of_Days_Wages_Paid,Total_Monthly_Wages,Reason_Code_Zero_Wages\n';
        statements.forEach((stmt) => {
            const ipNum = stmt.employee_id_number || 'IP1000000';
            const name = `${stmt.first_name} ${stmt.last_name}`.replace(/,/g, ' ').toUpperCase();
            const gross = parseFloat(stmt.base_salary) + (parseFloat(stmt.total_allowances) || 0);
            const daysPaid = stmt.unpaid_leave_deduction > 0 ? 28 : 30;
            
            csvText += `${ipNum},${name},${daysPaid},${Math.round(gross)},0\n`;
        });
        
        return csvText;
    }

    async previewLoanDeductions(companyId, month, year) {
        const activeLoans = await db('loans')
            .join('employees', 'loans.employee_id', '=', 'employees.id')
            .where({ 'loans.company_id': companyId, 'loans.status': 'active' })
            .select(
                'loans.id',
                'loans.title',
                'loans.amount',
                'loans.monthly_emi',
                'loans.remaining_balance',
                'employees.first_name',
                'employees.last_name',
                'employees.employee_id_number'
            );

        return activeLoans.map(loan => {
            const plannedEmi = Math.min(parseFloat(loan.monthly_emi), parseFloat(loan.remaining_balance));
            return {
                id: loan.id,
                employee_name: `${loan.first_name} ${loan.last_name}`,
                employee_code: loan.employee_id_number,
                title: loan.title,
                remaining_balance: parseFloat(loan.remaining_balance),
                planned_emi: plannedEmi
            };
        });
    }

    async recordRepayment(companyId, loanId, repaymentData) {
        const { amount_paid, payment_date, notes } = repaymentData;
        const parsedAmount = parseFloat(amount_paid);

        const rDate = payment_date ? new Date(payment_date) : new Date();
        const repMonth = rDate.getMonth() + 1;
        const repYear = rDate.getFullYear();

        const controls = await this.getPayrollControls(companyId, repMonth, repYear);
        if (controls.inputs_locked) {
            throw new Error(`Payroll inputs are locked for ${repMonth}/${repYear}.`);
        }

        const loan = await db('loans').where({ id: loanId, company_id: companyId }).first();
        if (!loan) throw new Error('Loan record not found');
        if (loan.status !== 'active') throw new Error('Repayment can only be registered for active loans');
        if (parsedAmount > parseFloat(loan.remaining_balance)) {
            throw new Error(`Repayment amount cannot exceed remaining balance of ₹${loan.remaining_balance}`);
        }

        const newBalance = Math.max(0, parseFloat(loan.remaining_balance) - parsedAmount);
        const newStatus = newBalance === 0 ? 'completed' : 'active';

        await db('loans').where({ id: loanId }).update({
            remaining_balance: newBalance,
            status: newStatus
        });


        await db('loan_repayments').insert({
            company_id: companyId,
            loan_id: loanId,
            amount_paid: parsedAmount,
            payment_method: 'manual',
            payment_date: rDate,
            notes: notes || 'Manual settlement'
        });

        return { newBalance, newStatus };
    }

    async getRepayments(companyId) {
        return await db('loan_repayments')
            .join('loans', 'loan_repayments.loan_id', '=', 'loans.id')
            .join('employees', 'loans.employee_id', '=', 'employees.id')
            .where('loan_repayments.company_id', companyId)
            .select(
                'loan_repayments.*',
                'loans.title as loan_title',
                'employees.first_name',
                'employees.last_name',
                'employees.employee_id_number'
            )
            .orderBy('loan_repayments.payment_date', 'desc');
    }

    async getPayrollControls(companyId, month, year) {
        let controls = await db('payroll_controls')
            .where({ company_id: companyId, month: parseInt(month), year: parseInt(year) })
            .first();
        if (!controls) {
            controls = {
                company_id: companyId,
                month: parseInt(month),
                year: parseInt(year),
                inputs_locked: false,
                employee_view_released: false,
                it_statement_released: false,
                payroll_locked: false
            };
        } else {
            controls.inputs_locked = !!controls.inputs_locked;
            controls.employee_view_released = !!controls.employee_view_released;
            controls.it_statement_released = !!controls.it_statement_released;
            controls.payroll_locked = !!controls.payroll_locked;
        }
        return controls;
    }

    async updatePayrollControls(companyId, month, year, data) {
        const existing = await db('payroll_controls')
            .where({ company_id: companyId, month: parseInt(month), year: parseInt(year) })
            .first();
        
        const payload = {
            inputs_locked: data.inputs_locked !== undefined ? !!data.inputs_locked : false,
            employee_view_released: data.employee_view_released !== undefined ? !!data.employee_view_released : false,
            it_statement_released: data.it_statement_released !== undefined ? !!data.it_statement_released : false,
            payroll_locked: data.payroll_locked !== undefined ? !!data.payroll_locked : false,
            updated_at: db.fn.now()
        };

        if (existing) {
            await db('payroll_controls')
                .where({ id: existing.id })
                .update(payload);
        } else {
            await db('payroll_controls').insert({
                company_id: companyId,
                month: parseInt(month),
                year: parseInt(year),
                ...payload,
                created_at: db.fn.now()
            });
        }
        return this.getPayrollControls(companyId, month, year);
    }
}

module.exports = new PayrollService();
