const fs = require('fs');
const path = require('path');

function searchGeo(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            searchGeo(fullPath);
        } else if (file.endsWith('.jsx') || file.endsWith('.js')) {
            const content = fs.readFileSync(fullPath, 'utf8');
            if (content.includes('navigator.geolocation')) {
                console.log(`Found in: ${fullPath}`);
                // Print some lines around it
                const lines = content.split('\n');
                lines.forEach((line, index) => {
                    if (line.includes('navigator.geolocation')) {
                        console.log(`  Line ${index + 1}: ${line.trim()}`);
                    }
                });
            }
        }
    }
}

const frontendDir = path.join(__dirname, '../../../frontend/src');
searchGeo(frontendDir);
