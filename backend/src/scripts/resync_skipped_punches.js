const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const knex = require('knex');
const config = require('../../knexfile');
const environment = process.env.NODE_ENV || 'development';
const db = knex(config[environment]);

async function run() {
    try {
        console.log('Connecting to database...');
        
        // Find matching skipped logs for 2026-07-16
        const dateStr = '2026-07-16';
        const targetError = 'checkout window';
        
        const logs = await db('biometric_raw_logs')
            .whereRaw('DATE(punch_time) = ?', [dateStr])
            .where('status', 'skipped')
            .where('error_details', 'like', `%${targetError}%`);
            
        console.log(`Found ${logs.length} matching skipped logs for ${dateStr}.`);
        
        if (logs.length === 0) {
            console.log('No logs found to update.');
            process.exit(0);
        }
        
        const logIds = logs.map(l => l.id);
        
        console.log('Updating statuses to pending...');
        const updatedCount = await db('biometric_raw_logs')
            .whereIn('id', logIds)
            .update({
                status: 'pending',
                error_details: null
            });
            
        console.log(`Successfully updated ${updatedCount} logs to "pending".`);
        process.exit(0);
    } catch (err) {
        console.error('Error running script:', err);
        process.exit(1);
    }
}

run();
