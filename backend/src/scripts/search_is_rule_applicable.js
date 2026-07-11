const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '../services/payrollService.js');
const content = fs.readFileSync(file, 'utf8');

console.log("=== SEARCHING FOR isRuleApplicable ===");
const lines = content.split('\n');
for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.includes('function isRuleApplicable') || line.includes('const isRuleApplicable')) {
        console.log(`Line ${i + 1}: ${line.trim()}`);
        for (let j = i + 1; j < Math.min(lines.length, i + 25); j++) {
            console.log(`  ${j + 1}: ${lines[j]}`);
        }
    }
}
