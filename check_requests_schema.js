const fs = require('fs');
const db = require('./backend/src/config/db');

async function checkSchema() {
    try {
        const result = await db.raw('SHOW CREATE TABLE attendance_entry_requests');
        console.log(result[0][0]['Create Table']);
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
checkSchema();
