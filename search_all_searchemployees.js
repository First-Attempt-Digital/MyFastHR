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
            if (content.includes('searchEmployees')) {
                console.log(`${fullPath}`);
            }
        }
    }
}

searchDir('d:/MyFastHR(18)/MyFastHR/MyFastHR/backend/src');
