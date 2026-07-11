const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../../../backend/src/services/attendanceService.js');
const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

lines.forEach((line, index) => {
    if (index >= 397 && index <= 700) {
        if (line.includes('location.') || line.includes('latitude') || line.includes('longitude') || line.includes('accuracy') || line.includes('remarks') || line.includes('punch_location')) {
            console.log(`Line ${index + 1}: ${line.trim()}`);
        }
    }
});
