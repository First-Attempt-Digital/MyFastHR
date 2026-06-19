const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const db = require('../config/db');

async function checkPunches() {
    const companyId = 29;
    const targetDate = '2026-06-19';
    console.log(`=== PUNCH RECORDS FOR COMPANY ID ${companyId} ON ${targetDate} ===\n`);

    try {
        const records = await db('attendance as a')
            .join('employees as e', 'a.employee_id', 'e.id')
            .where('a.company_id', companyId)
            .whereRaw('DATE(a.check_in) = ?', [targetDate])
            .select(
                'e.first_name',
                'e.last_name',
                'e.employee_id_number',
                'a.check_in',
                'a.check_out',
                'a.status',
                'a.punch_source'
            )
            .orderBy('a.check_in', 'asc');

        if (records.length === 0) {
            console.log(`No punch records found for company id ${companyId} on ${targetDate}.`);
        } else {
            console.log(`Found ${records.length} punch records:\n`);
            records.forEach((r, idx) => {
                const name = `${r.first_name || ''} ${r.last_name || ''}`.trim();
                console.log(`${idx + 1}. [${r.employee_id_number}] ${name}`);
                console.log(`   Check-in:  ${r.check_in} (Source: ${r.punch_source})`);
                console.log(`   Check-out: ${r.check_out || 'Not checked out'}`);
                console.log(`   Status:    ${r.status}`);
                console.log('--------------------------------------------------');
            });
        }
    } catch (err) {
        console.error('Error fetching records:', err);
    } finally {
        await db.destroy();
    }
}

checkPunches();
