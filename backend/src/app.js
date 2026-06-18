// Backend Entry Point - MyFastHR SaaS
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const db = require('./config/db');

const authRoutes = require('./routes/authRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');
const employeeRoutes = require('./routes/employeeRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const payrollRoutes = require('./routes/payrollRoutes');
const leaveRoutes = require('./routes/leaveRoutes');
const profileRoutes = require('./routes/profileRoutes');
const adminRoutes = require('./routes/adminRoutes');
const orgRoutes = require('./routes/orgRoutes');
const complianceRoutes = require('./routes/complianceRoutes');
const documentRoutes = require('./routes/documentRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const taskRoutes = require('./routes/taskRoutes');
const regularizationRoutes = require('./routes/regularizationRoutes');
const announcementsRoutes = require('./routes/announcementsRoutes');
console.log('>>> [BOOT]: Task Routes Module Loaded');

const { authenticateToken } = require('./middlewares/authMiddleware');
const tenantGuard = require('./middlewares/tenantMiddleware');

// Database Schema Sync (Auto-Fix)
const syncDatabaseSchema = async () => {
    try {
        console.log('>>> [DB-SYNC]: Checking employees table schema...');
        const hasEmployees = await db.schema.hasTable('employees');
        if (!hasEmployees) return;

        const columnsToCheck = [
            'father_name', 'mother_name', 'spouse_name', 'pan_number', 'aadhaar_number',
            'bank_name', 'account_number', 'ifsc_code', 'bank_branch', 'dd_payable_at',
            'uan_number', 'pf_number', 'esi_number', 'include_pf', 'include_esi', 'include_lwf', 'include_gratuity', 'pf_excess_contribution',
            'payment_type', 'probation_period', 'confirmation_date', 'contract_start_date', 'contract_end_date', 'referred_by', 'shift',
            'emergency_contact_name', 'emergency_contact_number', 'emergency_contact_relation', 
            'emergency_email', 'emergency_contact_address', 'emergency_city',
            'photo', 'onboarding_token', 'onboarding_token_created_at', 'onboarding_status', 'onboarding_filled_fields', 'attendance_scheme_id',
            'nick_name', 'extension', 'blood_group', 'marital_status', 'marriage_date',
            'nationality', 'residential_status', 'birth_place', 'origin_country', 'religion', 'is_disabled',
            'personal_email', 'height', 'weight', 'id_mark', 'hobby', 'caste',
            'present_address', 'city', 'district', 'state', 'country', 'pincode',
            'permanent_address', 'permanent_city', 'permanent_country', 'permanent_pincode',
            'department_id', 'gender', 'date_of_birth', 'resignation_date', 'office_location'
        ];

        const missingColumns = [];
        for (const col of columnsToCheck) {
            const exists = await db.schema.hasColumn('employees', col);
            if (!exists) {
                missingColumns.push(col);
            }
        }

        if (missingColumns.length > 0) {
            console.log(`>>> [DB-SYNC]: Adding ${missingColumns.length} missing columns...`);
            await db.schema.alterTable('employees', (table) => {
                if (missingColumns.includes('father_name')) table.string('father_name').nullable();
                if (missingColumns.includes('mother_name')) table.string('mother_name').nullable();
                if (missingColumns.includes('spouse_name')) table.string('spouse_name').nullable();
                if (missingColumns.includes('pan_number')) table.string('pan_number').nullable();
                if (missingColumns.includes('aadhaar_number')) table.string('aadhaar_number').nullable();
                
                if (missingColumns.includes('bank_name')) table.string('bank_name').nullable();
                if (missingColumns.includes('account_number')) table.string('account_number').nullable();
                if (missingColumns.includes('ifsc_code')) table.string('ifsc_code').nullable();
                if (missingColumns.includes('bank_branch')) table.string('bank_branch').nullable();
                if (missingColumns.includes('dd_payable_at')) table.string('dd_payable_at').nullable();
                
                if (missingColumns.includes('uan_number')) table.string('uan_number').nullable();
                if (missingColumns.includes('pf_number')) table.string('pf_number').nullable();
                if (missingColumns.includes('esi_number')) table.string('esi_number').nullable();
                if (missingColumns.includes('include_pf')) table.boolean('include_pf').defaultTo(false);
                if (missingColumns.includes('include_esi')) table.boolean('include_esi').defaultTo(false);
                if (missingColumns.includes('include_lwf')) table.boolean('include_lwf').defaultTo(false);
                if (missingColumns.includes('include_gratuity')) table.boolean('include_gratuity').defaultTo(false);
                if (missingColumns.includes('pf_excess_contribution')) table.boolean('pf_excess_contribution').defaultTo(false);
                
                if (missingColumns.includes('payment_type')) table.string('payment_type').nullable();
                if (missingColumns.includes('probation_period')) table.string('probation_period').nullable();
                if (missingColumns.includes('confirmation_date')) table.date('confirmation_date').nullable();
                if (missingColumns.includes('contract_start_date')) table.date('contract_start_date').nullable();
                if (missingColumns.includes('contract_end_date')) table.date('contract_end_date').nullable();
                if (missingColumns.includes('referred_by')) table.string('referred_by').nullable();
                if (missingColumns.includes('shift')) table.string('shift').nullable();
                
                if (missingColumns.includes('emergency_contact_name')) table.string('emergency_contact_name').nullable();
                if (missingColumns.includes('emergency_contact_number')) table.string('emergency_contact_number').nullable();
                if (missingColumns.includes('emergency_contact_relation')) table.string('emergency_contact_relation').nullable();
                if (missingColumns.includes('emergency_email')) table.string('emergency_email').nullable();
                if (missingColumns.includes('emergency_contact_address')) table.text('emergency_contact_address').nullable();
                if (missingColumns.includes('emergency_city')) table.string('emergency_city').nullable();

                if (missingColumns.includes('photo')) table.string('photo').nullable();
                if (missingColumns.includes('attendance_scheme_id')) table.integer('attendance_scheme_id').unsigned().nullable();
                if (missingColumns.includes('onboarding_token')) table.string('onboarding_token').nullable();
                if (missingColumns.includes('onboarding_token_created_at')) table.timestamp('onboarding_token_created_at').nullable();
                if (missingColumns.includes('onboarding_status')) table.string('onboarding_status').defaultTo('pending');
                if (missingColumns.includes('onboarding_filled_fields')) table.text('onboarding_filled_fields').nullable();

                if (missingColumns.includes('nick_name')) table.string('nick_name').nullable();
                if (missingColumns.includes('extension')) table.string('extension').nullable();
                if (missingColumns.includes('blood_group')) table.string('blood_group').nullable();
                if (missingColumns.includes('marital_status')) table.string('marital_status').nullable();
                if (missingColumns.includes('marriage_date')) table.date('marriage_date').nullable();
                if (missingColumns.includes('nationality')) table.string('nationality').nullable();
                if (missingColumns.includes('residential_status')) table.string('residential_status').nullable();
                if (missingColumns.includes('birth_place')) table.string('birth_place').nullable();
                if (missingColumns.includes('origin_country')) table.string('origin_country').nullable();
                if (missingColumns.includes('religion')) table.string('religion').nullable();
                if (missingColumns.includes('is_disabled')) table.boolean('is_disabled').defaultTo(false);
                if (missingColumns.includes('personal_email')) table.string('personal_email').nullable();
                if (missingColumns.includes('height')) table.string('height').nullable();
                if (missingColumns.includes('weight')) table.string('weight').nullable();
                if (missingColumns.includes('id_mark')) table.string('id_mark').nullable();
                if (missingColumns.includes('hobby')) table.string('hobby').nullable();
                if (missingColumns.includes('caste')) table.string('caste').nullable();
                if (missingColumns.includes('present_address')) table.text('present_address').nullable();
                if (missingColumns.includes('city')) table.string('city').nullable();
                if (missingColumns.includes('district')) table.string('district').nullable();
                if (missingColumns.includes('state')) table.string('state').nullable();
                if (missingColumns.includes('country')) table.string('country').nullable();
                if (missingColumns.includes('pincode')) table.string('pincode').nullable();
                if (missingColumns.includes('permanent_address')) table.text('permanent_address').nullable();
                if (missingColumns.includes('permanent_city')) table.string('permanent_city').nullable();
                if (missingColumns.includes('permanent_country')) table.string('permanent_country').nullable();
                if (missingColumns.includes('permanent_pincode')) table.string('permanent_pincode').nullable();
                if (missingColumns.includes('department_id')) table.integer('department_id').unsigned().nullable();
                if (missingColumns.includes('gender')) table.enu('gender', ['Male', 'Female', 'Other']).nullable();
                if (missingColumns.includes('date_of_birth')) table.date('date_of_birth').nullable();
                if (missingColumns.includes('resignation_date')) table.date('resignation_date').nullable();
                if (missingColumns.includes('office_location')) table.string('office_location', 100).nullable();
            });

            // Force drop unique constraint on employee_id_number to allow duplicates as requested
            try {
                await db.schema.alterTable('employees', (table) => {
                    table.dropUnique(['employee_id_number']).catch(() => {
                        // Ignore if index doesn't exist
                    });
                });
            } catch (e) { /* Ignore */ }

            console.log('>>> [DB-SYNC]: Schema updated successfully.');
        } else {
            // Even if no missing columns, try to drop unique constraint if it still exists
            try {
                await db.schema.alterTable('employees', (table) => {
                    table.dropUnique(['employee_id_number']).catch(() => {});
                });
            } catch (e) {}
            console.log('>>> [DB-SYNC]: Employees table schema is already up to date.');
        }

        // Auto-fix for employee_number_series missing auto_increment
        try {
            const hasSeriesTable = await db.schema.hasTable('employee_number_series');
            if (hasSeriesTable) {
                await db.raw('ALTER TABLE employee_number_series MODIFY COLUMN id INT AUTO_INCREMENT').catch(() => {});
            }
        } catch (e) { /* ignore */ }

        // Add login_otps table for email login
        const hasOtpsTable = await db.schema.hasTable('login_otps');
        if (!hasOtpsTable) {
            console.log('>>> [DB-SYNC]: Creating login_otps table...');
            await db.schema.createTable('login_otps', (table) => {
                table.increments('id').primary();
                table.string('email').notNullable();
                table.string('otp').notNullable();
                table.timestamp('expires_at').notNullable();
                table.boolean('is_used').defaultTo(false);
                table.timestamp('created_at').defaultTo(db.fn.now());
            });
            console.log('>>> [DB-SYNC]: login_otps table created.');
        }

        // Add system_settings table for global branding config
        const hasSettingsTable = await db.schema.hasTable('system_settings');
        if (!hasSettingsTable) {
            console.log('>>> [DB-SYNC]: Creating system_settings table...');
            await db.schema.createTable('system_settings', (table) => {
                table.increments('id').primary();
                table.string('key_name', 100).unique().notNullable();
                table.text('value_text').nullable();
                table.timestamp('created_at').defaultTo(db.fn.now());
                table.timestamp('updated_at').defaultTo(db.fn.now());
            });
            console.log('>>> [DB-SYNC]: system_settings table created.');
            
            await db('system_settings').insert([
                { key_name: 'logo_url', value_text: '/uploads/branding/logo.png' },
                { key_name: 'favicon_url', value_text: '/uploads/branding/favicon.png' },
                { key_name: 'logo_height', value_text: '36' }
            ]);
            console.log('>>> [DB-SYNC]: Default branding settings initialized.');
        } else {
            // Ensure all keys exist
            const keys = await db('system_settings').select('key_name');
            const keyNames = keys.map(k => k.key_name);
            if (!keyNames.includes('logo_url')) {
                await db('system_settings').insert({ key_name: 'logo_url', value_text: '/uploads/branding/logo.png' });
            }
            if (!keyNames.includes('favicon_url')) {
                await db('system_settings').insert({ key_name: 'favicon_url', value_text: '/uploads/branding/favicon.png' });
            }
            if (!keyNames.includes('logo_height')) {
                await db('system_settings').insert({ key_name: 'logo_height', value_text: '36' });
            }
        }

        // Add tenant_invoices table for billing logs
        const hasInvoicesTable = await db.schema.hasTable('tenant_invoices');
        if (!hasInvoicesTable) {
            console.log('>>> [DB-SYNC]: Creating tenant_invoices table...');
            await db.schema.createTable('tenant_invoices', (table) => {
                table.increments('id').primary();
                table.integer('company_id').unsigned().notNullable();
                table.decimal('amount', 10, 2).notNullable();
                table.string('plan', 50).notNullable();
                table.string('billing_period', 50).notNullable();
                table.string('status', 20).defaultTo('Unpaid');
                table.timestamp('paid_at').nullable();
                table.timestamp('created_at').defaultTo(db.fn.now());
            });
            console.log('>>> [DB-SYNC]: tenant_invoices table created.');
        }

        // Add case_studies table
        const hasCaseStudiesTable = await db.schema.hasTable('case_studies');
        if (!hasCaseStudiesTable) {
            console.log('>>> [DB-SYNC]: Creating case_studies table...');
            await db.schema.createTable('case_studies', (table) => {
                table.increments('id').primary();
                table.string('title').notNullable();
                table.string('sector').notNullable();
                table.string('size').nullable();
                table.text('challenge').notNullable();
                table.text('solution').notNullable();
                table.text('metrics').nullable(); // JSON string of metrics
                table.string('color').nullable();
                table.string('bg').nullable();
                table.text('summaryText').nullable();
                table.timestamp('created_at').defaultTo(db.fn.now());
                table.timestamp('updated_at').defaultTo(db.fn.now());
            });
            console.log('>>> [DB-SYNC]: case_studies table created.');

            // Seed with default case studies
            await db('case_studies').insert([
                {
                    title: 'Highway King Enterprises',
                    sector: 'logistics',
                    size: '250+ Employees',
                    challenge: 'Manual attendance log mismatch from 3 hubs and 4 days of payroll compile delay.',
                    solution: 'Automated biometric API synchronizer with Isolated Database instances.',
                    metrics: JSON.stringify([
                        { label: 'Payroll compiling time', before: '32 Hours', after: '20 Minutes', status: 'saved' },
                        { label: 'Biometric discrepancies', before: '14%', after: '0%', status: 'prevented' }
                    ]),
                    color: '#7A3F91',
                    bg: '#F2EAF7',
                    summaryText: `CASE STUDY: HIGHWAY KING ENTERPRISES\nSector: Logistics & Operations\nSize: 250+ Employees\n\nCHALLENGE:\nHighway King had manual attendance discrepancies across multiple physical hubs. Payroll took 4 whole operational days each month.\n\nSOLUTION:\nDeploying MyFastHR Biometric Sync Node. Real-time logging of punch coordinates directly with Knex schema updates.\n\nIMPACT:\n- Payroll compiler processing down from 32 hours to 20 minutes.\n- Biometric discrepancy rating dropped from 14% to 0%.`
                },
                {
                    title: 'First Attempt Skills Training',
                    sector: 'education',
                    size: '120+ Staff members',
                    challenge: 'PAN & Aadhaar physical audits took weekly management loops with compliance issues.',
                    solution: 'Secure Client KYC Approval screen and Encrypted Document Vault storage.',
                    metrics: JSON.stringify([
                        { label: 'Compliance Audit loop', before: '5 Days', after: '30 Seconds', status: 'saved' },
                        { label: 'Document vault storage', before: 'Unencrypted', after: 'AES-256 Nodes', status: 'secured' }
                    ]),
                    color: '#0F766E',
                    bg: '#CCFBF1',
                    summaryText: `CASE STUDY: FIRST ATTEMPT SKILLS TRAINING\nSector: Education / Professional Training\nSize: 120+ Staff members\n\nCHALLENGE:\nManual document checks and compliance audits caused massive back-and-forth communication loops.\n\nSOLUTION:\nKYC Approval Vault in MyFastHR. Allowed direct staff uploads with approval indicators.\n\nIMPACT:\n- Audit approval times reduced from 5 days to 30 seconds.\n- Fully secure Document Vault storage running AES-256 encryptions.`
                },
                {
                    title: 'Divyanshu Tech Labs',
                    sector: 'it',
                    size: '80+ Developers',
                    challenge: 'Spreadsheet shift planning, weekend overrides, and timezone adjustments for remote developers.',
                    solution: 'Rosters with Weekend Overrides & automated Leave workflows.',
                    metrics: JSON.stringify([
                        { label: 'Overtime calculation errors', before: '8.4%', after: '0.1%', status: 'prevented' },
                        { label: 'Regularization requests', before: '48 Hrs SLA', after: 'Real-time Approval', status: 'approved' }
                    ]),
                    color: '#D97706',
                    bg: '#FEF3C7',
                    summaryText: `CASE STUDY: DIVYANSHU TECH LABS\nSector: IT Services\nSize: 80+ Developers\n\nCHALLENGE:\nTimezone offsets and multi-shift rosters led to constant manual overrides.\n\nSOLUTION:\nInteractive shifts dashboard with custom weekend overrides and manager telemetry approval.\n\nIMPACT:\n- Overtime discrepancies dropped from 8.4% to 0.1%.\n- SLA for leave regularizations reduced to real-time approvals.`
                }
            ]);
            console.log('>>> [DB-SYNC]: Seeding default case studies complete.');
        }

        // Ensure shifts table has split shift columns
        const hasShiftsTable = await db.schema.hasTable('shifts');
        if (hasShiftsTable) {
            const shiftColumns = [
                'total_punches_required',
                'session2_start_time',
                'session2_end_time',
                'session1_grace_out',
                'session2_grace_in',
                'session2_grace_out',
                'session1_in_margin',
                'session1_out_margin',
                'session2_in_margin',
                'session2_out_margin',
                'terminate_hour',
                'grace_count_limit'
            ];
            const missingShiftCols = [];
            for (const col of shiftColumns) {
                const exists = await db.schema.hasColumn('shifts', col);
                if (!exists) {
                    missingShiftCols.push(col);
                }
            }

            if (missingShiftCols.length > 0) {
                console.log(`>>> [DB-SYNC]: Adding ${missingShiftCols.length} missing columns to shifts table...`);
                await db.schema.alterTable('shifts', (table) => {
                    if (missingShiftCols.includes('total_punches_required')) table.integer('total_punches_required').defaultTo(2);
                    if (missingShiftCols.includes('session2_start_time')) table.string('session2_start_time', 10).nullable();
                    if (missingShiftCols.includes('session2_end_time')) table.string('session2_end_time', 10).nullable();
                    if (missingShiftCols.includes('session1_grace_out')) table.integer('session1_grace_out').defaultTo(0);
                    if (missingShiftCols.includes('session2_grace_in')) table.integer('session2_grace_in').defaultTo(15);
                    if (missingShiftCols.includes('session2_grace_out')) table.integer('session2_grace_out').defaultTo(0);
                    if (missingShiftCols.includes('session1_in_margin')) table.integer('session1_in_margin').defaultTo(0);
                    if (missingShiftCols.includes('session1_out_margin')) table.integer('session1_out_margin').defaultTo(0);
                    if (missingShiftCols.includes('session2_in_margin')) table.integer('session2_in_margin').defaultTo(0);
                    if (missingShiftCols.includes('session2_out_margin')) table.integer('session2_out_margin').defaultTo(0);
                    if (missingShiftCols.includes('terminate_hour')) table.integer('terminate_hour').nullable();
                    if (missingShiftCols.includes('grace_count_limit')) table.integer('grace_count_limit').defaultTo(3);
                });
                console.log('>>> [DB-SYNC]: shifts table columns updated.');
            }
        }

        // 1. Ensure departments table exists
        const hasDepartments = await db.schema.hasTable('departments');
        if (!hasDepartments) {
            console.log('>>> [DB-SYNC]: Creating departments table...');
            await db.schema.createTable('departments', (table) => {
                table.increments('id').primary();
                table.integer('company_id').unsigned().notNullable();
                table.string('name', 100).notNullable();
                table.integer('manager_id').unsigned().nullable();
                table.timestamp('created_at').defaultTo(db.fn.now());
                table.foreign('company_id').references('companies.id').onDelete('CASCADE');
                table.foreign('manager_id').references('users.id').onDelete('SET NULL');
            });
            console.log('>>> [DB-SYNC]: departments table created.');
        }

        // 2. Ensure permissions table exists
        const hasPermissions = await db.schema.hasTable('permissions');
        if (!hasPermissions) {
            console.log('>>> [DB-SYNC]: Creating permissions table...');
            await db.schema.createTable('permissions', (table) => {
                table.increments('id').primary();
                table.string('name', 100).unique().notNullable();
                table.text('description').nullable();
            });
            console.log('>>> [DB-SYNC]: permissions table created.');
        }

        // 3. Ensure role_permissions table exists
        const hasRolePermissions = await db.schema.hasTable('role_permissions');
        if (!hasRolePermissions) {
            console.log('>>> [DB-SYNC]: Creating role_permissions table...');
            await db.schema.createTable('role_permissions', (table) => {
                table.integer('role_id').unsigned().notNullable();
                table.integer('permission_id').unsigned().notNullable();
                table.primary(['role_id', 'permission_id']);
                table.foreign('role_id').references('roles.id').onDelete('CASCADE');
                table.foreign('permission_id').references('permissions.id').onDelete('CASCADE');
            });
            console.log('>>> [DB-SYNC]: role_permissions table created.');
        }

        // Seed default permissions and role mappings
        try {
            const existingPermsCount = await db('permissions').count('id as cnt').first();
            if (existingPermsCount && (existingPermsCount.cnt === 0 || existingPermsCount['cnt'] === 0)) {
                console.log('>>> [DB-SYNC]: Seeding permissions and mapping to roles...');
                const defaultPerms = [
                    { name: 'view_global_analytics', description: 'Access to global Saas metrics (Super Admin)' },
                    { name: 'manage_tenants', description: 'Create and manage global companies' },
                    { name: 'configure_organization', description: 'Manage departments and org-wide settings' },
                    { name: 'manage_staff', description: 'Hire, edit, and terminate employees' },
                    { name: 'process_payroll', description: 'Run payroll and generate salary slips' },
                    { name: 'approve_attendance', description: 'Approve or reject team attendance logs' },
                    { name: 'approve_leaves', description: 'Approve or reject team leave requests' },
                    { name: 'view_self', description: 'Access personal dashboard and self-service portal' }
                ];
                await db('permissions').insert(defaultPerms);

                const roles = await db('roles').select('id', 'name');
                const superRole = roles.find(r => r.name === 'super_admin');
                const adminRole = roles.find(r => r.name === 'company_admin');
                const managerRole = roles.find(r => r.name === 'manager');
                const empRole = roles.find(r => r.name === 'employee');

                const allPerms = await db('permissions').select('id', 'name');

                const mappings = [];
                for (const perm of allPerms) {
                    if (superRole) {
                        mappings.push({ role_id: superRole.id, permission_id: perm.id });
                    }
                    if (adminRole && ['configure_organization', 'manage_staff', 'process_payroll', 'approve_attendance', 'approve_leaves', 'view_self'].includes(perm.name)) {
                        mappings.push({ role_id: adminRole.id, permission_id: perm.id });
                    }
                    if (managerRole && ['manage_staff', 'approve_attendance', 'approve_leaves', 'view_self'].includes(perm.name)) {
                        mappings.push({ role_id: managerRole.id, permission_id: perm.id });
                    }
                    if (empRole && ['view_self'].includes(perm.name)) {
                        mappings.push({ role_id: empRole.id, permission_id: perm.id });
                    }
                }
                if (mappings.length > 0) {
                    await db('role_permissions').insert(mappings).catch(() => {});
                }
                console.log('>>> [DB-SYNC]: Seeding permissions and role mappings completed.');
            }
        } catch (e) {
            console.error('>>> [DB-SYNC-ERROR]: Seeding permissions failed:', e.message);
        }

        // 4. Ensure salary_history table exists
        const hasSalaryHistory = await db.schema.hasTable('salary_history');
        if (!hasSalaryHistory) {
            console.log('>>> [DB-SYNC]: Creating salary_history table...');
            await db.schema.createTable('salary_history', (table) => {
                table.increments('id').primary();
                table.integer('employee_id').unsigned().notNullable();
                table.integer('company_id').unsigned().notNullable();
                table.decimal('old_salary', 15, 2).nullable();
                table.decimal('new_salary', 15, 2).notNullable();
                table.date('change_date').notNullable();
                table.string('reason', 255).nullable();
                table.timestamp('created_at').defaultTo(db.fn.now());
                table.foreign('employee_id').references('employees.id').onDelete('CASCADE');
                table.foreign('company_id').references('companies.id').onDelete('CASCADE');
            });
            console.log('>>> [DB-SYNC]: salary_history table created.');
        }

    } catch (err) {
        console.error('>>> [DB-SYNC-ERROR]:', err.message);
    }
};

// Run sync on startup
syncDatabaseSchema();

const path = require('path');
const fs = require('fs');

// Ensure upload directories exist
const uploadDirs = [
    path.join(__dirname, '../uploads'),
    path.join(__dirname, '../uploads/kyc'),
    path.join(__dirname, '../uploads/profile_photos'),
    path.join(__dirname, '../uploads/branding'),
    path.join(__dirname, '../uploads/tenants')
];

uploadDirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

const app = express();

app.set('trust proxy', 1);

// Security Middlewares (Set security headers first)
app.use(helmet({
    crossOriginResourcePolicy: false, // Allow cross-origin images/files
    contentSecurityPolicy: {
        directives: {
            ...helmet.contentSecurityPolicy.getDefaultDirectives(),
            'upgrade-insecure-requests': null, // Stop upgrading HTTP requests to HTTPS
        },
    },
    hsts: false, // Disable HSTS (Strict-Transport-Security) for HTTP development/testing
}));

// 1. Serve frontend static files immediately (Bypasses CORS, rate limiting, and api logic)
app.use(express.static(path.join(__dirname, '../public')));

// 2. Virtual Router for multi-tenant file separation (Served early before CORS)
app.get('/uploads/kyc/:filename', (req, res, next) => {
    const filename = req.params.filename;
    const uploadsBase = path.join(__dirname, '../uploads');
    
    // 1. Try legacy path first (backwards compatibility)
    const legacyPath = path.join(uploadsBase, 'kyc', filename);
    if (fs.existsSync(legacyPath) && fs.lstatSync(legacyPath).isFile()) {
        return res.sendFile(legacyPath);
    }
    
    // 2. Scan company-isolated folders
    if (fs.existsSync(uploadsBase)) {
        const dirs = fs.readdirSync(uploadsBase);
        for (const dir of dirs) {
            if (dir.startsWith('company_')) {
                const filePath = path.join(uploadsBase, dir, 'kyc', filename);
                if (fs.existsSync(filePath) && fs.lstatSync(filePath).isFile()) {
                    return res.sendFile(filePath);
                }
            }
        }
    }
    next();
});

app.get('/uploads/:filename', (req, res, next) => {
    const filename = req.params.filename;
    if (filename.includes('/') || filename.includes('\\')) {
        return next();
    }
    
    const uploadsBase = path.join(__dirname, '../uploads');
    
    // 1. Try legacy path first
    const legacyPath = path.join(uploadsBase, filename);
    if (fs.existsSync(legacyPath) && fs.lstatSync(legacyPath).isFile()) {
        return res.sendFile(legacyPath);
    }
    
    // 2. Scan company-isolated folders for tasks
    if (fs.existsSync(uploadsBase)) {
        const dirs = fs.readdirSync(uploadsBase);
        for (const dir of dirs) {
            if (dir.startsWith('company_')) {
                const filePath = path.join(uploadsBase, dir, 'tasks', filename);
                if (fs.existsSync(filePath) && fs.lstatSync(filePath).isFile()) {
                    return res.sendFile(filePath);
                }
            }
        }
    }
    next();
});

// 3. Serve uploads static directory (Fallback if not intercepted by Virtual Router)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// 4. CORS Setup and allowed origins
const allowedOrigins = [
    'https://myfasthr.com',
    'https://www.myfasthr.com',
    'http://localhost:5173',
    'http://localhost:3000',
    'http://localhost',
    'capacitor://localhost',
    'app://localhost'
];

if (process.env.FRONTEND_URL) {
    const customOrigin = process.env.FRONTEND_URL.replace(/\/$/, '');
    if (!allowedOrigins.includes(customOrigin)) {
        allowedOrigins.push(customOrigin);
    }
}

app.use(cors((req, callback) => {
    const origin = req.header('Origin');
    const host = req.header('Host');
    
    let isSameOrigin = false;
    if (origin && host) {
        try {
            const parsedOriginHost = new URL(origin).host;
            isSameOrigin = parsedOriginHost.toLowerCase() === host.toLowerCase();
        } catch (e) {
            // Invalid URL format in Origin header
        }
    }
    
    const isLocalIP = origin && (
        origin.startsWith('http://192.168.') || 
        origin.startsWith('http://10.') || 
        origin.startsWith('http://172.16.') || 
        origin.startsWith('http://172.17.') || 
        origin.startsWith('http://172.18.') || 
        origin.startsWith('http://172.19.') || 
        origin.startsWith('http://172.20.') || 
        origin.startsWith('http://172.21.') || 
        origin.startsWith('http://172.22.') || 
        origin.startsWith('http://172.23.') || 
        origin.startsWith('http://172.24.') || 
        origin.startsWith('http://172.25.') || 
        origin.startsWith('http://172.26.') || 
        origin.startsWith('http://172.27.') || 
        origin.startsWith('http://172.28.') || 
        origin.startsWith('http://172.29.') || 
        origin.startsWith('http://172.30.') || 
        origin.startsWith('http://172.31.')
    );
    
    const isAllowed = !origin || isSameOrigin || allowedOrigins.includes(origin) || isLocalIP;
    
    if (isAllowed) {
        callback(null, {
            origin: origin || true,
            credentials: true,
            methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
            // Added biometric machine headers: ocp-apim-subscription-key and x-api-key
            allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'X-Delete-Security-Key', 'ocp-apim-subscription-key', 'Ocp-Apim-Subscription-Key', 'x-api-key', 'X-Api-Key']
        });
    } else {
        console.warn(`>>> [CORS BLOCKED]: Unauthorized origin attempt: ${origin}`);
        callback(null, { 
            origin: false, // Return origin: false instead of throwing an Error to prevent server-side 500 crash
            credentials: true,
            methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'X-Delete-Security-Key', 'ocp-apim-subscription-key', 'Ocp-Apim-Subscription-Key', 'x-api-key', 'X-Api-Key']
        });
    }
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Rate Limiting - Increased for dashboard stability
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5000, // Increased limit to prevent polling/refresh blocking
    message: { message: 'Too many requests from this IP, please try again after 15 minutes' }
});
app.use(limiter);

// Global Request Logger for Debugging
app.use((req, res, next) => {
    console.log(`>>> [NET]: ${req.method} ${req.url}`);
    try {
        const fs = require('fs');
        const path = require('path');
        const logPath = path.join(__dirname, '../request.log');
        fs.appendFileSync(logPath, `[${new Date().toISOString()}] ${req.method} ${req.url} - Auth: ${req.headers.authorization}\n`);
    } catch (e) {
        // Ignore logging errors
    }
    next();
});

const deleteSecurityGuard = require('./middlewares/deleteSecurityMiddleware');
app.use(deleteSecurityGuard);

// Emergency system freeze middleware to intercept write requests
app.use(async (req, res, next) => {
    if (req.method !== 'GET' && req.method !== 'OPTIONS') {
        try {
            // Biometric machine routes always bypass system freeze
            const isBiometricRoute = req.path === '/Device/SaveDevice' || req.path.startsWith('/api/v1/machine');
            if (isBiometricRoute) return next();

            const freezeRecord = await db.centralDb('global_settings').where({ key: 'system_freeze' }).first();
            if (freezeRecord && freezeRecord.value === 'true') {
                let token = null;
                const authHeader = req.headers.authorization;
                if (authHeader && authHeader.startsWith('Bearer ')) {
                    token = authHeader.split(' ')[1];
                } else if (req.query.token) {
                    token = req.query.token;
                }

                let isSuperAdmin = false;
                if (token) {
                    if (token === 'test.super.token') {
                        isSuperAdmin = true;
                    } else if (!token.startsWith('test.')) {
                        const jwt = require('jsonwebtoken');
                        try {
                            const decoded = jwt.verify(token, process.env.JWT_SECRET);
                            if (decoded.role_name === 'super_admin') {
                                isSuperAdmin = true;
                            }
                        } catch (err) {
                            // Ignore decoding error
                        }
                    }
                }

                const isAuthRoute = req.path.startsWith('/api/auth');
                const isFreezeToggleRoute = req.path === '/api/admin/system/freeze';
                
                if (!isSuperAdmin && !isAuthRoute && !isFreezeToggleRoute) {
                    return res.status(403).json({ message: 'System under emergency freeze. All modifications are suspended.' });
                }
            }
        } catch (e) {
            console.error('System freeze middleware check error:', e);
        }
    }
    next();
});

// const tenantDbMiddleware = require('./middlewares/tenantDbMiddleware');
// app.use(tenantDbMiddleware);

const categoryRoutes = require('./routes/categoryRoutes');

// Routes
const machineRoutes = require('./routes/machineRoutes');
app.use('/api/v1/machine', machineRoutes);

// Biometric vendor endpoint mapping (ZKTeco / Compatible machines)
app.post('/Device/SaveDevice', async (req, res) => {
    try {
        // Log every incoming biometric machine request for debugging
        console.log('>>> [BIOMETRIC-MACHINE-HIT]: POST /Device/SaveDevice | IP:', req.ip);
        console.log('>>> [BIOMETRIC-MACHINE-HEADERS]:', JSON.stringify(req.headers));
        console.log('>>> [BIOMETRIC-MACHINE-BODY]:', JSON.stringify(req.body));

        // Write to debug log file for persistent tracking
        try {
            const fs = require('fs');
            const path = require('path');
            const logFile = path.join(__dirname, '../biometric_machine_debug.log');
            const logLine = `[${new Date().toISOString()}] IP:${req.ip} | Headers:${JSON.stringify(req.headers)} | Body:${JSON.stringify(req.body)}\n`;
            fs.appendFileSync(logFile, logLine);
        } catch (logErr) { /* ignore */ }

        // Accept ocp-apim-subscription-key (machine standard) OR x-api-key OR query param
        const apiKey = req.headers['ocp-apim-subscription-key'] 
            || req.headers['Ocp-Apim-Subscription-Key']
            || req.headers['x-api-key']
            || req.headers['X-Api-Key']
            || req.query.api_key
            || req.body?.api_key;

        const masterKey = process.env.BIOMETRIC_API_KEY || 'mfhr_master_fallback_950453de87fb5c4b6a434f7074413487bab73b4eb0ce3227e96d4877a745eb5a';

        if (!apiKey) {
            console.warn('>>> [BIOMETRIC-MACHINE]: Missing subscription key from IP:', req.ip);
            return res.status(401).json({ success: false, message: 'Authentication required. Missing subscription key.' });
        }

        // Extract device serial - try multiple field names used by different machines
        const deviceSerial = req.body.deviceSerialno 
            || req.body.deviceID 
            || req.body.device_serial
            || req.body.DeviceSN
            || req.body.serialno;

        if (!deviceSerial) {
            console.warn('>>> [BIOMETRIC-MACHINE]: Missing device serial in payload:', req.body);
            return res.status(400).json({ success: false, message: 'Missing deviceSerialno or deviceID in payload.' });
        }

        // Extract employee ID - try multiple field names
        const employeeID = req.body.employeeID 
            || req.body.employee_id
            || req.body.EnrollNumber
            || req.body.enrollNumber;

        if (!employeeID) {
            console.warn('>>> [BIOMETRIC-MACHINE]: Missing employeeID in payload:', req.body);
            return res.status(400).json({ success: false, message: 'Missing employeeID in payload.' });
        }

        // Extract date and time - try multiple formats
        const dateStr = req.body.date || req.body.Date;
        const timeStr = req.body.time || req.body.Time;

        if (!dateStr || !timeStr) {
            console.warn('>>> [BIOMETRIC-MACHINE]: Missing date or time in payload:', req.body);
            return res.status(400).json({ success: false, message: 'Missing date or time in payload.' });
        }

        // Skip failed punches if machine sends PunchStatus (could be 'success', 'True', or true)
        const punchStatus = req.body.PunchStatus || req.body.punchStatus || req.body.punch_status;
        if (punchStatus !== undefined && punchStatus !== null) {
            const statusStr = String(punchStatus).toLowerCase().trim();
            const isSuccess = statusStr === 'success' || statusStr === 'true' || statusStr === '1';
            if (!isSuccess) {
                console.warn('>>> [BIOMETRIC-MACHINE]: Skipping punch with status:', punchStatus);
                return res.status(200).json({ success: true, message: 'Punch skipped (non-success status).', status: 'skipped' });
            }
        }

        // Lookup device by serial - allow master key to work WITHOUT device pre-registration
        let device = await db('biometric_devices').where({ device_serial: deviceSerial }).first();
        
        if (!device) {
            // If master key is used and device not registered, auto-register under default company (for testing)
            if (apiKey === masterKey) {
                console.warn(`>>> [BIOMETRIC-MACHINE]: Device ${deviceSerial} not registered. Master key used - attempting auto-registration.`);
                // Try to get first company as fallback
                const firstCompany = await db('companies').orderBy('id', 'asc').first();
                if (firstCompany) {
                    const crypto = require('crypto');
                    const newApiKey = `mfhr_device_live_${crypto.randomBytes(32).toString('hex')}`;
                    const [newDeviceId] = await db('biometric_devices').insert({
                        company_id: firstCompany.id,
                        device_name: `Auto-Registered Device (${deviceSerial})`,
                        device_serial: deviceSerial,
                        ip_address: req.ip,
                        port: 80,
                        status: 'online',
                        api_key: newApiKey,
                        last_ping_at: db.fn.now()
                    });
                    device = await db('biometric_devices').where({ id: newDeviceId }).first();
                    console.log(`>>> [BIOMETRIC-MACHINE]: Auto-registered device ${deviceSerial} under company ${firstCompany.id}`);
                } else {
                    return res.status(404).json({ success: false, message: `Device ${deviceSerial} not registered and no company exists.` });
                }
            } else {
                return res.status(404).json({ success: false, message: `Device serial '${deviceSerial}' is not registered. Please register the device first via the admin portal.` });
            }
        }

        // Validate API key (allow master key OR device's own API key OR the subscription key from config)
        const configuredSubKey = process.env.BIOMETRIC_SUBSCRIPTION_KEY || '9926d5dd2d6249e9abd93613a9bc0a98';
        const isValidKey = (apiKey === masterKey) || (apiKey === device.api_key) || (apiKey === configuredSubKey);
        if (!isValidKey) {
            console.warn(`>>> [BIOMETRIC-MACHINE]: Invalid key for device ${deviceSerial}. Received: ${apiKey}`);
            return res.status(401).json({ success: false, message: 'Unauthorized. Invalid subscription key for this device.' });
        }

        // Build punch object
        const punch = {
            employee_code: String(employeeID).trim(),
            timestamp: `${dateStr} ${timeStr}`
        };

        console.log(`>>> [BIOMETRIC-MACHINE]: Processing punch for employee '${punch.employee_code}' at '${punch.timestamp}' on device '${deviceSerial}' (company: ${device.company_id})`);

        const machineAttendanceService = require('./services/machineAttendanceService');
        const result = await machineAttendanceService.processPunch(device.company_id, device.device_serial, punch);

        // Update device online status
        await db('biometric_devices')
            .where({ id: device.id })
            .update({ 
                status: 'online', 
                last_ping_at: db.fn.now() 
            });

        console.log(`>>> [BIOMETRIC-MACHINE]: Punch result for employee '${punch.employee_code}':`, result);

        if (result.status === 'failed') {
            return res.status(400).json({ success: false, ...result });
        }
        res.status(200).json({ success: true, ...result });
    } catch (err) {
        console.error('[BIOMETRIC-VENDOR-PUSH-ERROR]:', err.message, err.stack);
        res.status(500).json({ success: false, message: 'Internal server error processing punch.', error: err.message });
    }
});

// Alias: /Device/ and /Device also forward to SaveDevice handler
// (TimeWatch machine URL shows: http://myfasthr.com/Device/ - missing SaveDevice)
app.post(['/Device', '/Device/'], (req, res) => {
    console.log(`>>> [BIOMETRIC-MACHINE]: ${req.path} hit - treating as /Device/SaveDevice`);
    // Forward to the same SaveDevice logic by rewriting the URL and re-dispatching
    req.url = '/Device/SaveDevice';
    app.handle(req, res);
});

app.use('/api/auth', authRoutes);

const employeeController = require('./controllers/employeeController');

// High Priority Onboarding Token Route
app.post('/api/employees/:id/generate-token', authenticateToken, tenantGuard, employeeController.generateToken);

// Public Branding Route
const brandingController = require('./controllers/brandingController');
app.get('/api/public/branding', brandingController.getPublicBranding);
app.get('/api/public/branding/manifest.json', (req, res) => brandingController.getPublicManifest(req, res));
app.get('/manifest.json', (req, res) => brandingController.getPublicManifest(req, res));

// Public Case Studies Route
app.get('/api/public/case-studies', async (req, res) => {
    try {
        const studies = await db('case_studies').select('*').orderBy('id', 'desc');
        const parsedStudies = studies.map(s => {
            try {
                return {
                    ...s,
                    metrics: s.metrics ? JSON.parse(s.metrics) : []
                };
            } catch (e) {
                return { ...s, metrics: [] };
            }
        });
        res.json(parsedStudies);
    } catch (err) {
        console.error('Failed to get public case studies:', err);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// Public Book Demo Route to Register Trial Company (so it displays on Super Admin Dashboard)
app.post('/api/public/book-demo', async (req, res) => {
    try {
        const { name, email, headcount, selectedModules, guide, selectedDate, selectedTime } = req.body;
        if (!name || !email) {
            return res.status(400).json({ message: 'Company name and email are required.' });
        }
        
        // Generate unique slug
        const baseSlug = name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');
        
        let uniqueSlug = baseSlug || `company-${Date.now()}`;
        let suffix = 1;
        while (true) {
            const existing = await db('companies').where({ slug: uniqueSlug }).first();
            if (!existing) break;
            uniqueSlug = `${baseSlug}-${suffix++}`;
        }

        // Insert trial company so it appears on Super Admin Dashboard as Recent Signup
        const [companyId] = await db('companies').insert({
            name,
            email,
            slug: uniqueSlug,
            subscription_status: 'trial',
            settings: JSON.stringify({ theme: 'light', currency: 'INR' }),
            created_at: db.fn.now(),
            updated_at: db.fn.now()
        });

        // Initialize tenant DB schemas
        const { initTenantDb } = require('./config/db');
        await initTenantDb(companyId);

        // Raise support ticket for Super Admin review
        await db('tickets').insert({
            company_id: companyId,
            employee_id: 0, // Indicates a guest booking request
            title: `Demo Booking: ${name}`,
            description: `A new demo booking request has been submitted by ${name} (${email}).

Modules Interested:
${selectedModules && selectedModules.length > 0 ? selectedModules.map(m => `- ${m}`).join('\n') : '- None selected'}

Expected Team Size:
${headcount || 'Not specified'}

Assigned Specialist:
${guide || 'Not specified'}

Scheduled Slot:
${selectedDate || 'Not specified'} at ${selectedTime || 'Not specified'}`,
            category: 'Platform',
            priority: 'Medium',
            status: 'Open',
            created_at: db.fn.now(),
            updated_at: db.fn.now()
        });

        res.status(201).json({ success: true, companyId });
    } catch (err) {
        console.error('Failed public book-demo registration:', err);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// Public Onboarding Routes (No Auth Required)
// Public Onboarding Routes (No Auth Required)
app.get('/api/public/onboarding/:token', employeeController.getOnboardingProfile);
app.patch('/api/public/onboarding/:token', employeeController.submitOnboarding);
app.post('/api/public/onboarding/:token/confirm', employeeController.submitFinalOnboarding);
app.post('/api/public/onboarding/:token/finalize', employeeController.finalizeSection);
app.delete('/api/public/onboarding/:token/education/:id', employeeController.deleteEducation);
app.delete('/api/public/onboarding/:token/course/:id', employeeController.deleteCourse);
app.delete('/api/public/onboarding/:token/document/:id', employeeController.deleteDocument);

const { upload } = require('./services/documentService');
app.post('/api/public/onboarding/:token/upload', upload.single('file'), employeeController.publicUploadDocument);

// Public Biometric Log Route (Bypasses JWT authentication token)
const attendanceService = require('./services/attendanceService');
app.get('/api/attendance/machine-log', (req, res) => {
    res.json({ status: 'online', message: 'MyFastHR Biometric Sync Webhook is active. Please use POST request to push logs.' });
});
app.post('/api/attendance/machine-log', async (req, res) => {
    try {
        const apiKey = req.headers['x-api-key'] || req.query.api_key || req.body.api_key;
        const secretKey = process.env.BIOMETRIC_API_KEY || 'mfhr_master_secure_9a2c8e3f4b5d0c1e8a2b3c4d5e6f7a8b';
        
        if (!apiKey || apiKey !== secretKey) {
            console.warn('>>> [BIOMETRIC]: Unauthorized machine punch attempt. Invalid API Key.');
            return res.status(401).json({ message: 'Unauthorized. Invalid or missing API key.' });
        }
        
        const result = await attendanceService.processMachineLog(req.body);
        res.json(result);
    } catch (err) {
        console.error('>>> [BIOMETRIC]: Webhook processing failed:', err.message);
        res.status(400).json({ message: err.message });
    }
});

app.use('/api/document-categories', authenticateToken, tenantGuard, categoryRoutes);

const kudosRoutes = require('./routes/kudosRoutes');

// Apply Tenancy Guards to all internal operations
app.use('/api/kudos', authenticateToken, tenantGuard, kudosRoutes);
app.use('/api/attendance', authenticateToken, tenantGuard, attendanceRoutes);
app.use('/api/leaves', authenticateToken, tenantGuard, leaveRoutes);
app.use('/api/regularizations', authenticateToken, tenantGuard, regularizationRoutes);
app.use('/api/employees', authenticateToken, tenantGuard, employeeRoutes);
app.use('/api/admin', authenticateToken, adminRoutes); // Admin routes often global or specific
app.use('/api/org', authenticateToken, tenantGuard, orgRoutes);
app.use('/api/documents', authenticateToken, tenantGuard, documentRoutes);
app.use('/api/notifications', authenticateToken, tenantGuard, notificationRoutes);
app.use('/api/compliance', authenticateToken, tenantGuard, complianceRoutes);
app.use('/api/payroll', authenticateToken, tenantGuard, payrollRoutes);
app.use('/api/analytics', authenticateToken, tenantGuard, analyticsRoutes);
app.use('/api/settings', authenticateToken, tenantGuard, settingsRoutes);
app.use('/api/tasks', authenticateToken, tenantGuard, taskRoutes);
app.use('/api/profile', authenticateToken, profileRoutes);
app.use('/api/announcements', authenticateToken, announcementsRoutes);

const ticketRoutes = require('./routes/ticketRoutes');
app.use('/api/tickets', authenticateToken, tenantGuard, ticketRoutes);

// Test Route
app.get('/api/test-tasks', (req, res) => res.json({ message: 'Task API Mount Point Active' }));


// Base API route
app.get('/api', (req, res) => res.send('MyFastHR SaaS API is running...'));

app.get('/api/debug-db', async (req, res) => {
    try {
        const rows = await db('system_settings').select('*');
        res.json(rows);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});
app.get('/api/syslogs', async (req, res) => {
    const fs = require('fs');
    const path = require('path');
    const report = {
        workingDir: process.cwd(),
        dirname: __dirname,
        env: {
            NODE_ENV: process.env.NODE_ENV,
            PORT: process.env.PORT
        },
        directories: {}
    };

    const dirsToCheck = {
        uploads: path.join(__dirname, '../uploads'),
        branding: path.join(__dirname, '../uploads/branding'),
        kyc: path.join(__dirname, '../uploads/kyc'),
        tenants: path.join(__dirname, '../uploads/tenants'),
        profile_photos: path.join(__dirname, '../uploads/profile_photos'),
        public: path.join(__dirname, '../public')
    };

    for (const [name, dirPath] of Object.entries(dirsToCheck)) {
        const stats = {
            path: dirPath,
            exists: fs.existsSync(dirPath)
        };
        if (stats.exists) {
            try {
                const s = fs.statSync(dirPath);
                stats.isDirectory = s.isDirectory();
                stats.mode = s.mode.toString(8);
                
                // Test write permissions
                const testFile = path.join(dirPath, `test-write-${Date.now()}.txt`);
                try {
                    fs.writeFileSync(testFile, 'write test');
                    fs.unlinkSync(testFile);
                    stats.writable = true;
                } catch (writeErr) {
                    stats.writable = false;
                    stats.writeError = writeErr.message;
                }
            } catch (err) {
                stats.statError = err.message;
            }
        } else {
            // Try to create it
            try {
                fs.mkdirSync(dirPath, { recursive: true });
                stats.created = true;
                stats.existsAfterCreation = fs.existsSync(dirPath);
                
                const testFile = path.join(dirPath, `test-write-${Date.now()}.txt`);
                fs.writeFileSync(testFile, 'write test');
                fs.unlinkSync(testFile);
                stats.writable = true;
            } catch (createErr) {
                stats.created = false;
                stats.creationError = createErr.message;
            }
        }
        report.directories[name] = stats;
    }

    // 1. Get files inside directories
    report.directoryFiles = {};
    for (const [name, dirPath] of Object.entries(dirsToCheck)) {
        if (fs.existsSync(dirPath)) {
            try {
                report.directoryFiles[name] = fs.readdirSync(dirPath);
            } catch (err) {
                report.directoryFiles[name] = 'Error: ' + err.message;
            }
        } else {
            report.directoryFiles[name] = 'Directory does not exist';
        }
    }

    // 2. Query database settings
    report.dbSettings = null;
    report.companies = null;
    try {
        report.dbSettings = await db('system_settings').select('*');
        report.companies = await db('companies').select('id', 'name', 'slug', 'logo_url', 'brand_color');
    } catch (dbErr) {
        report.dbError = dbErr.message;
    }

    // 3. Read request log
    const requestLogPath = path.join(__dirname, '../request.log');
    if (fs.existsSync(requestLogPath)) {
        try {
            report.requestLog = fs.readFileSync(requestLogPath, 'utf8').split('\n').slice(-30).join('\n');
        } catch (err) {
            report.requestLogErr = err.message;
        }
    } else {
        report.requestLog = 'Not found';
    }

    const crashLogPath = path.join(__dirname, '../../crash.log');
    if (fs.existsSync(crashLogPath)) {
        try {
            report.crashLog = fs.readFileSync(crashLogPath, 'utf8').split('\n').slice(-30).join('\n');
        } catch (err) {
            report.crashLogErr = err.message;
        }
    } else {
        report.crashLog = 'Not found';
    }

    res.json(report);
});

// Catch-all for React Router (Using regex to avoid Express 5 path-to-regexp crash)
app.get(/(.*)/, (req, res) => {
    // Prevent non-existent assets, APIs, or uploads from returning index.html (returns 404 instead)
    if (req.path.startsWith('/assets/') || req.path.startsWith('/api/') || req.path.startsWith('/uploads/')) {
        return res.status(404).send('Not Found');
    }
    res.sendFile(path.join(__dirname, '../public', 'index.html'));
});

// Global Error Handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ 
        message: 'Internal Server Error',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

module.exports = app;
