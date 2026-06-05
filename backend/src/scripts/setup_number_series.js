const db = require('../config/db');

async function run() {
    console.log('--- Updating Database for Employee Number Series ---');
    try {
        // 1. Create employee_number_series table if not exists
        const exists = await db.schema.hasTable('employee_number_series');
        if (!exists) {
            await db.schema.createTable('employee_number_series', table => {
                table.increments('id').primary();
                table.integer('company_id').notNullable();
                table.string('name').notNullable();
                table.string('prefix').defaultTo('');
                table.string('suffix').defaultTo('');
                table.integer('current_number').defaultTo(0);
                table.integer('padding').defaultTo(4);
                table.string('format').defaultTo('{prefix}{number}');
                table.boolean('is_active').defaultTo(true);
                table.timestamps(true, true);
            });
            console.log('Table "employee_number_series" created.');
        }

        // 2. Add number_series column to employees if not exists
        const hasColumn = await db.schema.hasColumn('employees', 'number_series');
        if (!hasColumn) {
            await db.schema.table('employees', table => {
                table.string('number_series').nullable();
            });
            console.log('Column "number_series" added to "employees" table.');
        }

        // 3. Seed default data for all companies
        const companies = await db('companies').select('id');
        for (const company of companies) {
            const seriesCount = await db('employee_number_series').where({ company_id: company.id }).count('id as count').first();
            if (seriesCount.count === 0) {
                await db('employee_number_series').insert([
                    { company_id: company.id, name: 'Permanent Employees', prefix: 'P', padding: 4, format: 'P{number}' },
                    { company_id: company.id, name: 'Temporary Employees', prefix: 'T', padding: 8, format: 'T{number}' },
                    { company_id: company.id, name: 'Manual Entry', prefix: '', padding: 0, format: '{number}' }
                ]);
                console.log(`Default series seeded for company ${company.id}`);
            }
        }

        console.log('--- Database Update Complete ---');
    } catch (err) {
        console.error('Migration Error:', err);
    } finally {
        process.exit();
    }
}

run();
