const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '../repositories/attendanceRepository.js');
if (fs.existsSync(file)) {
    const content = fs.readFileSync(file, 'utf8');
    console.log("=== SEARCHING getCompanyMatrix ===");
    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('getCompanyMatrix')) {
            console.log(`Line ${i + 1}: ${lines[i].trim()}`);
        }
    }
} else {
    console.log("File not found:", file);
}
