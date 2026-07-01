const payrollService = require('../services/payrollService');

class PayrollController {
    async getStatements(req, res) {
        try {
            const companyId = req.user.company_id;
            const { month, year } = req.query;
            if (!companyId) return res.status(400).json({ message: 'Managed companies only' });

            const results = await payrollService.getStatements(companyId, month, year);
            res.json(results);
        } catch (error) {
            res.status(500).json({ message: 'Error fetching payroll statements', error: error.message });
        }
    }

    async getSummary(req, res) {
        try {
            const companyId = req.user.company_id;
            const { month, year } = req.query;
            if (!companyId) return res.status(400).json({ message: 'Managed companies only' });

            const results = await payrollService.getPayrollSummary(companyId, month, year);
            res.json(results);
        } catch (error) {
            res.status(500).json({ message: 'Error fetching payroll summary', error: error.message });
        }
    }

    async processPayroll(req, res) {
        try {
            const companyId = req.user.company_id;
            const { month, year } = req.body;
            if (!companyId) return res.status(400).json({ message: 'Managed companies only' });

            const results = await payrollService.processCompanyPayroll(companyId, month, year, req.user.id);
            res.status(200).json({
                message: `Payroll processed for ${results.length} employees`,
                count: results.length
            });
        } catch (error) {
            res.status(500).json({ message: 'Error processing payroll', error: error.message });
        }
    }

    async updateSalaryStructure(req, res) {
        try {
            const { employeeId } = req.params;
            const companyId = req.user.company_id;
            const data = req.body;
            await payrollService.updateStructure(employeeId, companyId, data);
            res.json({ message: 'Salary structure updated' });
        } catch (error) {
            res.status(500).json({ message: 'Error updating salary structure', error: error.message });
        }
    }
    async updatePayroll(req, res) {
        try {
            const { id } = req.params;
            const companyId = req.user.company_id;
            const data = req.body;
            if (!companyId) return res.status(400).json({ message: 'Managed companies only' });

            await payrollService.updatePayroll(id, companyId, data);
            res.json({ message: 'Payroll record updated' });
        } catch (error) {
            res.status(500).json({ message: 'Error updating payroll', error: error.message });
        }
    }

    async saveBonusAdjustment(req, res) {
        try {
            const companyId = req.user.company_id;
            const { employee_id, month, year, overtime_bonus } = req.body;
            if (!companyId) return res.status(400).json({ message: 'Managed companies only' });

            const result = await payrollService.saveBonusAdjustment(
                companyId,
                parseInt(employee_id),
                parseInt(month),
                parseInt(year),
                parseFloat(overtime_bonus) || 0
            );

            res.json({ message: 'Monthly overtime / bonus adjustments registered successfully', result });
        } catch (error) {
            res.status(500).json({ message: 'Error registering bonus adjustment', error: error.message });
        }
    }

    async saveDeductionAdjustment(req, res) {
        try {
            const companyId = req.user.company_id;
            const { employee_id, month, year, manual_deduction_override } = req.body;
            if (!companyId) return res.status(400).json({ message: 'Managed companies only' });

            const result = await payrollService.saveDeductionAdjustment(
                companyId,
                parseInt(employee_id),
                parseInt(month),
                parseInt(year),
                parseFloat(manual_deduction_override) || 0
            );

            res.json({ message: 'Monthly manual deduction adjustments registered successfully', result });
        } catch (error) {
            res.status(500).json({ message: 'Error registering deduction adjustment', error: error.message });
        }
    }

    async getLoans(req, res) {
        try {
            const companyId = req.user.company_id;
            if (!companyId) return res.status(400).json({ message: 'Managed companies only' });

            const loans = await payrollService.getLoans(companyId);
            res.json(loans);
        } catch (error) {
            res.status(500).json({ message: 'Error fetching loans', error: error.message });
        }
    }

    async createLoan(req, res) {
        try {
            const companyId = req.user.company_id;
            if (!companyId) return res.status(400).json({ message: 'Managed companies only' });

            const result = await payrollService.createLoan(companyId, req.body);
            res.json({ message: 'Loan adjustment registered successfully', result });
        } catch (error) {
            res.status(400).json({ message: error.message });
        }
    }

    async updateLoan(req, res) {
        try {
            const companyId = req.user.company_id;
            const { id } = req.params;
            if (!companyId) return res.status(400).json({ message: 'Managed companies only' });

            const result = await payrollService.updateLoan(companyId, parseInt(id), req.body);
            res.json({ message: 'Loan updated successfully', result });
        } catch (error) {
            res.status(400).json({ message: error.message });
        }
    }

    async deleteLoan(req, res) {
        try {
            const companyId = req.user.company_id;
            const { id } = req.params;
            if (!companyId) return res.status(400).json({ message: 'Managed companies only' });

            const result = await payrollService.deleteLoan(companyId, parseInt(id));
            res.json({ message: 'Loan deleted successfully', result });
        } catch (error) {
            res.status(400).json({ message: error.message });
        }
    }

    async updateLoanStatus(req, res) {
        try {
            const companyId = req.user.company_id;
            const { id } = req.params;
            const { status } = req.body;
            if (!companyId) return res.status(400).json({ message: 'Managed companies only' });

            const result = await payrollService.updateLoanStatus(companyId, parseInt(id), status);
            res.json({ message: 'Loan status updated successfully', result });
        } catch (error) {
            res.status(400).json({ message: error.message });
        }
    }

    async sendBulkEmailPayslips(req, res) {
        try {
            const companyId = req.user.company_id;
            const { month, year } = req.body;
            if (!companyId) return res.status(400).json({ message: 'Managed companies only' });

            const result = await payrollService.sendBulkEmailPayslips(companyId, month, year);
            res.json({ message: 'Payslips bulk email generation completed', result });
        } catch (error) {
            res.status(500).json({ message: 'Error sending batch email payslips', error: error.message });
        }
    }

    async exportEPFECR(req, res) {
        try {
            const companyId = req.user.company_id;
            const { month, year } = req.query;
            if (!companyId) return res.status(400).json({ message: 'Managed companies only' });

            const result = await payrollService.generateEPFECR(companyId, month, year);
            res.setHeader('Content-Type', 'text/plain');
            res.setHeader('Content-Disposition', `attachment; filename=EPF_ECR_${month}_${year}.txt`);
            res.send(result);
        } catch (error) {
            res.status(500).json({ message: 'Error generating EPF ECR export', error: error.message });
        }
    }

    async exportESICCSV(req, res) {
        try {
            const companyId = req.user.company_id;
            const { month, year } = req.query;
            if (!companyId) return res.status(400).json({ message: 'Managed companies only' });

            const result = await payrollService.generateESICCSV(companyId, month, year);
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename=ESIC_Payroll_${month}_${year}.csv`);
            res.send(result);
        } catch (error) {
            res.status(500).json({ message: 'Error generating ESIC CSV export', error: error.message });
        }
    }

    async previewLoanDeductions(req, res) {
        try {
            const companyId = req.user.company_id;
            const { month, year } = req.query;
            if (!companyId) return res.status(400).json({ message: 'Managed companies only' });

            const preview = await payrollService.previewLoanDeductions(companyId, month, year);
            res.json(preview);
        } catch (error) {
            res.status(500).json({ message: 'Error previewing loan deductions', error: error.message });
        }
    }

    async recordRepayment(req, res) {
        try {
            const companyId = req.user.company_id;
            const loanId = parseInt(req.params.id);
            if (!companyId) return res.status(400).json({ message: 'Managed companies only' });

            const result = await payrollService.recordRepayment(companyId, loanId, req.body);
            res.json({ message: 'Repayment recorded successfully', result });
        } catch (error) {
            res.status(400).json({ message: error.message });
        }
    }

    async getRepayments(req, res) {
        try {
            const companyId = req.user.company_id;
            if (!companyId) return res.status(400).json({ message: 'Managed companies only' });

            const repayments = await payrollService.getRepayments(companyId);
            res.json(repayments);
        } catch (error) {
            res.status(500).json({ message: 'Error fetching repayments history', error: error.message });
        }
    }

    async getSeparations(req, res) {
        try {
            const db = require('../config/db');
            const companyId = req.user.company_id;
            if (!companyId) return res.status(400).json({ message: 'Managed companies only' });

            const separations = await db('employee_separations as s')
                .join('employees as e', 's.employee_id', 'e.id')
                .leftJoin('departments as d', 'e.department_id', 'd.id')
                .where('s.company_id', companyId)
                .select(
                    's.*',
                    'e.first_name',
                    'e.last_name',
                    'e.employee_id_number',
                    'e.designation',
                    'e.joining_date',
                    'e.office_location',
                    'd.name as department_name'
                )
                .orderBy('s.created_at', 'desc');

            res.json(separations);
        } catch (error) {
            res.status(500).json({ message: 'Error fetching separations', error: error.message });
        }
    }

    async createSeparation(req, res) {
        try {
            const db = require('../config/db');
            const companyId = req.user.company_id;
            if (!companyId) return res.status(400).json({ message: 'Managed companies only' });

            const {
                employee_id,
                resignation_date,
                last_working_day,
                reason,
                separation_type,
                notice_period_days,
                notice_served_days,
                location,
                last_salary_paid,
                notice_adjustable_days,
                pl_days_payable,
                days_salary_payable,
                total_days_in_month,
                lop_days,
                effective_workdays,
                checked_by,
                authorized_by,
                notice_recovery_amount,
                leave_encashment_amount,
                gratuity_amount,
                unpaid_salary_amount,
                other_allowances,
                other_deductions,
                total_outstanding_loan,
                fnf_net_payable,
                notes
            } = req.body;

            if (!employee_id) {
                return res.status(400).json({ message: 'Employee ID is required' });
            }

            const existing = await db('employee_separations')
                .where({ employee_id, company_id: companyId })
                .whereIn('settlement_status', ['pending', 'calculated'])
                .first();

            if (existing) {
                return res.status(400).json({ message: 'A separation process is already active for this employee' });
            }

            const [id] = await db('employee_separations').insert({
                company_id: companyId,
                employee_id,
                resignation_date: resignation_date || null,
                last_working_day: last_working_day || null,
                reason: reason || '',
                separation_type: separation_type || 'resignation',
                notice_period_days: parseInt(notice_period_days) || 0,
                notice_served_days: parseInt(notice_served_days) || 0,
                settlement_status: 'pending',
                notes: notes || '',
                location: location || '',
                last_salary_paid: last_salary_paid || '',
                notice_adjustable_days: parseInt(notice_adjustable_days) || 0,
                pl_days_payable: parseFloat(pl_days_payable) || 0.00,
                days_salary_payable: parseInt(days_salary_payable) || 0,
                total_days_in_month: parseInt(total_days_in_month) || 30,
                lop_days: parseInt(lop_days) || 0,
                effective_workdays: parseInt(effective_workdays) || 0,
                checked_by: checked_by || '',
                authorized_by: authorized_by || '',
                notice_recovery_amount: parseFloat(notice_recovery_amount) || 0.00,
                leave_encashment_amount: parseFloat(leave_encashment_amount) || 0.00,
                gratuity_amount: parseFloat(gratuity_amount) || 0.00,
                unpaid_salary_amount: parseFloat(unpaid_salary_amount) || 0.00,
                other_allowances: parseFloat(other_allowances) || 0.00,
                other_deductions: parseFloat(other_deductions) || 0.00,
                total_outstanding_loan: parseFloat(total_outstanding_loan) || 0.00,
                fnf_net_payable: parseFloat(fnf_net_payable) || 0.00
            });

            await db('employees')
                .where({ id: employee_id, company_id: companyId })
                .update({
                    resignation_date: resignation_date || null,
                    exit_date: last_working_day || null
                });

            res.status(201).json({ message: 'Separation initiated successfully', id });
        } catch (error) {
            res.status(500).json({ message: 'Error creating separation', error: error.message });
        }
    }

    async calculateFNF(req, res) {
        try {
            const db = require('../config/db');
            const leaveRepository = require('../repositories/leaveRepository');
            const companyId = req.user.company_id;
            const empId = parseInt(req.params.empId);

            if (!companyId) return res.status(400).json({ message: 'Managed companies only' });

            // Fetch employee
            const employee = await db('employees as e')
                .leftJoin('departments as d', 'e.department_id', 'd.id')
                .where({ 'e.id': empId, 'e.company_id': companyId })
                .select('e.*', 'd.name as department_name')
                .first();
            if (!employee) {
                return res.status(404).json({ message: 'Employee not found' });
            }

            // Fetch active separation if any
            const separation = await db('employee_separations')
                .where({ employee_id: empId, company_id: companyId })
                .whereIn('settlement_status', ['pending', 'calculated'])
                .first();

            const todayStr = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Kolkata' });
            const lastWorkingDay = req.query.last_working_day || separation?.last_working_day || employee.exit_date || todayStr;
            const resignationDate = req.query.resignation_date || separation?.resignation_date || employee.resignation_date || todayStr;

            // Notice Period
            const noticePeriod = parseInt(req.query.notice_period_days || separation?.notice_period_days || 0);
            const noticeAdjustable = parseInt(req.query.notice_adjustable_days || separation?.notice_adjustable_days || 0);
            const shortfallDays = Math.max(0, noticePeriod - noticeAdjustable);

            // Work days default calculations
            let defaultTotalDays = 30;
            if (lastWorkingDay) {
                const lwdDate = new Date(lastWorkingDay);
                defaultTotalDays = new Date(lwdDate.getFullYear(), lwdDate.getMonth() + 1, 0).getDate();
            }
            const totalDaysInMonth = parseInt(req.query.total_days_in_month || separation?.total_days_in_month || defaultTotalDays || 30);

            let defaultDaysSalaryPayable = 0;
            if (lastWorkingDay) {
                const lwdDate = new Date(lastWorkingDay);
                if (employee.joining_date) {
                    const joinDate = new Date(employee.joining_date);
                    if (joinDate.getFullYear() === lwdDate.getFullYear() && joinDate.getMonth() === lwdDate.getMonth()) {
                        defaultDaysSalaryPayable = Math.max(0, lwdDate.getDate() - joinDate.getDate() + 1);
                    } else {
                        defaultDaysSalaryPayable = lwdDate.getDate();
                    }
                } else {
                    defaultDaysSalaryPayable = lwdDate.getDate();
                }
            }

            const daysSalaryPayable = parseInt(req.query.days_salary_payable || separation?.days_salary_payable || defaultDaysSalaryPayable || 0);
            const lopDays = parseInt(req.query.lop_days || separation?.lop_days || 0);
            const effectiveWorkdays = Math.max(0, daysSalaryPayable - lopDays);

            // Leave Encashment
            const leaveBalances = await leaveRepository.getBalances(empId, companyId);
            const totalAvailableLeaves = leaveBalances.reduce((sum, b) => sum + parseFloat(b.available_days || 0), 0);
            const plDaysPayable = parseFloat(req.query.pl_days_payable || separation?.pl_days_payable || 0);

            // Salary Structure
            const salaryStructure = await db('salary_structures')
                .where({ employee_id: empId, company_id: companyId })
                .first();

            const baseSalary = parseFloat(salaryStructure?.base_salary || 0);
            const dailyRate = totalDaysInMonth > 0 ? baseSalary / totalDaysInMonth : baseSalary / 30;

            // Calculations
            const noticeRecoveryAmount = dailyRate * shortfallDays;
            const leaveEncashmentAmount = dailyRate * plDaysPayable;
            const unpaidSalaryAmount = dailyRate * effectiveWorkdays;

            // Gratuity calculation (Indian Statutory: 15/26 * Base * Years of completed service, if tenure >= 5 years)
            let gratuityAmount = 0;
            let yearsOfService = 0;
            let tenureDays = 0;
            if (employee.joining_date && lastWorkingDay) {
                tenureDays = Math.floor((new Date(lastWorkingDay) - new Date(employee.joining_date)) / (1000 * 60 * 60 * 24));
                if (tenureDays >= 1825) { // 5 years
                    yearsOfService = Math.floor(tenureDays / 365.25);
                    const remainingDays = tenureDays % 365.25;
                    if (remainingDays >= 180) { // 6 months or more counts as full year
                        yearsOfService += 1;
                    }
                    gratuityAmount = (15 / 26) * baseSalary * yearsOfService;
                }
            }

            // Outstanding Loans
            const outstandingLoans = await db('loans')
                .where({ employee_id: empId, company_id: companyId })
                .whereIn('status', ['active', 'approved'])
                .select('id', 'title', 'amount', 'remaining_balance');
            const totalOutstandingLoan = outstandingLoans.reduce((acc, l) => acc + parseFloat(l.remaining_balance || 0), 0);

            // Allowances & Deductions overrides from request, db separation, or 0
            const otherAllowances = parseFloat(req.query.other_allowances || separation?.other_allowances || 0);
            const otherDeductions = parseFloat(req.query.other_deductions || separation?.other_deductions || 0);

            // Net Payable
            const fnfNetPayable = unpaidSalaryAmount + leaveEncashmentAmount + gratuityAmount + otherAllowances - noticeRecoveryAmount - totalOutstandingLoan - otherDeductions;

            res.json({
                employee: {
                    id: employee.id,
                    first_name: employee.first_name,
                    last_name: employee.last_name,
                    employee_id_number: employee.employee_id_number,
                    joining_date: employee.joining_date,
                    designation: employee.designation,
                    city: employee.city,
                    state: employee.state,
                    department_name: employee.department_name || ''
                },
                base_salary: baseSalary,
                daily_rate: parseFloat(dailyRate.toFixed(2)),
                notice_period_days: noticePeriod,
                notice_adjustable_days: noticeAdjustable,
                shortfall_days: shortfallDays,
                notice_recovery_amount: parseFloat(noticeRecoveryAmount.toFixed(2)),
                total_available_leaves: totalAvailableLeaves,
                pl_days_payable: plDaysPayable,
                leave_encashment_amount: parseFloat(leaveEncashmentAmount.toFixed(2)),
                leave_balances: leaveBalances.map(b => ({
                    id: b.id,
                    name: b.name,
                    available_days: b.available_days
                })),
                tenure_days: tenureDays,
                years_of_service: yearsOfService,
                gratuity_amount: parseFloat(gratuityAmount.toFixed(2)),
                total_days_in_month: totalDaysInMonth,
                days_salary_payable: daysSalaryPayable,
                lop_days: lopDays,
                effective_workdays: effectiveWorkdays,
                unpaid_salary_amount: parseFloat(unpaidSalaryAmount.toFixed(2)),
                outstanding_loans: outstandingLoans,
                total_outstanding_loan: parseFloat(totalOutstandingLoan.toFixed(2)),
                other_allowances: otherAllowances,
                other_deductions: otherDeductions,
                fnf_net_payable: parseFloat(fnfNetPayable.toFixed(2)),
                location: separation?.location || employee.city || employee.state || 'Jaipur',
                last_salary_paid: separation?.last_salary_paid || '',
                checked_by: separation?.checked_by || '',
                authorized_by: separation?.authorized_by || ''
            });
        } catch (error) {
            res.status(500).json({ message: 'Error calculating FNF values', error: error.message });
        }
    }

    async settleSeparation(req, res) {
        try {
            const db = require('../config/db');
            const companyId = req.user.company_id;
            const separationId = parseInt(req.params.id);

            if (!companyId) return res.status(400).json({ message: 'Managed companies only' });

            const {
                notice_recovery_amount,
                leave_encashment_amount,
                gratuity_amount,
                unpaid_salary_amount,
                other_allowances,
                other_deductions,
                total_outstanding_loan,
                fnf_net_payable,
                payment_method,
                notes,
                last_working_day,
                resignation_date,
                location,
                last_salary_paid,
                notice_adjustable_days,
                pl_days_payable,
                days_salary_payable,
                total_days_in_month,
                lop_days,
                effective_workdays,
                checked_by,
                authorized_by
            } = req.body;

            const separation = await db('employee_separations')
                .where({ id: separationId, company_id: companyId })
                .first();

            if (!separation) {
                return res.status(404).json({ message: 'Separation record not found' });
            }

            const employeeId = separation.employee_id;

            await db.transaction(async (trx) => {
                // 1. Update separation record
                await trx('employee_separations')
                    .where({ id: separationId })
                    .update({
                        notice_recovery_amount: parseFloat(notice_recovery_amount) || 0.00,
                        leave_encashment_amount: parseFloat(leave_encashment_amount) || 0.00,
                        gratuity_amount: parseFloat(gratuity_amount) || 0.00,
                        unpaid_salary_amount: parseFloat(unpaid_salary_amount) || 0.00,
                        other_allowances: parseFloat(other_allowances) || 0.00,
                        other_deductions: parseFloat(other_deductions) || 0.00,
                        total_outstanding_loan: parseFloat(total_outstanding_loan) || 0.00,
                        fnf_net_payable: parseFloat(fnf_net_payable) || 0.00,
                        settlement_status: 'settled',
                        settlement_date: trx.fn.now(),
                        payment_method: payment_method || 'bank_transfer',
                        notes: notes || '',
                        last_working_day: last_working_day || separation.last_working_day,
                        resignation_date: resignation_date || separation.resignation_date,
                        location: location || separation.location || '',
                        last_salary_paid: last_salary_paid || separation.last_salary_paid || '',
                        notice_adjustable_days: parseInt(notice_adjustable_days) || separation.notice_adjustable_days || 0,
                        pl_days_payable: parseFloat(pl_days_payable) || separation.pl_days_payable || 0.00,
                        days_salary_payable: parseInt(days_salary_payable) || separation.days_salary_payable || 0,
                        total_days_in_month: parseInt(total_days_in_month) || separation.total_days_in_month || 30,
                        lop_days: parseInt(lop_days) || separation.lop_days || 0,
                        effective_workdays: parseInt(effective_workdays) || separation.effective_workdays || 0,
                        checked_by: checked_by || separation.checked_by || '',
                        authorized_by: authorized_by || separation.authorized_by || '',
                        updated_at: trx.fn.now()
                    });

                // 2. Deactivate employee in employees table
                await trx('employees')
                    .where({ id: employeeId, company_id: companyId })
                    .update({
                        status: 'inactive',
                        exit_date: last_working_day || separation.last_working_day,
                        resignation_date: resignation_date || separation.resignation_date
                    });

                // 3. Deactivate user account in users table
                const emp = await trx('employees').where({ id: employeeId }).first();
                if (emp && emp.user_id) {
                    await trx('users')
                        .where({ id: emp.user_id, company_id: companyId })
                        .update({ status: 'inactive' });
                }

                // 4. Repay outstanding loans
                const activeLoans = await trx('loans')
                    .where({ employee_id: employeeId, company_id: companyId })
                    .whereIn('status', ['active', 'approved']);

                for (const loan of activeLoans) {
                    const remaining = parseFloat(loan.remaining_balance);
                    if (remaining > 0) {
                        // Record repayment
                        await trx('loan_repayments').insert({
                            company_id: companyId,
                            loan_id: loan.id,
                            amount_paid: remaining,
                            payment_method: 'manual',
                            payment_date: trx.fn.now(),
                            notes: 'Recovered completely during Full & Final (FNF) separation settlement'
                        });

                        // Update loan status
                        await trx('loans')
                            .where({ id: loan.id })
                            .update({
                                remaining_balance: 0.00,
                                status: 'completed'
                            });
                    }
                }
            });

            res.json({ message: 'Full & Final (FNF) settlement completed and employee deactivated successfully' });
        } catch (error) {
            res.status(500).json({ message: 'Error settling separation', error: error.message });
        }
    }

    async deleteSeparation(req, res) {
        try {
            const db = require('../config/db');
            const companyId = req.user.company_id;
            const { id } = req.params;

            if (!companyId) return res.status(400).json({ message: 'Managed companies only' });

            const separation = await db('employee_separations')
                .where({ id, company_id: companyId })
                .first();

            if (!separation) {
                return res.status(404).json({ message: 'Separation record not found' });
            }

            if (separation.settlement_status === 'settled') {
                return res.status(400).json({ message: 'Cannot delete a settled FNF record' });
            }

            await db('employee_separations')
                .where({ id, company_id: companyId })
                .del();

            await db('employees')
                .where({ id: separation.employee_id, company_id: companyId })
                .update({
                    resignation_date: null,
                    exit_date: null
                });

            res.json({ message: 'Separation process cancelled and deleted successfully' });
        } catch (error) {
            res.status(500).json({ message: 'Error deleting separation', error: error.message });
        }
    }
}

module.exports = new PayrollController();
