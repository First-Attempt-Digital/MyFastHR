const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const db = require('../config/db');

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
        const yr = parts[0];
        const mo = parts[1];
        const dy = parts[2];
        const hr = parts[3] || '00';
        const mi = parts[4] || '00';
        const sc = parts[5] || '00';
        return new Date(`${yr}-${mo}-${dy}T${hr}:${mi}:${sc}+05:30`);
    }
    const d = new Date(dateVal);
    return isNaN(d.getTime()) ? null : d;
}

function getLogicalDateStr(checkIn) {
    if (!checkIn) return null;
    const d = dbDateToUTC(checkIn);
    if (!d || isNaN(d.getTime())) return null;
    
    const checkInYMD = d.toLocaleDateString('sv-SE', { timeZone: 'Asia/Kolkata' });
    return checkInYMD;
}

async function testLocale() {
    const checkIn = '2026-07-02 11:04:04';
    const d = dbDateToUTC(checkIn);
    console.log('parsed Date object:', d);
    console.log('parsed Date string:', d.toString());
    console.log('getLogicalDateStr result:', getLogicalDateStr(checkIn));
    console.log('sv-SE locale string:', d.toLocaleDateString('sv-SE', { timeZone: 'Asia/Kolkata' }));
    process.exit(0);
}

testLocale().catch(console.error);
