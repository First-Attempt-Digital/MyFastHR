const fs = require('fs');
const path = require('path');

const logFile = path.join(__dirname, '../../biometric_machine_debug.log');

function checkLogFile() {
    console.log(`=== SEARCHING RAW LOG FILE FOR CHANDAN (10013) ===`);
    if (!fs.existsSync(logFile)) {
        console.error('Log file biometric_machine_debug.log does not exist!');
        process.exit(1);
    }
    
    const content = fs.readFileSync(logFile, 'utf8');
    const lines = content.split('\n');
    console.log(`Total lines in log file: ${lines.length}`);
    
    const matches = [];
    for (const line of lines) {
        if (line.includes('10013') || line.includes('10013') || line.includes('10113')) {
            matches.push(line);
        }
    }
    
    console.log(`Found ${matches.length} matching lines:`);
    for (const match of matches.slice(-15)) { // last 15 matches
        console.log(match);
    }
}

checkLogFile();
