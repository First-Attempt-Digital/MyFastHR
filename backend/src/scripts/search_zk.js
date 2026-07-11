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
        } else if (file.endsWith('.js') || file.endsWith('.py') || file.endsWith('.sh')) {
            const content = fs.readFileSync(fullPath, 'utf8');
            if (content.toLowerCase().includes(query.toLowerCase())) {
                console.log(`Found "${query}" in: ${fullPath}`);
            }
        }
    }
}

console.log("=== SEARCHING FOR zkteco / zk ===");
searchDir(path.join(__dirname, '../..'), 'zkteco');
searchDir(path.join(__dirname, '../..'), 'zk');
