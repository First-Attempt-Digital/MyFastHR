const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '../services/attendanceService.js');
const content = fs.readFileSync(file, 'utf8');

console.log("=== SEARCHING getLogicalDateStr ===");
const lines = content.split('\n');

for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.includes('function getLogicalDateStr') || line.includes('const getLogicalDateStr')) {
        console.log(`Line ${i + 1}: ${line.trim()}`);
        // print next 25 lines
        for (let j = i + 1; j < Math.min(lines.length, i + 25); j++) {
            console.log(`  ${j + 1}: ${lines[j]}`);
        }
    }
}
