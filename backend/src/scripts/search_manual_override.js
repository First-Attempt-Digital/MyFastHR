const fs = require('fs');
const path = require('path');

const files = [
    path.join(__dirname, '../app.js'),
    path.join(__dirname, '../controllers/attendanceController.js'),
    path.join(__dirname, '../services/attendanceService.js'),
    path.join(__dirname, '../repositories/attendanceRepository.js')
];

console.log("=== SEARCHING FOR MANUAL OVERRIDE LOGIC ===");
for (const file of files) {
    if (fs.existsSync(file)) {
        const content = fs.readFileSync(file, 'utf8');
        const lines = content.split('\n');
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            if (line.toLowerCase().includes('override') || line.toLowerCase().includes('manual') || line.toLowerCase().includes('request_type') || line.toLowerCase().includes('attendance_entry_requests')) {
                console.log(`${path.basename(file)}:${i+1}: ${line.trim()}`);
            }
        }
    }
}
