const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'fix_all_july2_errors.js');
const content = fs.readFileSync(file, 'utf8');

console.log("=== CHECKING FOR emp. SHIFT PROPS ===");
const lines = content.split('\n');
for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.includes('emp.start_time') || line.includes('emp.end_time') || line.includes('emp.grace_period') || line.includes('emp.terminate_hour') || line.includes('emp.session1_in_margin')) {
        console.log(`Line ${i + 1}: ${line.trim()}`);
    }
}
