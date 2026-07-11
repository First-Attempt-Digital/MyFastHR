const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../../../backend/src/services/attendanceService.js');
const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

lines.forEach((line, index) => {
    if (index >= 397 && index <= 600) {
        if (line.includes('location')) {
            console.log(`Line ${index + 1}: ${line.trim()}`);
        }
    }
});
