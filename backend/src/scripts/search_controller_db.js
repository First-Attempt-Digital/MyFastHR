const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '../controllers/machineController.js');
const content = fs.readFileSync(file, 'utf8');

console.log("=== SEARCHING FOR raw IN machineController.js ===");
const lines = content.split('\n');
for (let i = 0; i < lines.length; i++) {
    if (lines[i].toLowerCase().includes('raw') || lines[i].toLowerCase().includes('insert') || lines[i].toLowerCase().includes('db(')) {
        console.log(`Line ${i + 1}: ${lines[i].trim()}`);
    }
}
