const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const db = require('../config/db');

// Same fixed dbDateToUTC
function dbDateToUTC(dateVal) {
    if (!dateVal) return null;
    if (dateVal instanceof Date) {
        const yr = dateVal.toLocaleDateString('en-US', { timeZone: 'Asia/Kolkata', year: 'numeric' });
        const mo = dateVal.toLocaleDateString('en-US', { timeZone: 'Asia/Kolkata', month: '2-digit' });
        const dy = dateVal.toLocaleDateString('en-US', { timeZone: 'Asia/Kolkata', day: '2-digit' });
        const timeParts = dateVal.toLocaleTimeString('en-US', { timeZone: 'Asia/Kolkata', hour12: false }).split(':');
        const hr = timeParts[0].padStart(2, '0');
        const mi = timeParts[1].padStart(2, '0');
        const sc = timeParts[2].padStart(2, '0');
        const hrClean = hr === '24' ? '00' : hr;
        return new Date(`${yr}-${mo}-${dy}T${hrClean}:${mi}:${sc}+05:30`);
    }
    const str = String(dateVal).trim();
    const parts = str.split(/[- : T]/);
    if (parts.length >= 3) {
        const yr = parts[0]; const mo = parts[1]; const dy = parts[2];
        const hr = parts[3] || '00'; const mi = parts[4] || '00'; const sc = parts[5] || '00';
        return new Date(`${yr}-${mo}-${dy}T${hr}:${mi}:${sc}+05:30`);
    }
    const d = new Date(dateVal);
    return isNaN(d.getTime()) ? null : d;
}

function dateToISTMins(dateVal) {
    if (!dateVal) return 0;
    const d = dbDateToUTC(dateVal);
    if (!d || isNaN(d.getTime())) return 0;
    const istDate = new Date(d.getTime() + (5.5 * 60 * 60 * 1000));
    return istDate.getUTCHours() * 60 + istDate.getUTCMinutes();
}

async function diagnose() {
    const targetDate = process.argv[2] || '2026-07-02';
    const companyId = 27;

    console.log(`\n=== DIAGNOSTIC: Company ${companyId} | Date: ${targetDate} ===`);
    console.log(`Server Timezone: ${Intl.DateTimeFormat().resolvedOptions().timeZone}`);
    console.log(`Server Local Time: ${new Date().toString()}\n`);

    // Get ALL attendance records for company 27 on target date
    const records = await db('attendance as a')
        .join('employees as e', 'a.employee_id', 'e.id')
        .where('e.company_id', companyId)
        .whereRaw('DATE(a.check_in) = ?', [targetDate])
        .select(
            'e.first_name', 'e.last_name', 'e.employee_id_number',
            'a.id as att_id', 'a.check_in', 'a.check_out',
            'a.status', 'a.punch_source'
        )
        .orderBy('e.employee_id_number');

    console.log(`Found ${records.length} attendance records for ${targetDate} using DATE(check_in) = '${targetDate}'\n`);

    // Show all unique statuses
    const statusCounts = {};
    for (const r of records) {
        const s = (r.status || 'null').toLowerCase();
        statusCounts[s] = (statusCounts[s] || 0) + 1;
    }
    console.log('DB Status breakdown:', statusCounts);
    console.log('');

    // Show details for records with pending/late status
    const badRecords = records.filter(r => {
        const s = (r.status || '').toLowerCase();
        return s === 'pending' || s === 'late' || s === 'late_in' || s === 'l';
    });

    console.log(`Records with pending/late status: ${badRecords.length}\n`);

    for (const r of badRecords.slice(0, 10)) {
        const checkInRaw = r.check_in;
        const checkInType = checkInRaw instanceof Date ? 'Date object' : `string: "${checkInRaw}"`;
        const converted = dbDateToUTC(checkInRaw);
        const istMins = dateToISTMins(checkInRaw);
        const istH = Math.floor(istMins / 60);
        const istM = istMins % 60;

        console.log(`[${r.employee_id_number}] ${r.first_name} ${r.last_name}`);
        console.log(`  DB status  : ${r.status} | Source: ${r.punch_source}`);
        console.log(`  check_in   : ${checkInType}`);
        console.log(`  Converted  : ${converted ? converted.toISOString() : 'null'}`);
        console.log(`  IST time   : ${String(istH).padStart(2,'0')}:${String(istM).padStart(2,'0')} (${istMins} mins)`);
        console.log('');
    }

    // Also check if any records exist with DATE(check_in) = DIFFERENT date
    const altDate = targetDate === '2026-07-02' ? '2026-07-01' : '2026-07-02';
    const altRecords = await db('attendance as a')
        .join('employees as e', 'a.employee_id', 'e.id')
        .where('e.company_id', companyId)
        .whereRaw('DATE(a.check_in) = ?', [altDate])
        .count('a.id as cnt')
        .first();
    console.log(`Records stored under ${altDate} (check): ${altRecords.cnt}`);

    process.exit(0);
}

diagnose().catch(err => { console.error(err); process.exit(1); });
