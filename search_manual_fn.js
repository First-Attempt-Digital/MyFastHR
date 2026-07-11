const fs = require('fs');
const content = fs.readFileSync('d:/MyFastHR(18)/MyFastHR/MyFastHR/backend/src/services/attendanceService.js', 'utf8');
const lines = content.split('\n');
lines.forEach((line, idx) => {
    if (line.includes('manual') || line.includes('Manual')) {
        console.log(`${idx + 1}: ${line}`);
    }
});
