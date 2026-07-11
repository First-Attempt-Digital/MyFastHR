// Debug: call getMatrix for July 2026 and find Bhulendra's entry for July 1
const knex = require('./backend/src/config/db');
const attendanceService = require('./backend/src/services/attendanceService');

async function debug() {
    try {
        const companyId = 2; // company where Bhulendra (emp_id_number: 1163, id: 609) is
        
        console.log('=== CALLING getMatrix for July 2026 ===');
        const result = await attendanceService.getMatrix(companyId, 7, 2026);
        
        // Find Bhulendra
        const bhulendra = result.matrix?.find(e => e.id === 609 || e.employee_id_number === '1163');
        if (bhulendra) {
            console.log('Bhulendra found:', bhulendra.name || bhulendra.first_name);
            console.log('July 1 status:', bhulendra.days?.['2026-07-01'] || bhulendra.days?.['01'] || JSON.stringify(Object.entries(bhulendra.days || {}).slice(0, 3)));
            console.log('Stats:', bhulendra.stats);
        } else {
            console.log('Bhulendra NOT found in matrix. Total employees:', result.matrix?.length);
            console.log('First 3:', result.matrix?.slice(0, 3).map(e => ({id: e.id, name: e.first_name || e.name, emp_no: e.employee_id_number})));
        }

    } catch (err) {
        console.error('ERROR:', err.message, err.stack);
    } finally {
        await knex.destroy();
    }
}

debug();
