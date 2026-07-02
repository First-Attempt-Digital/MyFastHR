const fs = require('fs');
const path = require('path');

const logFile = path.join(__dirname, '../../../biometric_machine_debug.log');

if (!fs.existsSync(logFile)) {
    console.log('Log file does not exist at:', logFile);
    process.exit(0);
}

const content = fs.readFileSync(logFile, 'utf8');
const lines = content.trim().split('\n');
console.log(`Total lines in log: ${lines.length}`);
console.log('\nLast 20 lines:\n');
lines.slice(-20).forEach(l => console.log(l));

process.exit(0);
