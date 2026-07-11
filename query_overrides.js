// Find recent manual overrides in history
const knex = require('./backend/src/config/db');

async function debug() {
    try {
        console.log('=== LATEST OVERRIDES ===');
        const history = await knex('attendance_override_history')
            .orderBy('created_at', 'desc')
            .limit(10);
        console.log(JSON.stringify(history, null, 2));

    } catch (err) {
        console.error('ERROR:', err.message);
    } finally {
        await knex.destroy();
    }
}

debug();
