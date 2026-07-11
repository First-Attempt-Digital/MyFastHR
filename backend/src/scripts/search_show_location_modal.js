const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../../../frontend/src/pages/dashboards/EmployeeDashboard.jsx');
const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

lines.forEach((line, index) => {
    if (line.includes('showLocationModal')) {
        console.log(`Line ${index + 1}: ${line.trim()}`);
    }
});
