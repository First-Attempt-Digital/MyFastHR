const fs = require('fs');
const path = require('path');

function searchDir(dir, patterns) {
    try {
        const files = fs.readdirSync(dir);
        for (const file of files) {
            const fullPath = path.join(dir, file);
            try {
                const stat = fs.statSync(fullPath);
                if (stat.isDirectory()) {
                    searchDir(fullPath, patterns);
                } else if (file.endsWith('.js')) {
                    const content = fs.readFileSync(fullPath, 'utf8');
                    if (patterns.some(p => content.includes(p))) {
                        const lines = content.split('\n');
                        lines.forEach((line, idx) => {
                            if (patterns.some(p => line.includes(p))) {
                                console.log(`${fullPath}:${idx+1}: ${line.trim()}`);
                            }
                        });
                    }
                }
            } catch(e) {}
        }
    } catch(e) {}
}

searchDir('d:/MyFastHR(18)/MyFastHR/MyFastHR/backend/src', ['pf_number', 'uan_number', 'include_pf', 'pf_excess', 'pf_contribution']);
