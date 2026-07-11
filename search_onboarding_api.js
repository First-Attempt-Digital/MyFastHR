const fs = require('fs');
const content = fs.readFileSync('d:/MyFastHR(18)/MyFastHR/MyFastHR/frontend/src/pages/Onboarding.jsx', 'utf8');
const lines = content.split('\n');
lines.forEach((line, idx) => {
    if (line.includes('api') || line.includes('submit') || line.includes('save') || line.includes('formData')) {
        console.log(`${idx + 1}: ${line.trim()}`);
    }
});
