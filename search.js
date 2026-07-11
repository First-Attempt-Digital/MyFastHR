const fs = require('fs');
const content = fs.readFileSync('d:/MyFastHR(18)/MyFastHR/MyFastHR/frontend/src/pages/leave-attendance/AttendanceMuster.jsx', 'utf8');
const lines = content.split('\n');
lines.forEach((line, idx) => {
    if (line.includes('handleRequestAction')) {
        console.log(`${idx + 1}: ${line}`);
    }
});
