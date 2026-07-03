const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '../services/payrollService.js');
const content = fs.readFileSync(file, 'utf8');

console.log("=== SEARCHING pf_excess_contribution IN payrollService.js ===");
const lines = content.split('\n');

for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.includes('pf_excess_contribution') || line.includes('pfExcess') || line.includes('excess_contribution')) {
        console.log(`Line ${i + 1}: ${line.trim()}`);
        for (let j = i + 1; j < Math.min(lines.length, i + 15); j++) {
            console.log(`  ${j + 1}: ${lines[j]}`);
        }
    }
}
