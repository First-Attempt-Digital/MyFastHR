const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '../services/payrollService.js');
const content = fs.readFileSync(file, 'utf8');

console.log("=== LISTING METHODS IN payrollService.js ===");
const lines = content.split('\n');
for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.includes('async ') && (line.includes('(') || line.includes('='))) {
        console.log(`Line ${i + 1}: ${line.trim()}`);
    }
}
