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

    // Run explicit manual debug database query to inspect shift_assignments
    const daysInMonth = new Date(year, month, 0).getDate();
    const rawAssignments = await db('employee_shift_assignments as esa')
        .join('shifts as s', 'esa.shift_id', 's.id')
        .where('esa.employee_id', 2594)
        .select('esa.*', 's.name as shift_name', 's.start_time', 's.grace_period');

    console.log('\n--- Raw Assignments from DB for Employee 2594 ---');
    console.log(JSON.stringify(rawAssignments, null, 2));

    console.log('\n--- Date Parsing Variables ---');
    rawAssignments.forEach(sa => {
        const fromStr = sa.from_date instanceof Date ? sa.from_date.toLocaleDateString('sv-SE', { timeZone: 'Asia/Kolkata' }) : String(sa.from_date || '').split('T')[0];
        const toStr = sa.to_date instanceof Date ? sa.to_date.toLocaleDateString('sv-SE', { timeZone: 'Asia/Kolkata' }) : (sa.to_date ? String(sa.to_date).split('T')[0] : null);
        console.log(`  Assignment Shift: ${sa.shift_name} | from_date: ${sa.from_date} (parsed: ${fromStr}) | to_date: ${sa.to_date} (parsed: ${toStr})`);
    });

    if (!ritesh) {
        console.log('Ritesh Patel not found in matrix output!');
        process.exit(0);
    }

    console.log('\nRitesh Patel Matrix Row Details:');
    console.log(`  Name      : ${ritesh.name}`);
    console.log(`  Code      : ${ritesh.code}`);
    console.log(`  Day 2 Val : ${ritesh.days[2]}`);
    console.log('  Day 2 Meta:', JSON.stringify(ritesh.meta[2], null, 2));
    console.log('  Day 2 Timings:', JSON.stringify(ritesh.timings[2], null, 2));

    process.exit(0);
}

debugMatrixResponse().catch(e => { console.error(e); process.exit(1); });
