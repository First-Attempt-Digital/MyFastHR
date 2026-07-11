const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '../app.js');
const content = fs.readFileSync(file, 'utf8');

console.log("=== SEARCHING IN app.js FOR biometric_raw_logs ===");
const lines = content.split('\n');
for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('biometric_raw_logs')) {
        console.log(`Line ${i+1}: ${lines[i].trim()}`);
    }
}
