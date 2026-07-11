const db = require('./backend/src/config/db');

async function findEmployeeMismatch() {
    try {
        console.log("=== SCANNING FOR REAL LOAN MISMATCHES FOR JUNE 2026 ===");
        console.log("Criteria: Payroll EMI != (Repayments linked to June Payroll + Manual Repayments in June 2026)\n");
        
        // Get all employees for company 27
        const employees = await db('employees')
            .where({ company_id: 27 })
            .select('id', 'first_name', 'last_name', 'employee_id_number');

        let foundAnyMismatch = false;

        for (const emp of employees) {
            const empName = `${emp.first_name || ''} ${emp.last_name || ''}`.trim();

            // 1. Get June 2026 payroll record
            const payroll = await db('payrolls')
                .where({ employee_id: emp.id, month: 6, year: 2026 })
                .select('id', 'loan_emi_deduction')
                .first();

            const payrollEmi = parseFloat(payroll?.loan_emi_deduction || 0);

            // 2. Get repayments linked to this June 2026 payroll ID
            let payrollRepaymentsSum = 0;
            if (payroll) {
                const rep = await db('loan_repayments')
                    .where({ payroll_id: payroll.id })
                    .sum('amount_paid as total')
                    .first();
                payrollRepaymentsSum = parseFloat(rep?.total || 0);
            }

            // 3. Get manual repayments dated in June 2026 (payroll_id is null/empty)
            const manualRep = await db('loan_repayments')
                .join('loans', 'loan_repayments.loan_id', '=', 'loans.id')
                .where('loans.employee_id', emp.id)
                .whereNull('loan_repayments.payroll_id')
                .whereRaw('MONTH(loan_repayments.payment_date) = 6 AND YEAR(loan_repayments.payment_date) = 2026')
                .sum('loan_repayments.amount_paid as total')
                .first();
            const manualRepaymentsSum = parseFloat(manualRep?.total || 0);

            const totalRepaymentsForJuneCalculation = payrollRepaymentsSum + manualRepaymentsSum;

            // 4. Compare. If they don't match, print details!
            if (payrollEmi !== totalRepaymentsForJuneCalculation) {
                foundAnyMismatch = true;
                console.log(`=============================================================`);
                console.log(`MISMATCH FOUND: ${empName} (ID: ${emp.employee_id_number || emp.id})`);
                console.log(`=============================================================`);
                console.log(`  - Payroll EMI (Deducted in June Register):  ₹${payrollEmi}`);
                console.log(`  - June Payroll Repayments (Linked by ID):   ₹${payrollRepaymentsSum}`);
                console.log(`  - June Manual Repayments (Dated in June):  ₹${manualRepaymentsSum}`);
                console.log(`  - Total Repayments Registered for June:     ₹${totalRepaymentsForJuneCalculation}`);
                console.log(`  - Difference:                              ₹${payrollEmi - totalRepaymentsForJuneCalculation}`);

                // Fetch and display active/completed loans
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

                // Fetch and display repayments
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
            console.log("\nNo mismatch found! All employees have matching Payroll EMI and Repayments for June 2026.");
        }

        process.exit(0);
    } catch (e) {
        console.error("Error running mismatch check:", e);
        process.exit(1);
    }
}

findEmployeeMismatch();
