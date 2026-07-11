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
                .select('id', 'loan_emi_deduction')
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
                payrollRepayment = await db('loan_repayments')
                    .where({ payroll_id: payroll.id })
                    .sum('amount_paid as total_repaid_payroll')
                    .first();
            }

            const payrollEmi = parseFloat(payroll?.loan_emi_deduction || 0);
            const repaymentDateSum = parseFloat(repayment?.total_repaid || 0);
            const repaymentPayrollSum = parseFloat(payrollRepayment?.total_repaid_payroll || 0);

            // If there's any mismatch between what was deducted in payroll vs what was logged as repayments
            if (payrollEmi !== repaymentDateSum || payrollEmi !== repaymentPayrollSum) {
                foundAnyMismatch = true;
                console.log(`\n=============================================================`);
                console.log(`EMPLOYEE MISMATCH FOUND: ${empName} (ID: ${emp.employee_id_number || emp.id})`);
                console.log(`=============================================================`);
                console.log(`  - Payroll EMI (Deducted in June Sheet):  ₹${payrollEmi}`);
                console.log(`  - Repayments logged in June (by Date):   ₹${repaymentDateSum}`);
                console.log(`  - Repayments linked to June Payroll ID:  ₹${repaymentPayrollSum}`);
                console.log(`  - Difference:                           ₹${payrollEmi - repaymentDateSum}`);

                // --- 1. DISPLAY ALL LOANS OF THIS EMPLOYEE ---
                console.log(`\n  --- Loans Ledger for ${empName} ---`);
                const loans = await db('loans')
                    .where({ employee_id: emp.id })
                    .select('id', 'title', 'amount', 'monthly_emi', 'remaining_balance', 'status', 'created_at');
                console.table(loans.map(l => ({
                    'Loan ID': l.id,
                    'Title': l.title,
                    'Principal Amount': `₹${l.amount}`,
                    'EMI Amount': `₹${l.monthly_emi}`,
                    'Remaining Bal': `₹${l.remaining_balance}`,
                    'Status': l.status,
                    'Created Date': l.created_at
                })));

                // --- 2. DISPLAY ALL REPAYMENTS OF THIS EMPLOYEE ---
                console.log(`\n  --- Repayments Log for ${empName} ---`);
                const repaymentsList = await db('loan_repayments')
                    .join('loans', 'loan_repayments.loan_id', '=', 'loans.id')
                    .where('loans.employee_id', emp.id)
                    .select('loan_repayments.id', 'loan_repayments.loan_id', 'loan_repayments.amount_paid', 'loan_repayments.payment_method', 'loan_repayments.payment_date', 'loan_repayments.payroll_id', 'loan_repayments.notes')
                    .orderBy('loan_repayments.payment_date', 'desc');

                console.table(repaymentsList.map(r => ({
                    'Repay ID': r.id,
                    'Loan ID': r.loan_id,
                    'Amount Paid': `₹${r.amount_paid}`,
                    'Method': r.payment_method,
                    'Date': r.payment_date,
                    'Payroll ID Ref': r.payroll_id || 'N/A (Manual)',
                    'Notes': r.notes
                })));
            }
        }

        if (!foundAnyMismatch) {
            console.log("\nNo mismatch found in database for company 27.");
        }

        process.exit(0);
    } catch (e) {
        console.error("Error running mismatch check:", e);
        process.exit(1);
    }
}

findEmployeeMismatch();
