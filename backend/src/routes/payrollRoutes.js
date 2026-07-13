const express = require('express');
const payrollService = require('../services/payrollService');
const router = express.Router();
const { authenticate } = require('../middlewares/authMiddleware');
const tenantFilter = require('../middlewares/tenantMiddleware');

const payrollController = require('../controllers/payrollController');
const globalRulesController = require('../controllers/globalRulesController');

router.use(authenticate, tenantFilter);

router.get('/my-slips', async (req, res) => {
    try {
        const db = require('../config/db');
        let employeeId = req.user.employee_id;

        if (!employeeId) {
            const employee = await db('employees').where({ user_id: req.user.id }).select('id').first();
            employeeId = employee?.id;
        }

        if (!employeeId) {
            return res.status(404).json({ message: 'Employee profile not found' });
        }

        const slips = await db('payrolls')
            .where({ employee_id: employeeId })
            .orderBy('year', 'desc')
            .orderBy('month', 'desc');

        const controls = await db('payroll_controls')
            .where({ company_id: req.user.company_id || req.company_id });

        const controlsMap = new Map(controls.map(c => [`${c.month}-${c.year}`, c]));

        const filteredSlips = slips.filter(slip => {
            const ctrl = controlsMap.get(`${slip.month}-${slip.year}`);
            if (ctrl) {
                return !!ctrl.employee_view_released;
            }
            return true;
        });

        res.json(filteredSlips);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Global Statutory Rules (PF / ESIC) CRUD Endpoints
router.get('/global-rules', globalRulesController.getRules);
router.post('/global-rules', globalRulesController.createRule);
router.put('/global-rules/:id', globalRulesController.updateRule);
router.delete('/global-rules/:id', globalRulesController.deleteRule);

// Interactive Pay Register Grid endpoint
router.get('/interactive-register', async (req, res) => {
    try {
        const { month, year } = req.query;
        const now = new Date();
        const registerData = await payrollService.getInteractiveRegister(
            req.company_id,
            parseInt(month) || (now.getMonth() + 1),
            parseInt(year) || now.getFullYear()
        );
        res.json(registerData);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

router.get('/summary', payrollController.getSummary);

router.post('/process', async (req, res) => {
    try {
        const { month, year, approvedLoanIds } = req.body;
        const now = new Date();
        const results = await payrollService.processCompanyPayroll(
            req.company_id,
            month || (now.getMonth() + 1),
            year || now.getFullYear(),
            req.user.id,
            approvedLoanIds
        );
        res.json({ message: `Payroll processed for ${results.length} employees`, results });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Update a specific payroll record
router.put('/:id', async (req, res) => {
    try {
        await payrollService.updatePayroll(req.params.id, req.company_id, req.body);
        res.json({ message: 'Payroll record updated successfully' });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

router.get('/statements', async (req, res) => {
    try {
        const { month, year } = req.query;
        const now = new Date();
        const statements = await payrollService.getStatements(
            req.company_id,
            month || (now.getMonth() + 1),
            year || now.getFullYear()
        );
        res.json(statements);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

router.post('/salary-structure/:empId', async (req, res) => {
    try {
        const { base_salary, allowances, deductions } = req.body;
        await payrollService.updateStructure(req.params.empId, req.company_id, {
            base_salary, allowances, deductions
        });
        res.json({ message: 'Salary structure updated successfully' });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

router.get('/salary-structure/:empId', async (req, res) => {
    try {
        const payrollRepository = require('../repositories/payrollRepository');
        const salary = await payrollRepository.getSalaryStructure(req.params.empId, req.company_id);
        res.json(salary || {});
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Salary Structure Revisions (Payroll Inputs) Endpoints
router.get('/salary-history/:empId', async (req, res) => {
    try {
        const db = require('../config/db');
        const history = await db('salary_structures')
            .where({ employee_id: req.params.empId, company_id: req.company_id })
            .orderBy('effective_from', 'desc')
            .orderBy('created_at', 'desc');
        res.json(history);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

router.post('/salary-revision', async (req, res) => {
    try {
        const db = require('../config/db');
        const { payout_month } = req.body;

        let pMonth, pYear;
        if (payout_month) {
            const parts = payout_month.split(' ');
            if (parts.length === 2) {
                const monthNames = { Jan: 1, Feb: 2, Mar: 3, Apr: 4, May: 5, Jun: 6, Jul: 7, Aug: 8, Sep: 9, Oct: 10, Nov: 11, Dec: 12, January: 1, February: 2, March: 3, April: 4, May: 5, June: 6, July: 7, August: 8, September: 9, October: 10, November: 11, December: 12 };
                pMonth = monthNames[parts[0]];
                pYear = parseInt(parts[1]);
            }
        }
        if (!pMonth || isNaN(pYear)) {
            const now = new Date();
            pMonth = now.getMonth() + 1;
            pYear = now.getFullYear();
        }
        const controls = await payrollService.getPayrollControls(req.company_id || req.user.company_id, pMonth, pYear);
        if (controls && controls.inputs_locked) {
            return res.status(400).json({ message: `Payroll inputs are locked for ${payout_month || (pMonth + '/' + pYear)}.` });
        }
        const {
            employee_id,
            effective_from,
            remarks,
            notes,
            gross_salary,
            basic,
            hra,
            special_allowance,
            medical_allowance,
            employer_pf,
            employer_esic,
            employee_pf,
            employee_esic,
            net_take_home,
            monthly_ctc,
            annual_ctc
        } = req.body;

        const gross = parseFloat(gross_salary) || 0;

        const finalBasic = basic !== undefined && basic !== null ? parseFloat(basic) : gross * 0.60;
        const finalHra = hra !== undefined && hra !== null ? parseFloat(hra) : gross * 0.40;
        const finalSpecial = special_allowance !== undefined && special_allowance !== null ? parseFloat(special_allowance) : 0;
        const finalMedical = medical_allowance !== undefined && medical_allowance !== null ? parseFloat(medical_allowance) : 0;

        const emp = await db('employees').where({ id: employee_id }).first();
        const globalRules = await db('global_payroll_rules').where({ company_id: req.user.company_id || req.company_id, is_active: true });
        
        const pfRule = globalRules.find(r => r.rule_name.toLowerCase().includes('pf') || r.rule_name.toLowerCase().includes('provident'));
        const esiRule = globalRules.find(r => r.rule_name.toLowerCase().includes('esic') || r.rule_name.toLowerCase().includes('esi') || r.rule_name.toLowerCase().includes('insurance'));

        const getShareAmount = (rule, isEmployer, basic, gross) => {
            if (!rule) return 0;
            const rate = isEmployer ? parseFloat(rule.employer_percentage) : parseFloat(rule.employee_percentage);
            if (rule.base_on === 'flat_amount') {
                return rate;
            }
            const base = rule.base_on === 'gross_salary' ? gross : basic;
            return parseFloat((base * (rate / 100)).toFixed(2));
        };

        const isRuleApplicableLocal = (emp, rule, defaultCol) => {
            if (!emp) return true;
            if (emp.applicable_statutory_rules) {
                try {
                    const ruleIds = typeof emp.applicable_statutory_rules === 'string'
                        ? JSON.parse(emp.applicable_statutory_rules)
                        : emp.applicable_statutory_rules;
                    if (Array.isArray(ruleIds)) {
                        return ruleIds.includes(rule.id);
                    }
                } catch (e) {}
            }
            return emp[defaultCol] !== undefined ? !!emp[defaultCol] : true;
        };

        const isPfApp = pfRule ? isRuleApplicableLocal(emp, pfRule, 'include_pf') : true;
        const isEsiApp = esiRule ? isRuleApplicableLocal(emp, esiRule, 'include_esi') : true;

        const defaultEePf = isPfApp ? getShareAmount(pfRule, false, finalBasic, gross) : 0;
        const defaultErPf = isPfApp ? getShareAmount(pfRule, true, finalBasic, gross) : 0;
        let defaultEeEsic = isEsiApp ? getShareAmount(esiRule, false, finalBasic, gross) : 0;
        let defaultErEsic = isEsiApp ? getShareAmount(esiRule, true, finalBasic, gross) : 0;
        if (gross > 35000) {
            defaultEeEsic = 0;
            defaultErEsic = 0;
        }

        const finalEmployeePf = (employee_pf !== undefined && employee_pf !== null) ? parseFloat(employee_pf) : defaultEePf;
        const finalEmployeeEsic = (employee_esic !== undefined && employee_esic !== null) ? parseFloat(employee_esic) : defaultEeEsic;
        const finalEmployerPf = (employer_pf !== undefined && employer_pf !== null) ? parseFloat(employer_pf) : defaultErPf;
        const finalEmployerEsic = (employer_esic !== undefined && employer_esic !== null) ? parseFloat(employer_esic) : defaultErEsic;

        const finalNetTakeHome = net_take_home !== undefined && net_take_home !== null ? parseFloat(net_take_home) : gross - finalEmployeePf - finalEmployeeEsic;
        const finalMonthlyCtc = monthly_ctc !== undefined && monthly_ctc !== null ? parseFloat(monthly_ctc) : gross + finalEmployerPf + finalEmployerEsic;
        const finalAnnualCtc = annual_ctc !== undefined && annual_ctc !== null ? parseFloat(annual_ctc) : finalMonthlyCtc * 12;

        const allowances = [
            { name: 'HRA', amount: finalHra },
            { name: 'Special Allowance', amount: finalSpecial },
            { name: 'Medical Allowance', amount: finalMedical }
        ];

        const deductions = [
            { name: 'PF', amount: finalEmployeePf },
            { name: 'ESIC', amount: finalEmployeeEsic }
        ];

        const payload = {
            employee_id: parseInt(employee_id),
            company_id: req.company_id,
            base_salary: finalBasic,
            allowances: JSON.stringify(allowances),
            deductions: JSON.stringify(deductions),
            effective_from,
            payout_month,
            remarks,
            notes,
            gross_salary: gross,
            basic: finalBasic,
            hra: finalHra,
            special_allowance: finalSpecial,
            medical_allowance: finalMedical,
            employer_pf: finalEmployerPf,
            employer_esic: finalEmployerEsic,
            employee_pf: finalEmployeePf,
            employee_esic: finalEmployeeEsic,
            net_take_home: finalNetTakeHome,
            monthly_ctc: finalMonthlyCtc,
            annual_ctc: finalAnnualCtc,
            created_at: db.fn.now(),
            updated_at: db.fn.now()
        };

        const [id] = await db('salary_structures').insert(payload);
        res.json({ message: 'Salary structure revision saved successfully', id });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

router.put('/salary-revision/:id', async (req, res) => {
    try {
        const db = require('../config/db');
        const { payout_month } = req.body;

        let pMonth, pYear;
        if (payout_month) {
            const parts = payout_month.split(' ');
            if (parts.length === 2) {
                const monthNames = { Jan: 1, Feb: 2, Mar: 3, Apr: 4, May: 5, Jun: 6, Jul: 7, Aug: 8, Sep: 9, Oct: 10, Nov: 11, Dec: 12, January: 1, February: 2, March: 3, April: 4, May: 5, June: 6, July: 7, August: 8, September: 9, October: 10, November: 11, December: 12 };
                pMonth = monthNames[parts[0]];
                pYear = parseInt(parts[1]);
            }
        }
        if (!pMonth || isNaN(pYear)) {
            const now = new Date();
            pMonth = now.getMonth() + 1;
            pYear = now.getFullYear();
        }
        const controls = await payrollService.getPayrollControls(req.company_id || req.user.company_id, pMonth, pYear);
        if (controls && controls.inputs_locked) {
            return res.status(400).json({ message: `Payroll inputs are locked for ${payout_month || (pMonth + '/' + pYear)}.` });
        }
        const {
            effective_from,
            remarks,
            notes,
            gross_salary,
            basic,
            hra,
            special_allowance,
            medical_allowance,
            employer_pf,
            employer_esic,
            employee_pf,
            employee_esic,
            net_take_home,
            monthly_ctc,
            annual_ctc
        } = req.body;

        const gross = parseFloat(gross_salary) || 0;

        const finalBasic = basic !== undefined && basic !== null ? parseFloat(basic) : gross * 0.60;
        const finalHra = hra !== undefined && hra !== null ? parseFloat(hra) : gross * 0.40;
        const finalSpecial = special_allowance !== undefined && special_allowance !== null ? parseFloat(special_allowance) : 0;
        const finalMedical = medical_allowance !== undefined && medical_allowance !== null ? parseFloat(medical_allowance) : 0;

        const revision = await db('salary_structures').where({ id: req.params.id }).first();
        const emp = revision ? await db('employees').where({ id: revision.employee_id }).first() : null;
        
        const globalRules = await db('global_payroll_rules').where({ company_id: req.user.company_id || (emp ? emp.company_id : 2), is_active: true });
        
        const pfRule = globalRules.find(r => r.rule_name.toLowerCase().includes('pf') || r.rule_name.toLowerCase().includes('provident'));
        const esiRule = globalRules.find(r => r.rule_name.toLowerCase().includes('esic') || r.rule_name.toLowerCase().includes('esi') || r.rule_name.toLowerCase().includes('insurance'));

        const getShareAmount = (rule, isEmployer, basic, gross) => {
            if (!rule) return 0;
            const rate = isEmployer ? parseFloat(rule.employer_percentage) : parseFloat(rule.employee_percentage);
            if (rule.base_on === 'flat_amount') {
                return rate;
            }
            const base = rule.base_on === 'gross_salary' ? gross : basic;
            return parseFloat((base * (rate / 100)).toFixed(2));
        };

        const isRuleApplicableLocal = (emp, rule, defaultCol) => {
            if (!emp) return true;
            if (emp.applicable_statutory_rules) {
                try {
                    const ruleIds = typeof emp.applicable_statutory_rules === 'string'
                        ? JSON.parse(emp.applicable_statutory_rules)
                        : emp.applicable_statutory_rules;
                    if (Array.isArray(ruleIds)) {
                        return ruleIds.includes(rule.id);
                    }
                } catch (e) {}
            }
            return emp[defaultCol] !== undefined ? !!emp[defaultCol] : true;
        };

        const isPfApp = pfRule ? isRuleApplicableLocal(emp, pfRule, 'include_pf') : true;
        const isEsiApp = esiRule ? isRuleApplicableLocal(emp, esiRule, 'include_esi') : true;

        const defaultEePf = isPfApp ? getShareAmount(pfRule, false, finalBasic, gross) : 0;
        const defaultErPf = isPfApp ? getShareAmount(pfRule, true, finalBasic, gross) : 0;
        const defaultEeEsic = isEsiApp ? getShareAmount(esiRule, false, finalBasic, gross) : 0;
        const defaultErEsic = isEsiApp ? getShareAmount(esiRule, true, finalBasic, gross) : 0;

        const finalEmployeePf = (employee_pf !== undefined && employee_pf !== null) ? parseFloat(employee_pf) : defaultEePf;
        const finalEmployeeEsic = (employee_esic !== undefined && employee_esic !== null) ? parseFloat(employee_esic) : defaultEeEsic;
        const finalEmployerPf = (employer_pf !== undefined && employer_pf !== null) ? parseFloat(employer_pf) : defaultErPf;
        const finalEmployerEsic = (employer_esic !== undefined && employer_esic !== null) ? parseFloat(employer_esic) : defaultErEsic;

        const finalNetTakeHome = net_take_home !== undefined && net_take_home !== null ? parseFloat(net_take_home) : gross - finalEmployeePf - finalEmployeeEsic;
        const finalMonthlyCtc = monthly_ctc !== undefined && monthly_ctc !== null ? parseFloat(monthly_ctc) : gross + finalEmployerPf + finalEmployerEsic;
        const finalAnnualCtc = annual_ctc !== undefined && annual_ctc !== null ? parseFloat(annual_ctc) : finalMonthlyCtc * 12;

        const allowances = [
            { name: 'HRA', amount: finalHra },
            { name: 'Special Allowance', amount: finalSpecial },
            { name: 'Medical Allowance', amount: finalMedical }
        ];

        const deductions = [
            { name: 'PF', amount: finalEmployeePf },
            { name: 'ESIC', amount: finalEmployeeEsic }
        ];

        const payload = {
            base_salary: finalBasic,
            allowances: JSON.stringify(allowances),
            deductions: JSON.stringify(deductions),
            effective_from,
            payout_month,
            remarks,
            notes,
            gross_salary: gross,
            basic: finalBasic,
            hra: finalHra,
            special_allowance: finalSpecial,
            medical_allowance: finalMedical,
            employer_pf: finalEmployerPf,
            employer_esic: finalEmployerEsic,
            employee_pf: finalEmployeePf,
            employee_esic: finalEmployeeEsic,
            net_take_home: finalNetTakeHome,
            monthly_ctc: finalMonthlyCtc,
            annual_ctc: finalAnnualCtc,
            updated_at: db.fn.now()
        };

        await db('salary_structures')
            .where({ id: req.params.id, company_id: req.company_id })
            .update(payload);

        res.json({ message: 'Salary structure revision updated successfully' });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

router.get('/download-slip/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const db = require('../config/db');
        const payroll = await db('payrolls').where({ id }).first();
        if (!payroll) {
            return res.status(404).json({ message: 'Payroll record not found' });
        }

        // If the requester is an employee, verify if employee view has been released
        if (req.user.role_name === 'employee') {
            const controls = await payrollService.getPayrollControls(req.company_id || req.user.company_id, payroll.month, payroll.year);
            if (controls && !controls.employee_view_released) {
                return res.status(403).json({ message: 'Payslip view is not released yet by the administrator.' });
            }
        }

        const pdfDoc = await payrollService.generatePayslipPDF(id, req.company_id || req.user.company_id);

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=payslip-${id}.pdf`);

        pdfDoc.pipe(res);
        pdfDoc.end();
    } catch (err) {
        res.status(404).json({ message: err.message });
    }
});

router.post('/bonus-adjustment', payrollController.saveBonusAdjustment);
router.post('/deduction-adjustment', payrollController.saveDeductionAdjustment);

// Employee Loans & Advances
router.get('/loans/download-slip/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const db = require('../config/db');
        const loan = await db('loans').where({ id }).first();
        if (!loan) {
            return res.status(404).json({ message: 'Loan record not found' });
        }

        // If the requester is an employee, verify if they own the loan
        if (req.user.role_name === 'employee') {
            if (loan.employee_id !== req.user.employee_id) {
                return res.status(403).json({ message: 'Access denied: You can only view your own loan slips.' });
            }
        }

        const pdfDoc = await payrollService.generateLoanSlipPDF(id, req.company_id || req.user.company_id);

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=loan-slip-${id}.pdf`);

        pdfDoc.pipe(res);
        pdfDoc.end();
    } catch (err) {
        res.status(404).json({ message: err.message });
    }
});

router.get('/loans', payrollController.getLoans);
router.post('/loans', payrollController.createLoan);
router.put('/loans/:id', payrollController.updateLoan);
router.delete('/loans/:id', payrollController.deleteLoan);
router.post('/loans/:id/status', payrollController.updateLoanStatus);
router.get('/loans/preview-deductions', payrollController.previewLoanDeductions);
router.get('/loans/repayments', payrollController.getRepayments);
router.post('/loans/:id/repay', payrollController.recordRepayment);

// Bulk Payslip Email Dispatcher
router.post('/bulk-email-payslips', payrollController.sendBulkEmailPayslips);

// Statutory EPF/ESIC Payroll Exports
router.get('/export-epf-ecr', payrollController.exportEPFECR);
router.get('/export-esic-ecr', payrollController.exportESICCSV);

// Employee Separation & FNF Settlement routes
router.get('/separations', payrollController.getSeparations);
router.post('/separations', payrollController.createSeparation);
router.get('/separations/calculate/:empId', payrollController.calculateFNF);
router.post('/separations/settle/:id', payrollController.settleSeparation);
router.delete('/separations/:id', payrollController.deleteSeparation);

// Payroll Controls (4-State Panel)
router.get('/controls', async (req, res) => {
    try {
        const { month, year } = req.query;
        const now = new Date();
        const cid = req.company_id || req.user.company_id;
        const result = await payrollService.getPayrollControls(
            cid,
            parseInt(month) || (now.getMonth() + 1),
            parseInt(year) || now.getFullYear()
        );
        res.json(result);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

router.post('/controls', async (req, res) => {
    try {
        const { month, year, inputs_locked, employee_view_released, it_statement_released, payroll_locked } = req.body;
        const now = new Date();
        const cid = req.company_id || req.user.company_id;
        const result = await payrollService.updatePayrollControls(
            cid,
            parseInt(month) || (now.getMonth() + 1),
            parseInt(year) || now.getFullYear(),
            { inputs_locked, employee_view_released, it_statement_released, payroll_locked }
        );
        res.json(result);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

router.get('/client-controls', async (req, res) => {
    try {
        const { month, year } = req.query;
        const now = new Date();
        const cid = req.company_id || req.user.company_id;
        const result = await payrollService.getPayrollControls(
            cid,
            parseInt(month) || (now.getMonth() + 1),
            parseInt(year) || now.getFullYear()
        );
        res.json({
            employee_view_released: result.employee_view_released,
            it_statement_released: result.it_statement_released
        });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

module.exports = router;
