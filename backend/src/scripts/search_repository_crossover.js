const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '../repositories/attendanceRepository.js');
const content = fs.readFileSync(file, 'utf8');

console.log("=== SEARCHING FOR CROSSOVER IN attendanceRepository.js ===");
const lines = content.split('\n');
for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.includes('HOUR') || line.includes('6') || line.includes('crossover')) {
        console.log(`Line ${i + 1}: ${line.trim()}`);
    }
}
