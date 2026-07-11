const db = require('../config/db');

async function inspectSchema() {
    console.log("=== INSPECTING biometric_raw_logs TABLE SCHEMA ===");
    const columns = await db.raw("DESCRIBE biometric_raw_logs");
    console.log(JSON.stringify(columns[0], null, 2));
    db.destroy();
}

inspectSchema().catch(e => {
    console.error(e);
    db.destroy();
});
