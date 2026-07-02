const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const db = require('../config/db');
const attendanceService = require('../services/attendanceService');

async function debugMatrixResponse() {
    const mockUser = {
        company_id: 29,
        role_name: 'company_admin'
    };

    const month = 7;
    const year = 2026;

    console.log(`\n=== Calling getMatrix for Company 29, Month: ${month}, Year: ${year} ===\n`);

    const result = await attendanceService.getMatrix(mockUser, month, year);
    const ritesh = result.matrix.find(emp => emp.code === '963258');

    if (!ritesh) {
        console.log('Ritesh Patel not found in matrix output!');
        process.exit(0);
    }

    console.log('Ritesh Patel Matrix Row Details:');
    console.log(`  Name      : ${ritesh.name}`);
    console.log(`  Code      : ${ritesh.code}`);
    console.log(`  Day 2 Val : ${ritesh.days[2]}`);
    console.log('  Day 2 Meta:', JSON.stringify(ritesh.meta[2], null, 2));
    console.log('  Day 2 Timings:', JSON.stringify(ritesh.timings[2], null, 2));

    process.exit(0);
}

debugMatrixResponse().catch(e => { console.error(e); process.exit(1); });
