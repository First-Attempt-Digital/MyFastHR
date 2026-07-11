// Troubleshoot what getMatrix is seeing for Bhulendra in July 2026
const knex = require('./backend/src/config/db');
const attendanceService = require('./backend/src/services/attendanceService');
const attendanceRepository = require('./backend/src/repositories/attendanceRepository');

async function debug() {
    try {
        const fakeUser = { company_id: 2, role_name: 'company_admin', employee_id: null };
        const month = 7;
        const year = 2026;
        
        console.log('--- GETTING COMPANY MATRIX RAW DATA ---');
        const raw = await attendanceRepository.getCompanyMatrix(fakeUser, month, year);
        const bhulendraLogs = raw.attendance.filter(a => a.employee_id === 609);
        console.log('Bhulendra attendance logs:', JSON.stringify(bhulendraLogs, null, 2));

        const bhulendraEmp = raw.employees.find(e => e.id === 609);
        console.log('Bhulendra employee info:', JSON.stringify(bhulendraEmp, null, 2));
        
        console.log('--- RUNNING MATRIX SERVICE METHOD ---');
        const result = await attendanceService.getMatrix(fakeUser, month, year);
        const bhulendraResult = result.matrix?.find(e => e.id === 609);
        console.log('Bhulendra matrix result:', JSON.stringify(bhulendraResult, null, 2));

    } catch (err) {
        console.error('ERROR:', err.message, err.stack);
    } finally {
        await knex.destroy();
    }
}

debug();
