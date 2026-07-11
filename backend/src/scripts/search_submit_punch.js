const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../../../frontend/src/pages/dashboards/EmployeeDashboard.jsx');
const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

lines.forEach((line, index) => {
    if (line.includes('submitPunch') || (index >= 450 && index <= 500)) {
        console.log(`Line ${index + 1}: ${line.trim()}`);
    }
});
