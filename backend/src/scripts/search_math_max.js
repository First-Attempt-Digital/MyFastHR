const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../../../backend/src/services/payrollService.js');
const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

lines.forEach((line, index) => {
    if (line.includes('Math.max(0')) {
        console.log(`Line ${index + 1}: ${line.trim()}`);
    }
});
