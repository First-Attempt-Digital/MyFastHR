const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '../services/attendanceService.js');
const content = fs.readFileSync(file, 'utf8');

console.log("=== SEARCHING KEYWORDS IN attendanceService.js ===");
const lines = content.split('\n');

for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.includes('getMatrix') || line.includes('getAttendanceMatrix') || line.includes('Muster') || line.includes('matrix')) {
        console.log(`Line ${i + 1}: ${line.trim()}`);
    }
}
