// Query all attendance records on 2026-07-01 in the database
const knex = require('./backend/src/config/db');

async function debug() {
    try {
        console.log('=== ALL ATTENDANCE LOGS ON 2026-07-01 ===');
        const logs = await knex('attendance')
            .where('check_in', '>=', '2026-07-01 00:00:00')
            .where('check_in', '<=', '2026-07-01 23:59:59');
        console.log('Logs count:', logs.length);
        console.log('Sample logs:', JSON.stringify(logs.slice(0, 10), null, 2));

        // Group by status
        const summary = {};
        logs.forEach(l => {
            summary[l.status] = (summary[l.status] || 0) + 1;
        });
        console.log('Summary by status:', summary);

    } catch (err) {
        console.error('ERROR:', err.message);
    } finally {
        await knex.destroy();
    }
}

debug();
