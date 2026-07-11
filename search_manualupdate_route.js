const fs = require('fs');
const content = fs.readFileSync('d:/MyFastHR(18)/MyFastHR/MyFastHR/backend/src/routes/attendanceRoutes.js', 'utf8');
const lines = content.split('\n');
lines.forEach((line, idx) => {
    if (line.includes('manual-update') || line.includes('manual_update')) {
        console.log(`${idx + 1}: ${line}`);
    }
});
