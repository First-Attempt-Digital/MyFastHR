const db = require('../config/db');
const attendanceService = require('../services/attendanceService');

async function testMatrix() {
    console.log("=== TESTING MUSTER MATRIX QUERY FOR JULY 2026 ===");
    
    // Simulate user object for company 27
    const mockUser = {
        company_id: 27,
        role_name: 'admin'
    };
    
    const result = await attendanceService.getMatrix(mockUser, 7, 2026);
    console.log(`Matrix has ${result.matrix.length} employees.`);
    
    // Find some sample employees and print their July 2nd and July 3rd grid values
    const targets = ['10048', '10149', '10141', '10263', '2011252'];
    for (const code of targets) {
        const empRow = result.matrix.find(r => r.employee_id_number === code);
        if (empRow) {
            console.log(`Emp: ${empRow.first_name} ${empRow.last_name} (${code})`);
            console.log(`  July 2nd status: ${empRow.grid['2']} | timings: ${JSON.stringify(empRow.grid_timings['2'])}`);
            console.log(`  July 3rd status: ${empRow.grid['3']} | timings: ${JSON.stringify(empRow.grid_timings['3'])}`);
        } else {
            console.log(`Emp Code ${code} not found in matrix!`);
        }
        console.log('');
    }
    
    db.destroy();
}

testMatrix().catch(e => {
    console.error(e);
    db.destroy();
});
