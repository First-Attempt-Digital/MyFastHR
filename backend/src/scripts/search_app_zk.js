const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '../app.js');
const content = fs.readFileSync(file, 'utf8');

console.log("=== SEARCHING FOR zkteco / zk IN app.js ===");
const lines = content.split('\n');
for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.toLowerCase().includes('zkteco') || line.toLowerCase().includes('zk')) {
        // filter out comments or irrelevant stuff if possible, or just print
        if (line.includes('zkteco') || line.includes('zk_') || line.includes('machine') || line.includes('sync')) {
            console.log(`Line ${i + 1}: ${line.trim()}`);
            for (let j = i + 1; j < Math.min(lines.length, i + 8); j++) {
                console.log(`  ${j + 1}: ${lines[j]}`);
            }
        }
    }
}
