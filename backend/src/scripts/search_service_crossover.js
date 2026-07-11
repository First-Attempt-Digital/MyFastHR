const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '../services/attendanceService.js');
const content = fs.readFileSync(file, 'utf8');

console.log("=== SEARCHING FOR CROSSOVER IN attendanceService.js ===");
const lines = content.split('\n');
for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.includes('HOUR') || line.includes('hour <') || line.includes('hour <=')) {
        console.log(`Line ${i + 1}: ${line.trim()}`);
    }
}
