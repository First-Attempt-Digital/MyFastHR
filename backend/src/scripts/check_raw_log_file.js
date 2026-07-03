const fs = require('fs');
const path = require('path');
const readline = require('readline');

const logFile = path.join(__dirname, '../../biometric_machine_debug.log');

async function checkLogFile() {
    console.log(`=== STREAMING SEARCH RAW LOG FILE FOR CHANDAN (10013) ===`);
    if (!fs.existsSync(logFile)) {
        console.error('Log file biometric_machine_debug.log does not exist!');
        process.exit(1);
    }
    
    const fileStream = fs.createReadStream(logFile);
    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });
    
    const matches = [];
    let lineCount = 0;
    
    for await (const line of rl) {
        lineCount++;
        if (line.includes('10013') || line.includes('10113')) {
            matches.push(line);
        }
    }
    
    console.log(`Total lines read: ${lineCount}`);
    console.log(`Found ${matches.length} matching lines:`);
    for (const match of matches.slice(-25)) { // last 25 matches
        console.log(match);
    }
}

checkLogFile().catch(console.error);
