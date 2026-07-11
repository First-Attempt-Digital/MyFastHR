const fs = require('fs');
const content = fs.readFileSync('d:/MyFastHR(18)/MyFastHR/MyFastHR/backend/src/services/machineAttendanceService.js', 'utf8');
const lines = content.split('\n');
lines.forEach((line, idx) => {
    if (line.includes('pending')) {
        console.log(`${idx + 1}: ${line}`);
    }
});
