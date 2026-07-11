// Test script to manually update Divyanshu's attendance and check matrix
const knex = require('./backend/src/config/db');
const attendanceService = require('./backend/src/services/attendanceService');

async function test() {
    try {
        const fakeAdmin = { id: 94, name: 'Company Administrator', company_id: 2 };
        const companyId = 2;
        const employeeId = 339; // Divyanshu
        const date = '2026-07-01';
        
        console.log('=== PERFORMING MANUAL UPDATE FOR DIVYANSHU ===');
        const updateResult = await attendanceService.manualUpdateAttendance(fakeAdmin, companyId, {
            employee_id: employeeId,
            date: date,
            status: 'P'
        });
        console.log('Update result:', updateResult);

        console.log('\n=== RUNNING MATRIX SERVICE METHOD ===');
        const result = await attendanceService.getMatrix(fakeAdmin, 7, 2026);
        const divyanshuResult = result.matrix?.find(e => e.id === employeeId);
        console.log('Divyanshu matrix days:', JSON.stringify(divyanshuResult?.days, null, 2));

    } catch (err) {
        console.error('ERROR:', err.message, err.stack);
    } finally {
        await knex.destroy();
    }
}

test();
