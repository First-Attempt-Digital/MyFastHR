const db = require('../config/db');

async function migrate() {
    console.log('Starting migration: Adding onboarding fields to employees table...');
    try {
        const tableExists = await db.schema.hasTable('employees');
        if (!tableExists) {
            console.error('Employees table does not exist. Please run schema.sql first.');
            process.exit(1);
        }

        await db.schema.alterTable('employees', (table) => {
            // Identity & Personal
            table.string('aadhaar_number', 20).nullable();
            table.string('pan_number', 20).nullable();
            table.string('father_name', 100).nullable();
            table.string('mother_name', 100).nullable();
            table.string('spouse_name', 100).nullable();
            
            // Contact & Emergency
            table.string('emergency_contact_name', 100).nullable();
            table.string('emergency_contact_number', 20).nullable();
            
            // Employment Details
            table.date('confirmation_date').nullable();
            table.string('probation_period', 50).nullable();
            table.string('referred_by', 100).nullable();
            table.string('shift', 50).nullable();
            
            // Statutory
            table.boolean('include_pf').defaultTo(false);
            table.string('pf_number', 50).nullable();
            table.boolean('include_esi').defaultTo(false);
            table.string('esi_number', 50).nullable();
            table.boolean('include_lwf').defaultTo(false);
            
            // Banking & Payment
            table.string('payment_type', 50).nullable();
            table.string('bank_name', 100).nullable();
            table.string('bank_branch', 100).nullable();
            table.string('account_number', 50).nullable();
            table.string('ifsc_code', 20).nullable();
            table.string('dd_payable_at', 100).nullable();
        });

        console.log('Migration successful: All onboarding fields added.');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err.message);
        process.exit(1);
    }
}

migrate();
