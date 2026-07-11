const db = require('./backend/src/config/db');

async function findEmployeeMismatch() {
    try {
        console.log("=== COMPARING LOAN EMI DEDUCTION VS REPAYMENTS BY EMPLOYEE (JUNE 2026) ===");
        
        // 1. Get all employees for company 27
        const employees = await db('employees')
            .where({ company_id: 27 })
            .select('id', 'first_name', 'last_name', 'employee_id_number');

        let foundAnyMismatch = false;

        for (const emp of employees) {
            const empName = `${emp.first_name || ''} ${emp.last_name || ''}`.trim();

            // Fetch the June 2026 payroll record for this employee
            const payroll = await db('payrolls')
                .where({ employee_id: emp.id, month: 6, year: 2026 })
                .select('loan_emi_deduction')
                .first();

            // Fetch all repayments logged for this employee's loans in June 2026
            const repayment = await db('loan_repayments')
                .join('loans', 'loan_repayments.loan_id', '=', 'loans.id')
                .where('loans.employee_id', emp.id)
                .whereRaw('MONTH(loan_repayments.payment_date) = 6 AND YEAR(loan_repayments.payment_date) = 2026')
                .sum('loan_repayments.amount_paid as total_repaid')
                .first();

            // Also check repayments specifically tied to this June 2026 payroll ID (in case date is different)
            let payrollRepayment = { total_repaid_payroll: 0 };
            if (payroll) {
                // Find if any repayment is linked to this specific payroll record
                const linkedPayroll = await db('payrolls')
                    .where({ employee_id: emp.id, month: 6, year: 2026 })
                    .first();
                if (linkedPayroll) {
                    payrollRepayment = await db('loan_repayments')
                        .where({ payroll_id: linkedPayroll.id })
                        .sum('amount_paid as total_repaid_payroll')
                        .first();
                }
            }

            const payrollEmi = parseFloat(payroll?.loan_emi_deduction || 0);
            const repaymentDateSum = parseFloat(repayment?.total_repaid || 0);
            const repaymentPayrollSum = parseFloat(payrollRepayment?.total_repaid_payroll || 0);

            // If there's any mismatch between what was deducted in payroll vs what was logged as repayments
            if (payrollEmi !== repaymentDateSum || payrollEmi !== repaymentPayrollSum) {
                foundAnyMismatch = true;
                console.log(`\nEmployee: ${empName} (ID: ${emp.employee_id_number || emp.id})`);
                console.log(`  - Payroll EMI (Deducted in June Sheet): ₹${payrollEmi}`);
                console.log(`  - Repayments logged in June (by Date):  ₹${repaymentDateSum}`);
                console.log(`  - Repayments linked to June Payroll:    ₹${repaymentPayrollSum}`);
                console.log(`  - Difference (Payroll EMI - Repayment Date Sum): ₹${payrollEmi - repaymentDateSum}`);
            }
        }

        if (!foundAnyMismatch) {
            console.log("\nNo mismatch found in local database for company 27. (Ensure you run this on VPS database)");
        }

        process.exit(0);
    } catch (e) {
        console.error("Error running mismatch check:", e);
        process.exit(1);
    }
}

findEmployeeMismatch();
