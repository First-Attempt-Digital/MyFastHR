// Debug: call getMatrix properly for company_id=2, July 2026
const knex = require('./backend/src/config/db');
const attendanceService = require('./backend/src/services/attendanceService');

async function debug() {
    try {
        const fakeUser = { company_id: 2, role_name: 'company_admin', employee_id: null };
        
        console.log('=== CALLING getMatrix for July 2026, company 2 ===');
        const result = await attendanceService.getMatrix(fakeUser, 7, 2026);
        
        // Find Bhulendra
        const bhulendra = result.matrix?.find(e => e.id === 609 || e.code === '1163');
        if (bhulendra) {
            console.log('Bhulendra found:', bhulendra.name);
            console.log('days[1] (July 1):', bhulendra.days?.[1]);
            console.log('stats:', bhulendra.stats);
        } else {
            console.log('Bhulendra NOT found. Total employees:', result.matrix?.length);
        }
        
        // Also check if the company has the right employees
        console.log('\nAll employees in matrix:', result.matrix?.map(e => ({id: e.id, name: e.name, code: e.code})));

    } catch (err) {
        console.error('ERROR:', err.message);
        console.error(err.stack);
    } finally {
        await knex.destroy();
    }
}

debug();
