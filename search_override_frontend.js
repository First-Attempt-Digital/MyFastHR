const fs = require('fs');
const content = fs.readFileSync('d:/MyFastHR(18)/MyFastHR/MyFastHR/frontend/src/pages/leave-attendance/ManualOverride.jsx', 'utf8');
const lines = content.split('\n');
lines.forEach((line, idx) => {
    if (line.toLowerCase().includes('override') || line.toLowerCase().includes('post') || line.toLowerCase().includes('status')) {
        console.log(`${idx + 1}: ${line.trim()}`);
    }
});
