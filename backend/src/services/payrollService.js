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

const isRuleApplicable = (emp, rule) => {
    if (!emp) return true;
    if (emp.applicable_statutory_rules) {
        try {
            const ruleIds = typeof emp.applicable_statutory_rules === 'string'
                ? JSON.parse(emp.applicable_statutory_rules)
                : emp.applicable_statutory_rules;
            if (Array.isArray(ruleIds)) {
                return ruleIds.includes(rule.id);
            }
        } catch (e) {
            // fallback
        }
    }
    const name = rule.rule_name.toLowerCase();
    if (name.includes('pf') || name.includes('provident')) {
        return !!emp.include_pf;
    }
    if (name.includes('esic') || name.includes('esi') || name.includes('insurance')) {
        return !!emp.include_esi;
    }
    if (name.includes('lwf')) {
        return !!emp.include_lwf;
    }
    if (name.includes('gratuity')) {
        return !!emp.include_gratuity;
    }
    return true; // default to true for other rules if not configured
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
            return d.toLocaleDateString('sv-SE', { timeZone: 'Asia/Kolkata' });
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

    calculateProratedSalaryComponents(activeRevision, paidDays, daysInMonth, stats, rules, manDeduction, loanEmi, otBonus, unpaidLeaveDays = null, emp = null, globalRules = []) {
        const baseSalary = parseFloat(activeRevision.basic);
        const totalAllowances = parseFloat(activeRevision.hra) + parseFloat(activeRevision.special_allowance || 0) + parseFloat(activeRevision.medical_allowance || 0);
        let totalDeductions = 0;

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

        let employeePf = 0;
        let employerPf = 0;
        let employeeEsic = 0;
        let employerEsic = 0;
        let totalOtherStatutoryDeductions = 0;
        const breakdown = [];

        const otherDeductionsBreakdown = [];
        if (globalRules && globalRules.length > 0) {
            for (const rule of globalRules) {
                const ruleNameLower = rule.rule_name.toLowerCase();

                // Respect employee's onboarding statutory choices
                if (!isRuleApplicable(emp, rule)) {
                    continue;
                }

                const isFlat = rule.base_on === 'flat_amount';
                const calcBaseEarned = rule.base_on === 'gross_salary' ? earnedGross : earnedBasic;
                let eeShare = isFlat ? (parseFloat(rule.employee_percentage) || 0) * prorationFactor : (calcBaseEarned * (parseFloat(rule.employee_percentage) / 100));
                let erShare = isFlat ? (parseFloat(rule.employer_percentage) || 0) * prorationFactor : (calcBaseEarned * (parseFloat(rule.employer_percentage) / 100));

                if (ruleNameLower.includes('pf') || ruleNameLower.includes('provident')) {
                    const pfCeiling = 15000;
                    const pfExcess = emp?.pf_excess_contribution === true || emp?.pf_excess_contribution === 1;
                    
                    if (pfExcess) {
                        // Option 2: Employee PF on full basic salary (no cap), Employer PF capped at 15000 (1800 cap)
                        eeShare = isFlat ? (parseFloat(rule.employee_percentage) || 0) * prorationFactor : (calcBaseEarned * (parseFloat(rule.employee_percentage) / 100));
                        erShare = isFlat ? (parseFloat(rule.employer_percentage) || 0) * prorationFactor : (Math.min(calcBaseEarned, pfCeiling) * (parseFloat(rule.employer_percentage) / 100));
                    } else {
                        // Option 1: Both Employee and Employer PF capped at 15000 (1800 cap)
                        eeShare = isFlat ? (parseFloat(rule.employee_percentage) || 0) * prorationFactor : (Math.min(calcBaseEarned, pfCeiling) * (parseFloat(rule.employee_percentage) / 100));
                        erShare = isFlat ? (parseFloat(rule.employer_percentage) || 0) * prorationFactor : (Math.min(calcBaseEarned, pfCeiling) * (parseFloat(rule.employer_percentage) / 100));
                    }
                    employeePf = eeShare;
                    employerPf = erShare;
                } else if (ruleNameLower.includes('esic') || ruleNameLower.includes('esi') || ruleNameLower.includes('insurance')) {
                    const structuredGross = parseFloat(activeRevision.gross_salary) 
                        || (parseFloat(activeRevision.basic) + (parseFloat(activeRevision.hra) || 0) + (parseFloat(activeRevision.special_allowance) || 0) + (parseFloat(activeRevision.medical_allowance) || 0));
                    
                    if (structuredGross >= 21000) {
                        eeShare = 0;
                        erShare = 0;
                    }
                    employeeEsic = eeShare;
                    employerEsic = erShare;
                } else {
                    totalOtherStatutoryDeductions += eeShare;
                    if (!ruleNameLower.includes('gratuity')) {
                        otherDeductionsBreakdown.push({
                            name: rule.rule_name,
                            amount: parseFloat(eeShare.toFixed(2))
                        });
                    }
                }

                breakdown.push({
                    rule_name: rule.rule_name,
                    employee_percentage: rule.employee_percentage,
                    employer_percentage: rule.employer_percentage,
                    employee_share: eeShare.toFixed(2),
                    employer_share: erShare.toFixed(2),
                    base_on: rule.base_on
                });
            }
        } else {
            employeePf = includePf ? (parseFloat(activeRevision.employee_pf) * prorationFactor) : 0;
            employeeEsic = includeEsi ? (parseFloat(activeRevision.employee_esic) * prorationFactor) : 0;
            employerPf = includePf ? (parseFloat(activeRevision.employer_pf) * prorationFactor) : 0;
            employerEsic = includeEsi ? (parseFloat(activeRevision.employer_esic) * prorationFactor) : 0;

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
                    employee_percentage: "0.75",
                    employer_percentage: "3.25",
                    employee_share: employeeEsic.toFixed(2),
                    employer_share: employerEsic.toFixed(2),
                    base_on: "gross_salary"
                });
            }
        }

        const dailyRate = baseSalary / daysInMonth;
        let lateDeduction = 0;
        const extraLates = stats?.L || 0;
        if (extraLates > 0) {
            if (rules.late_deduction_type === 'half_day') {
                lateDeduction = extraLates * (dailyRate * 0.5);
            } else if (rules.late_deduction_type === 'full_day') {
                lateDeduction = extraLates * dailyRate;
            } else if (rules.late_deduction_type === 'flat') {
                lateDeduction = extraLates * parseFloat(rules.late_deduction_value || 0);
            } else if (rules.late_deduction_type === 'percent_gross') {
                const grossSalary = parseFloat(activeRevision.gross_salary) || (baseSalary + totalAllowances);
                lateDeduction = extraLates * (grossSalary * (parseFloat(rules.late_deduction_value || 0) / 100));
            } else if (rules.late_deduction_type === 'percent_basic') {
                lateDeduction = extraLates * (baseSalary * (parseFloat(rules.late_deduction_value || 0) / 100));
            }
        }

        const netSalary = (earnedGross - lateDeduction - employeePf - employeeEsic - totalOtherStatutoryDeductions - parseFloat(manDeduction || 0) - parseFloat(loanEmi || 0) + parseFloat(otBonus || 0)).toFixed(2);

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
            totalOtherStatutoryDeductions,
            breakdown,
            otherDeductionsBreakdown,
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
            late_deduction_value: 0,
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
                    late_deduction_value: scheme.late_deduction_value !== undefined && scheme.late_deduction_value !== null ? scheme.late_deduction_value : activeRules.late_deduction_value,
                    ot_rate_multiplier: scheme.ot_rate_multiplier !== undefined && scheme.ot_rate_multiplier !== null ? scheme.ot_rate_multiplier : activeRules.ot_rate_multiplier
                };
            }
        }

        // Dynamically resolve Grace Cap / Mo from assigned shift to sync Late Mark Policy
        let employeeGraceCap = null;
        try {
            const targetDate = `${year}-${String(month).padStart(2, '0')}-01`;
            const activeAssignment = await db('employee_shift_assignments as esa')
                .join('shifts as s', 'esa.shift_id', 's.id')
                .where('esa.employee_id', employeeId)
                .where('esa.from_date', '<=', targetDate)
                .andWhere(qb => {
                    qb.where('esa.to_date', '>=', targetDate).orWhereNull('esa.to_date');
                })
                .select('s.grace_count_limit')
                .orderBy('esa.id', 'desc')
                .first();

            if (activeAssignment && activeAssignment.grace_count_limit !== undefined && activeAssignment.grace_count_limit !== null) {
                employeeGraceCap = parseInt(activeAssignment.grace_count_limit);
            } else if (emp && emp.shift_id) {
                const directShift = await db('shifts').where({ id: emp.shift_id }).first();
                if (directShift && directShift.grace_count_limit !== undefined && directShift.grace_count_limit !== null) {
                    employeeGraceCap = parseInt(directShift.grace_count_limit);
                }
            }
        } catch (err) {
            console.error('Error resolving employee shift grace cap:', err.message);
        }

        if (employeeGraceCap !== null) {
            activeRules.max_late_allowed = employeeGraceCap;
        }

        const globalRules = await db('global_payroll_rules').where({ company_id: companyId, is_active: true });

        // Calculate components
        let baseSalary, totalAllowances, totalDeductions, unpaidLeaveDeduction, lateDeduction, employeePf, employerPf, employeeEsic, employerEsic, breakdown, netSalary;
        let totalOtherStatutoryDeductions = 0;
        let fullBaseSalary = 0, fullTotalAllowances = 0;
        let otherDeductionsBreakdown = [];
        const unpaidLeaveDaysForDeduction = daysInMonth - paidDays;
        let actualLoanEmi = parseFloat(loanEmi || 0);

        if (activeRevision.isRevision) {
            // First calculate net salary before loan EMI to cap the EMI deduction
            const tempComp = this.calculateProratedSalaryComponents(
                activeRevision,
                paidDays,
                daysInMonth,
                empRecord.stats,
                activeRules,
                manualDeduction,
                0, // 0 loan EMI
                overtimeBonus,
                unpaidLeaveDaysForDeduction,
                emp,
                globalRules
            );
            const netBeforeLoan = parseFloat(tempComp.netSalary) || 0;
            actualLoanEmi = Math.min(actualLoanEmi, Math.max(0, netBeforeLoan));

            const comp = this.calculateProratedSalaryComponents(
                activeRevision,
                paidDays,
                daysInMonth,
                empRecord.stats,
                activeRules,
                manualDeduction,
                actualLoanEmi,
                overtimeBonus,
                unpaidLeaveDaysForDeduction,
                emp,
                globalRules
            );
            otherDeductionsBreakdown = comp.otherDeductionsBreakdown || [];
            baseSalary = comp.baseSalary;
            totalAllowances = comp.totalAllowances;
            totalOtherStatutoryDeductions = comp.totalOtherStatutoryDeductions || 0;
            totalDeductions = comp.totalDeductions + totalOtherStatutoryDeductions;
            unpaidLeaveDeduction = comp.unpaidLeaveDeduction;
            lateDeduction = comp.lateDeduction;
            employeePf = comp.employeePf;
            employerPf = comp.employerPf;
            employeeEsic = comp.employeeEsic;
            employerEsic = comp.employerEsic;
            breakdown = comp.breakdown;
            netSalary = Math.max(0, parseFloat(comp.netSalary)).toFixed(2);
            
            fullBaseSalary = parseFloat(activeRevision.basic) || 0;
            fullTotalAllowances = (parseFloat(activeRevision.hra) || 0) + (parseFloat(activeRevision.special_allowance) || 0) + (parseFloat(activeRevision.medical_allowance) || 0);
        } else {
            baseSalary = parseFloat(activeRevision.base_salary);
            const allowances = safeParseJson(activeRevision.allowances);
            const deductions = safeParseJson(activeRevision.deductions);

            const dailyRate = baseSalary / daysInMonth;
            const earnedBase = dailyRate * paidDays;

            totalAllowances = allowances.reduce((acc, curr) => acc + parseFloat(curr.amount), 0);
            const prorationFactor = paidDays / daysInMonth;
            const earnedAllowances = totalAllowances * prorationFactor;

            lateDeduction = 0;
            const extraLates = empRecord.stats.L || 0;
            if (extraLates > 0) {
                if (activeRules.late_deduction_type === 'half_day') {
                    lateDeduction = extraLates * (dailyRate * 0.5);
                } else if (activeRules.late_deduction_type === 'full_day') {
                    lateDeduction = extraLates * dailyRate;
                } else if (activeRules.late_deduction_type === 'flat') {
                    lateDeduction = extraLates * parseFloat(activeRules.late_deduction_value || 0);
                } else if (activeRules.late_deduction_type === 'percent_gross') {
                    const grossSalary = parseFloat(activeRevision.gross_salary) || (baseSalary + totalAllowances);
                    lateDeduction = extraLates * (grossSalary * (parseFloat(activeRules.late_deduction_value || 0) / 100));
                } else if (activeRules.late_deduction_type === 'percent_basic') {
                    lateDeduction = extraLates * (baseSalary * (parseFloat(activeRules.late_deduction_value || 0) / 100));
                }
            }

            const filteredDeductions = deductions.filter(d => {
                const name = d.name.toLowerCase();
                return !name.includes('pf') && !name.includes('provident') && !name.includes('esic') && !name.includes('esi');
            });
            totalDeductions = filteredDeductions.reduce((acc, curr) => acc + parseFloat(curr.amount), 0);
            const earnedDeductions = totalDeductions * prorationFactor;

            const dailyGross = (baseSalary + totalAllowances) / daysInMonth;
            unpaidLeaveDeduction = unpaidLeaveDaysForDeduction * dailyGross;

            employeePf = 0;
            employerPf = 0;
            employeeEsic = 0;
            employerEsic = 0;
            let totalOtherStatutoryDeductions = 0;
            breakdown = [];

            for (const rule of globalRules) {
                const ruleNameLower = rule.rule_name.toLowerCase();

                // Respect employee's onboarding statutory choices
                if (!isRuleApplicable(emp, rule)) {
                    continue;
                }

                const isFlat = rule.base_on === 'flat_amount';
                const calcBaseEarned = rule.base_on === 'gross_salary' ? (earnedBase + earnedAllowances) : earnedBase;
                let eeShare = isFlat ? (parseFloat(rule.employee_percentage) || 0) * prorationFactor : (calcBaseEarned * (parseFloat(rule.employee_percentage) / 100));
                let erShare = isFlat ? (parseFloat(rule.employer_percentage) || 0) * prorationFactor : (calcBaseEarned * (parseFloat(rule.employer_percentage) / 100));

                if (ruleNameLower.includes('pf') || ruleNameLower.includes('provident')) {
                    const pfCeiling = 15000;
                    const pfExcess = emp?.pf_excess_contribution === true || emp?.pf_excess_contribution === 1;
                    
                    if (pfExcess) {
                        // Option 2: Employee PF on full basic salary (no cap), Employer PF capped at 15000 (1800 cap)
                        eeShare = isFlat ? (parseFloat(rule.employee_percentage) || 0) * prorationFactor : (calcBaseEarned * (parseFloat(rule.employee_percentage) / 100));
                        erShare = isFlat ? (parseFloat(rule.employer_percentage) || 0) * prorationFactor : (Math.min(calcBaseEarned, pfCeiling) * (parseFloat(rule.employer_percentage) / 100));
                    } else {
                        // Option 1: Both Employee and Employer PF capped at 15000 (1800 cap)
                        eeShare = isFlat ? (parseFloat(rule.employee_percentage) || 0) * prorationFactor : (Math.min(calcBaseEarned, pfCeiling) * (parseFloat(rule.employee_percentage) / 100));
                        erShare = isFlat ? (parseFloat(rule.employer_percentage) || 0) * prorationFactor : (Math.min(calcBaseEarned, pfCeiling) * (parseFloat(rule.employer_percentage) / 100));
                    }
                    employeePf = eeShare;
                    employerPf = erShare;
                } else if (ruleNameLower.includes('esic') || ruleNameLower.includes('esi') || ruleNameLower.includes('insurance')) {
                    const structuredGross = parseFloat(activeRevision.gross_salary) 
                        || (parseFloat(activeRevision.basic) + (parseFloat(activeRevision.hra) || 0) + (parseFloat(activeRevision.special_allowance) || 0) + (parseFloat(activeRevision.medical_allowance) || 0));
                    
                    if (structuredGross >= 21000) {
                        eeShare = 0;
                        erShare = 0;
                    }
                    employeeEsic = eeShare;
                    employerEsic = erShare;
                } else {
                    totalOtherStatutoryDeductions += eeShare;
                    if (!ruleNameLower.includes('gratuity')) {
                        otherDeductionsBreakdown.push({
                            name: rule.rule_name,
                            amount: parseFloat(eeShare.toFixed(2))
                        });
                    }
                }

                breakdown.push({
                    rule_name: rule.rule_name,
                    employee_percentage: rule.employee_percentage,
                    employer_percentage: rule.employer_percentage,
                    employee_share: eeShare.toFixed(2),
                    employer_share: erShare.toFixed(2),
                    base_on: rule.base_on
                });
            }

            filteredDeductions.forEach(d => {
                otherDeductionsBreakdown.push({
                    name: d.name,
                    amount: parseFloat((parseFloat(d.amount) * prorationFactor).toFixed(2))
                });
            });

            fullBaseSalary = baseSalary;
            fullTotalAllowances = totalAllowances;

            baseSalary = earnedBase;
            totalAllowances = earnedAllowances;
            totalDeductions = earnedDeductions + totalOtherStatutoryDeductions;
            
            const netBeforeLoan = earnedBase + earnedAllowances - earnedDeductions - lateDeduction - employeePf - employeeEsic - totalOtherStatutoryDeductions - manualDeduction + overtimeBonus;
            actualLoanEmi = Math.min(actualLoanEmi, Math.max(0, netBeforeLoan));
            netSalary = Math.max(0, netBeforeLoan - actualLoanEmi).toFixed(2);
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
            other_deductions_breakdown: otherDeductionsBreakdown,
            net_salary: netSalary,
            loan_emi_deduction: actualLoanEmi,
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
            await db.transaction(async (trx) => {
                // --- DYNAMIC OVERTIME BONUSES / MANUAL ADJUSTMENTS ---
                const existingPayroll = await trx('payrolls')
                    .where({ employee_id: empRecord.id, month, year })
                    .first();
                const otBonus = existingPayroll ? parseFloat(existingPayroll.overtime_bonus || 0) : 0;
                const manDeduction = existingPayroll ? parseFloat(existingPayroll.manual_deduction_override || 0) : 0;
                
                // Revert previous loan deductions for this month/year if they exist
                if (existingPayroll) {
                    const repayments = await trx('loan_repayments')
                        .where({ payroll_id: existingPayroll.id });
                    for (const repay of repayments) {
                        const loan = await trx('loans').where({ id: repay.loan_id }).first();
                        if (loan) {
                            const newBal = parseFloat(loan.remaining_balance) + parseFloat(repay.amount_paid);
                            await trx('loans').where({ id: loan.id }).update({
                                remaining_balance: newBal,
                                status: 'active'
                            });
                        }
                    }
                    await trx('loan_repayments').where({ payroll_id: existingPayroll.id }).del();
                }

                // --- DETECT ACTIVE LOANS & EMIs (fetch AFTER reverting to get fresh balances) ---
                const activeLoans = await trx('loans')
                    .where({ employee_id: empRecord.id, company_id: companyId, status: 'active' });
                
                let loanEmi = 0;
                const deductionsToApply = [];
                for (const loan of activeLoans) {
                    let thisEmi = Math.min(parseFloat(loan.monthly_emi), parseFloat(loan.remaining_balance));
                    if (approvedLoanIds) {
                        const match = approvedLoanIds.find(item => {
                            if (item && typeof item === 'object') {
                                return item.id === loan.id || item.loanId === loan.id;
                            }
                            return item === loan.id;
                        });
                        
                        if (match !== undefined) {
                            if (match && typeof match === 'object' && match.amount !== undefined) {
                                thisEmi = Math.min(parseFloat(match.amount), parseFloat(loan.remaining_balance));
                            }
                        } else {
                            thisEmi = 0; // Skip if not in approved list when list is provided
                        }
                    }
                    if (thisEmi > 0) {
                        loanEmi += thisEmi;
                        deductionsToApply.push({
                            loanId: loan.id,
                            amount: thisEmi,
                            remaining_balance: parseFloat(loan.remaining_balance)
                        });
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

                if (comp) {
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
                        loan_emi_deduction: parseFloat(comp.loan_emi_deduction).toFixed(2),
                        employee_pf: parseFloat(comp.employee_pf).toFixed(2),
                        employer_pf: parseFloat(comp.employer_pf).toFixed(2),
                        employee_esic: parseFloat(comp.employee_esic).toFixed(2),
                        employer_esic: parseFloat(comp.employer_esic).toFixed(2),
                        statutory_rules_breakdown: JSON.stringify(comp.statutory_rules_breakdown),
                        net_salary: parseFloat(comp.net_salary).toFixed(2),
                        status: 'generated',
                        processed_at: trx.fn.now()
                    };

                    await trx('payrolls')
                        .insert(payrollEntry)
                        .onConflict(['employee_id', 'month', 'year'])
                        .merge();

                    // Retrieve saved payroll record ID
                    const savedPayroll = await trx('payrolls')
                        .where({ employee_id: empRecord.id, month, year })
                        .first();

                    if (savedPayroll) {
                        for (const item of deductionsToApply) {
                            const newBalance = Math.max(0, item.remaining_balance - item.amount);
                            const newStatus = newBalance === 0 ? 'completed' : 'active';
                            
                            await trx('loans').where({ id: item.loanId }).update({
                                remaining_balance: newBalance,
                                status: newStatus
                            });

                            await trx('loan_repayments').insert({
                                company_id: companyId,
                                loan_id: item.loanId,
                                amount_paid: item.amount,
                                payment_method: 'payroll',
                                payment_date: trx.fn.now(),
                                payroll_id: savedPayroll.id,
                                notes: `Auto-EMI deducted via payroll for ${month}/${year}`
                            });
                        }
                    }

                    results.push({ ...payrollEntry, processed_at: new Date() });
                }
            });
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
            const activeLoans = await db('loans')
                .where({ employee_id: empRecord.id, company_id: companyId, status: 'active' });
            let loanEmi = 0;
            for (const loan of activeLoans) {
                loanEmi += Math.min(parseFloat(loan.monthly_emi), parseFloat(loan.remaining_balance));
            }

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

            let gratuityShare = 0;
            if (comp.statutory_rules_breakdown) {
                const gratRule = comp.statutory_rules_breakdown.find(r => r.rule_name.toLowerCase().includes('gratuity'));
                if (gratRule) {
                    gratuityShare = parseFloat(gratRule.employee_share) || 0;
                }
            }

            register.push({
                employee_id: empRecord.id,
                first_name: empRecord.name.split(' ')[0] || '',
                last_name: empRecord.name.split(' ').slice(1).join(' ') || '',
                employee_id_number: empRecord.code,
                designation: empRecord.role,
                department: empRecord.department,
                department_name: empRecord.department,
                location: empRecord.location,
                office_location: empRecord.location,
                base_salary: comp.base_salary,
                total_allowances: comp.total_allowances,
                full_base_salary: comp.full_base_salary,
                full_total_allowances: comp.full_total_allowances,
                total_deductions: Math.max(0, comp.total_deductions - gratuityShare),
                other_deductions_breakdown: comp.other_deductions_breakdown || [],
                gratuity_share: gratuityShare,
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
                loan_emi_deduction: comp.loan_emi_deduction,
                statutory_rules_breakdown: comp.statutory_rules_breakdown,
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
            // Check if loan repayment has already been logged for this payroll
            const alreadyDeducted = await db('loan_repayments')
                .where({ payroll_id: existing.id })
                .first();

            if (!alreadyDeducted) {
                const activeLoans = await db('loans')
                    .where({ employee_id: existing.employee_id, company_id: companyId, status: 'active' })
                    .orderBy('id', 'asc');
                
                let remainingCuts = parseFloat(existing.loan_emi_deduction || 0);
                for (const loan of activeLoans) {
                    if (remainingCuts <= 0) break;
                    
                    const expectedEmi = Math.min(parseFloat(loan.monthly_emi), parseFloat(loan.remaining_balance));
                    const deductedAmount = Math.min(expectedEmi, remainingCuts);
                    if (deductedAmount > 0) {
                        const newBalance = Math.max(0, parseFloat(loan.remaining_balance) - deductedAmount);
                        const newStatus = newBalance === 0 ? 'completed' : 'active';
                        await db('loans').where({ id: loan.id }).update({
                            remaining_balance: newBalance,
                            status: newStatus
                        });

                        // Log the payroll repayment transaction
                        await db('loan_repayments').insert({
                            company_id: companyId,
                            loan_id: loan.id,
                            amount_paid: deductedAmount,
                            payment_method: 'payroll',
                            payment_date: db.fn.now(),
                            payroll_id: existing.id,
                            notes: `Auto-EMI deducted via payroll for ${existing.month}/${existing.year}`
                        });

                        remainingCuts -= deductedAmount;
                    }
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
            .select('p.*', 'e.*', 'c.name as company_name', 'c.email as company_email', 'c.logo_url as company_logo', 'c.brand_color as company_color')
            .first();

        if (!payroll) throw new Error('Payroll record not found');

        const doc = new PDFDocument({ size: 'A4', margins: { top: 50, bottom: 0, left: 50, right: 50 } });
        
        const pageWidth = doc.page.width;
        const pageHeight = doc.page.height;
        const margin = 50;

        // Theme accent color: dynamic from company brand_color or fallback to red
        const primaryColor = payroll.company_color || '#DC2626';

        // 1. Draw Theme Accents (creative top and left borders)
        doc.rect(0, 0, pageWidth, 6).fill(primaryColor);
        doc.rect(0, 0, 4, pageHeight).fill(primaryColor);

        // 2. Draw Header Info
        const headerY = 25;
        
        const isHighwayKing = (payroll.company_name || '').toUpperCase().includes('HIGHWAY KING');
        const companyContactText = isHighwayKing
            ? 'Contact: +91-9829065000 | info@hotelhighwayking.com | GSTN: 08AAAAA1111A1Z1 | MSME: UDYAM-RJ-17-0000001'
            : `Contact: ${payroll.company_email || 'N/A'}`;
        
        const companyAddressText = isHighwayKing
            ? 'Near Toll Plaza, Bagru, Ajmer Road, Jaipur, Rajasthan - 303007'
            : `Email: ${payroll.company_email || 'N/A'}`;

        doc.fillColor(primaryColor).font('Helvetica-Bold').fontSize(18).text(payroll.company_name || 'MyFastHR Solutions', margin, headerY);
        doc.fillColor('#475569').font('Helvetica').fontSize(7.5).text(companyAddressText, margin, headerY + 20);
        doc.fillColor('#64748B').font('Helvetica').fontSize(7).text(companyContactText, margin, headerY + 29);
        
        // Draw logo image or character placeholder
        const fs = require('fs');
        const path = require('path');
        const logoPath = payroll.company_logo ? path.join(__dirname, '../../', payroll.company_logo) : null;
        const logoExists = logoPath && fs.existsSync(logoPath);
        
        if (logoExists) {
            doc.image(logoPath, pageWidth - margin - 80, headerY - 5, { width: 80, height: 26 });
        } else {
            const firstChar = (payroll.company_name || 'H').charAt(0).toUpperCase();
            doc.fillColor(primaryColor);
            doc.roundedRect(pageWidth - margin - 22, headerY - 2, 22, 22, 4).fill();
            doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(14).text(firstChar, pageWidth - margin - 15, headerY + 3);
        }

        // Header separator line
        doc.strokeColor(primaryColor).lineWidth(1.5).moveTo(margin, headerY + 43).lineTo(pageWidth - margin, headerY + 43).stroke();

        // 3. Document Title
        const monthName = new Date(payroll.year, payroll.month - 1).toLocaleString('default', { month: 'long' });
        doc.fillColor('#0F172A').font('Helvetica-Bold').fontSize(13).text('PAYSLIP', margin, headerY + 56, { align: 'center' });
        doc.fontSize(8.5).font('Helvetica-Bold').fillColor('#475569').text(`FOR THE MONTH OF ${monthName.toUpperCase()} ${payroll.year}`, margin, headerY + 72, { align: 'center' });

        // 4. Employee Info Card Box
        const infoY = headerY + 92;
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

        // 8. Disclaimer Block (System generated slip replaces physical signatures)
        const disclaimerY = wordsY + 28;
        doc.fillColor('#64748B')
            .font('Helvetica-Bold')
            .fontSize(8.5)
            .text('This is a computer-generated payslip and does not require a physical signature or stamp.', margin, disclaimerY, { align: 'center', width: pageWidth - (margin * 2) });

        // 9. Document Footer
        const footerY = pageHeight - 30;
        doc.strokeColor(primaryColor).lineWidth(1).moveTo(margin, footerY).lineTo(pageWidth - margin, footerY).stroke();

        doc.fillColor('#94A3B8')
            .font('Helvetica-Bold')
            .fontSize(7)
            .text('Generated via MyFastHR Payroll Portal', margin, footerY + 5, { align: 'center', width: pageWidth - (margin * 2) });

        return doc;
    }

    async generateLoanSlipPDF(loanId, companyId) {
        const loan = await db('loans as l')
            .join('employees as e', 'l.employee_id', 'e.id')
            .join('companies as c', 'l.company_id', 'c.id')
            .leftJoin('departments as d', 'e.department_id', 'd.id')
            .where({ 'l.id': loanId, 'l.company_id': companyId })
            .select(
                'l.*',
                'e.first_name',
                'e.last_name',
                'e.employee_id_number',
                'e.designation',
                'e.office_location',
                'e.joining_date',
                'd.name as department_name',
                'c.name as company_name',
                'c.email as company_email',
                'c.logo_url as company_logo',
                'c.brand_color as company_color'
            )
            .first();

        if (!loan) throw new Error('Loan record not found');

        // Fetch repayments history for this loan
        const repayments = await db('loan_repayments')
            .where({ loan_id: loanId, company_id: companyId })
            .orderBy('payment_date', 'asc');

        const doc = new PDFDocument({ size: 'A4', margins: { top: 50, bottom: 0, left: 50, right: 50 } });
        
        const pageWidth = doc.page.width;
        const pageHeight = doc.page.height;
        const margin = 50;

        // Theme accent color: dynamic from company brand_color or fallback to red/indigo
        const primaryColor = loan.company_color || '#4361ee';

        // 1. Draw Theme Accents (creative top and left borders)
        doc.rect(0, 0, pageWidth, 6).fill(primaryColor);
        doc.rect(0, 0, 4, pageHeight).fill(primaryColor);

        // 2. Draw Header Info
        const headerY = 25;
        
        const isHighwayKing = (loan.company_name || '').toUpperCase().includes('HIGHWAY KING');
        const companyContactText = isHighwayKing
            ? 'Contact: +91-9829065000 | info@hotelhighwayking.com | GSTN: 08AAAAA1111A1Z1 | MSME: UDYAM-RJ-17-0000001'
            : `Contact: ${loan.company_email || 'N/A'}`;
        
        const companyAddressText = isHighwayKing
            ? 'Near Toll Plaza, Bagru, Ajmer Road, Jaipur, Rajasthan - 303007'
            : `Email: ${loan.company_email || 'N/A'}`;

        doc.fillColor(primaryColor).font('Helvetica-Bold').fontSize(18).text(loan.company_name || 'MyFastHR Solutions', margin, headerY);
        doc.fillColor('#475569').font('Helvetica').fontSize(7.5).text(companyAddressText, margin, headerY + 20);
        doc.fillColor('#64748B').font('Helvetica').fontSize(7).text(companyContactText, margin, headerY + 29);
        
        // Draw logo image or character placeholder
        const fs = require('fs');
        const path = require('path');
        const logoPath = loan.company_logo ? path.join(__dirname, '../../', loan.company_logo) : null;
        const logoExists = logoPath && fs.existsSync(logoPath);
        
        if (logoExists) {
            doc.image(logoPath, pageWidth - margin - 80, headerY - 5, { width: 80, height: 26 });
        } else {
            const firstChar = (loan.company_name || 'H').charAt(0).toUpperCase();
            doc.fillColor(primaryColor);
            doc.roundedRect(pageWidth - margin - 22, headerY - 2, 22, 22, 4).fill();
            doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(14).text(firstChar, pageWidth - margin - 15, headerY + 3);
        }

        // Header separator line
        doc.strokeColor(primaryColor).lineWidth(1.5).moveTo(margin, headerY + 43).lineTo(pageWidth - margin, headerY + 43).stroke();

        // 3. Document Title
        doc.fillColor('#0F172A').font('Helvetica-Bold').fontSize(13).text('LOAN / ADVANCE SLIP', margin, headerY + 56, { align: 'center' });
        doc.fontSize(8.5).font('Helvetica-Bold').fillColor('#475569').text(`RECORD OF DISBURSAL & ACCOUNT STATEMENT`, margin, headerY + 72, { align: 'center' });

        // 4. Employee Info Card Box
        const infoY = headerY + 92;
        const boxHeight = 75;
        doc.strokeColor('#E2E8F0').lineWidth(0.5).rect(margin, infoY, pageWidth - (margin * 2), boxHeight).stroke();

        // Row 1
        doc.fillColor('#64748B').font('Helvetica-Bold').fontSize(8.5).text('Employee Name:', margin + 15, infoY + 12);
        doc.fillColor('#0F172A').font('Helvetica-Bold').text(`${loan.first_name} ${loan.last_name}`, margin + 105, infoY + 12);

        doc.fillColor('#64748B').text('Employee ID:', margin + 260, infoY + 12);
        doc.fillColor('#0F172A').text(loan.employee_id_number || 'N/A', margin + 340, infoY + 12);

        // Row 2
        doc.fillColor('#64748B').text('Designation:', margin + 15, infoY + 32);
        doc.fillColor('#0F172A').text(loan.designation || 'N/A', margin + 105, infoY + 32);

        doc.fillColor('#64748B').text('Department:', margin + 260, infoY + 32);
        doc.fillColor('#0F172A').text(loan.department_name || 'N/A', margin + 340, infoY + 32);

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
        doc.fillColor('#64748B').text('Disbursal Date:', margin + 15, infoY + 52);
        doc.fillColor('#0F172A').text(formatDisplayDate(loan.loan_date || loan.created_at), margin + 105, infoY + 52);

        doc.fillColor('#64748B').text('Office Location:', margin + 260, infoY + 52);
        doc.fillColor('#0F172A').text(loan.office_location || 'N/A', margin + 340, infoY + 52);

        // 5. Advance Financials Overview
        const finY = infoY + boxHeight + 20;
        const colWidth = (pageWidth - (margin * 2) - 15) / 2; // Split width evenly
        const rightColX = margin + colWidth + 15;

        // Draw Loan Ledger Table Header
        doc.fillColor('#F8FAFC').rect(margin, finY, colWidth, 20).fill();
        doc.strokeColor('#E2E8F0').lineWidth(0.5).rect(margin, finY, colWidth, 20).stroke();
        doc.fillColor('#0F172A').font('Helvetica-Bold').fontSize(8.5).text('ADVANCE TERMS', margin + 10, finY + 6);
        doc.text('Details', margin + colWidth - 85, finY + 6, { align: 'right', width: 75 });

        doc.fillColor('#F8FAFC').rect(rightColX, finY, colWidth, 20).fill();
        doc.strokeColor('#E2E8F0').lineWidth(0.5).rect(rightColX, finY, colWidth, 20).stroke();
        doc.fillColor('#0F172A').font('Helvetica-Bold').text('CURRENT BALANCE', rightColX + 10, finY + 6);
        doc.text('Amount (INR)', rightColX + colWidth - 85, finY + 6, { align: 'right', width: 75 });

        // Gather loan details
        const termsList = [
            { label: 'Advance Title', val: loan.title || 'Salary Advance' },
            { label: 'Principal Amount', val: `INR ${parseFloat(loan.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` },
            { label: 'Monthly EMI', val: `INR ${parseFloat(loan.monthly_emi).toLocaleString('en-IN', { minimumFractionDigits: 2 })}/mo` }
        ];

        const balanceList = [
            { label: 'Original Principal', val: parseFloat(loan.amount) },
            { label: 'Remaining Balance', val: parseFloat(loan.remaining_balance) },
            { label: 'Repayment Status', val: (loan.status || 'pending').toUpperCase() }
        ];

        const rowHeight = 22;
        for (let i = 0; i < 3; i++) {
            const rY = finY + 20 + (i * rowHeight);

            // Terms cell
            doc.strokeColor('#E2E8F0').lineWidth(0.5).rect(margin, rY, colWidth, rowHeight).stroke();
            doc.fillColor('#334155').font('Helvetica').fontSize(8).text(termsList[i].label, margin + 10, rY + 7);
            doc.fillColor('#0F172A').font('Helvetica-Bold').text(termsList[i].val.toString(), margin + colWidth - 160, rY + 7, { align: 'right', width: 150 });

            // Balance cell
            doc.strokeColor('#E2E8F0').lineWidth(0.5).rect(rightColX, rY, colWidth, rowHeight).stroke();
            doc.fillColor('#334155').font('Helvetica').fontSize(8).text(balanceList[i].label, rightColX + 10, rY + 7);
            if (typeof balanceList[i].val === 'number') {
                doc.fillColor('#0F172A').font('Helvetica-Bold').text(balanceList[i].val.toLocaleString('en-IN', { minimumFractionDigits: 2 }), rightColX + colWidth - 85, rY + 7, { align: 'right', width: 75 });
            } else {
                const isPaid = balanceList[i].val === 'COMPLETED';
                const isActive = balanceList[i].val === 'ACTIVE';
                const statusColor = isPaid ? '#10B981' : (isActive ? '#4361ee' : '#F59E0B');
                doc.fillColor(statusColor).font('Helvetica-Bold').text(balanceList[i].val, rightColX + colWidth - 85, rY + 7, { align: 'right', width: 75 });
            }
        }

        // Shaded summary box for Outstanding Balance
        const sumY = finY + 20 + (3 * rowHeight) + 10;
        doc.fillColor('#FEF2F2').rect(margin, sumY, pageWidth - (margin * 2), 32).fill();
        doc.strokeColor('#FCA5A5').lineWidth(1).rect(margin, sumY, pageWidth - (margin * 2), 32).stroke();
        doc.fillColor('#991B1B').font('Helvetica-Bold').fontSize(8.5).text('OUTSTANDING BALANCE TO REPAY', margin + 15, sumY + 11);
        doc.fillColor('#991B1B').font('Helvetica-Bold').fontSize(12).text(`INR ${parseFloat(loan.remaining_balance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, pageWidth - margin - 215, sumY + 10, { align: 'right', width: 200 });

        // Amount in Words (Outstanding)
        const wordY = sumY + 32 + 8;
        doc.fillColor('#475569').font('Helvetica-Oblique').fontSize(8.5).text(`Outstanding in Words: ${convertNumberToWords(Math.round(parseFloat(loan.remaining_balance)))}`, margin + 5, wordY);

        // 6. Repayment History Section
        let lastY = wordY + 20;
        if (repayments && repayments.length > 0) {
            doc.fillColor('#0F172A').font('Helvetica-Bold').fontSize(10).text('REPAYMENT HISTORY LEDGER', margin, lastY);
            lastY += 14;

            // Header for Repayments
            const repColWidth = (pageWidth - (margin * 2)) / 4;
            doc.fillColor('#F8FAFC').rect(margin, lastY, pageWidth - (margin * 2), 18).fill();
            doc.strokeColor('#E2E8F0').lineWidth(0.5).rect(margin, lastY, pageWidth - (margin * 2), 18).stroke();
            doc.fillColor('#475569').font('Helvetica-Bold').fontSize(8);
            doc.text('Date', margin + 10, lastY + 5);
            doc.text('Payment Method', margin + repColWidth + 10, lastY + 5);
            doc.text('Notes / Reference', margin + (repColWidth * 2) + 10, lastY + 5);
            doc.text('Amount Paid', margin + (repColWidth * 3) + 10, lastY + 5, { width: repColWidth - 20, align: 'right' });
            lastY += 18;

            // Repayment Rows
            repayments.forEach((rep) => {
                doc.strokeColor('#E2E8F0').lineWidth(0.5).rect(margin, lastY, pageWidth - (margin * 2), 18).stroke();
                doc.fillColor('#334155').font('Helvetica').fontSize(7.5);
                doc.text(formatDisplayDate(rep.payment_date), margin + 10, lastY + 5);
                doc.text((rep.payment_method || 'manual').toUpperCase(), margin + repColWidth + 10, lastY + 5);
                doc.text(rep.notes || 'N/A', margin + (repColWidth * 2) + 10, lastY + 5);
                doc.fillColor('#10B981').font('Helvetica-Bold').text(`INR ${parseFloat(rep.amount_paid).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, margin + (repColWidth * 3) + 10, lastY + 5, { width: repColWidth - 20, align: 'right' });
                lastY += 18;
            });
        } else {
            doc.fillColor('#64748B').font('Helvetica-Oblique').fontSize(8.5).text('No repayment transactions have been recorded yet.', margin, lastY);
            lastY += 20;
        }

        // 7. Disclaimer Block
        const disclaimerY = lastY + 15;
        doc.fillColor('#64748B')
            .font('Helvetica-Bold')
            .fontSize(8)
            .text('This is a system-generated record of advance/loan terms and transaction ledger, and does not require a physical signature.', margin, disclaimerY, { align: 'center', width: pageWidth - (margin * 2) });

        // 8. Document Footer
        const footerY = pageHeight - 30;
        doc.strokeColor(primaryColor).lineWidth(1).moveTo(margin, footerY).lineTo(pageWidth - margin, footerY).stroke();
        doc.fillColor('#94A3B8')
            .font('Helvetica-Bold')
            .fontSize(7)
            .text('MyFastHR Loan & Advance Management Console', margin, footerY + 5, { align: 'center', width: pageWidth - (margin * 2) });

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
            .leftJoin('departments', 'employees.department_id', '=', 'departments.id')
            .where('loans.company_id', companyId)
            .select(
                'loans.*',
                'employees.first_name',
                'employees.last_name',
                'employees.employee_id_number',
                'employees.office_location',
                'employees.designation',
                'departments.name as department_name'
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
            loan_date: loanData.loan_date || now.toISOString().split('T')[0],
            status: loanData.status || 'pending'
        };
        const [id] = await db('loans').insert(payload);
        return { id, ...payload };
    }

    async updateLoan(companyId, loanId, loanData) {
        // Check if inputs are locked for the current month
        const now = new Date();
        const curMonth = now.getMonth() + 1;
        const curYear = now.getFullYear();
        const controls = await this.getPayrollControls(companyId, curMonth, curYear);
        if (controls.inputs_locked) {
            throw new Error(`Payroll inputs are locked for ${curMonth}/${curYear}.`);
        }

        const loan = await db('loans').where({ id: loanId, company_id: companyId }).first();
        if (!loan) throw new Error('Loan record not found');

        // Recalculate remaining balance from repayment history
        const repayments = await db('loan_repayments')
            .where({ loan_id: loanId })
            .sum('amount_paid as total_paid')
            .first();
        const totalPaid = parseFloat(repayments.total_paid || 0);

        const newAmount = parseFloat(loanData.amount);
        const newRemaining = Math.max(0, newAmount - totalPaid);

        const payload = {
            employee_id: parseInt(loanData.employee_id),
            title: loanData.title,
            amount: newAmount,
            monthly_emi: parseFloat(loanData.monthly_emi),
            remaining_balance: newRemaining,
            loan_date: loanData.loan_date || now.toISOString().split('T')[0],
            status: loanData.status || 'active'
        };

        await db('loans').where({ id: loanId }).update(payload);
        return { id: loanId, ...payload };
    }

    async deleteLoan(companyId, loanId) {
        // Check if inputs are locked for the current month
        const now = new Date();
        const curMonth = now.getMonth() + 1;
        const curYear = now.getFullYear();
        const controls = await this.getPayrollControls(companyId, curMonth, curYear);
        if (controls.inputs_locked) {
            throw new Error(`Payroll inputs are locked for ${curMonth}/${curYear}.`);
        }

        const loan = await db('loans').where({ id: loanId, company_id: companyId }).first();
        if (!loan) throw new Error('Loan record not found');

        await db.transaction(async (trx) => {
            // Delete repayments first, then the loan itself
            await trx('loan_repayments').where({ loan_id: loanId }).del();
            await trx('loans').where({ id: loanId }).del();
        });
        return { success: true };
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
            .select('p.*', 'e.first_name', 'e.last_name', 'e.employee_id_number', 'e.pf_excess_contribution');

        let ecrText = '';
        statements.forEach((stmt) => {
            const pfExcess = stmt.pf_excess_contribution === true || stmt.pf_excess_contribution === 1;
            const actualBase = parseFloat(stmt.base_salary) || 0;
            const pfWages = pfExcess ? actualBase : Math.min(15000, actualBase);
            const epsWages = Math.min(15000, actualBase);
            const edliWages = Math.min(15000, actualBase);
            
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
            if ((parseFloat(stmt.employee_esic) || 0) <= 0) return; // skip if no ESIC
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
            .leftJoin('departments', 'employees.department_id', '=', 'departments.id')
            .where('loan_repayments.company_id', companyId)
            .select(
                'loan_repayments.*',
                'loans.title as loan_title',
                'employees.first_name',
                'employees.last_name',
                'employees.employee_id_number',
                'employees.office_location',
                'employees.designation',
                'departments.name as department_name'
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
