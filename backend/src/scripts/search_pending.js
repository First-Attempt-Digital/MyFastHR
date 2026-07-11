const fs = require('fs');
const path = require('path');

function searchDir(dir, query) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            if (file !== 'node_modules' && file !== '.git') {
                searchDir(fullPath, query);
            }
        } else if (file.endsWith('.js')) {
            const content = fs.readFileSync(fullPath, 'utf8');
            if (content.includes(query) && content.includes('status')) {
                console.log(`Found query & status in: ${fullPath}`);
            }
        }
    }
}

console.log("=== SEARCHING FOR status: pending ===");
searchDir(path.join(__dirname, '..'), 'pending');
