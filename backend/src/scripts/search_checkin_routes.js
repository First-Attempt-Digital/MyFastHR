const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../../../backend/src/routes/attendanceRoutes.js');
const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

lines.forEach((line, index) => {
    if (line.toLowerCase().includes('check-in') || line.toLowerCase().includes('clock-in') || line.toLowerCase().includes('punch')) {
        console.log(`Line ${index + 1}: ${line.trim()}`);
    }
});
