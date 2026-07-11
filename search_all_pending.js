const fs = require('fs');
const path = require('path');

function searchDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            searchDir(fullPath);
        } else if (file.endsWith('.js')) {
            const content = fs.readFileSync(fullPath, 'utf8');
            const lines = content.split('\n');
            lines.forEach((line, idx) => {
                if (line.includes('status') && (line.includes('pending') || line.includes('"pending"') || line.includes("'pending'"))) {
                    console.log(`${fullPath}:${idx + 1}: ${line.trim()}`);
                }
            });
        }
    }
}

searchDir('d:/MyFastHR(18)/MyFastHR/MyFastHR/backend/src');
