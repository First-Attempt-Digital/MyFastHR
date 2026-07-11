const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../../../backend/src/services/attendanceService.js');
const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

lines.forEach((line, index) => {
    if (line.trim().startsWith('async checkIn(')) {
        console.log(`Line ${index + 1}: ${line.trim()}`);
        for (let i = index; i <= index + 100; i++) {
            console.log(`  ${i+1}: ${lines[i]}`);
        }
    }
});
