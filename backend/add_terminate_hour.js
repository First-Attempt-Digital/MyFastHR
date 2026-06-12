const db = require('./src/config/db');

async function run() {
    try {
        const hasCol = await db.schema.hasColumn('shifts', 'terminate_hour');
        if (!hasCol) {
            await db.schema.table('shifts', table => {
                table.integer('terminate_hour').nullable();
            });
            console.log('Column terminate_hour added to shifts table');
        } else {
            console.log('Column terminate_hour already exists');
        }
    } catch (err) {
        console.error('Failed to update schema:', err);
    }
    process.exit(0);
}

run();
