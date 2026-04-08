const fs = require('fs');
const path = require('path');

const baseDir = 'd:/app/sistema confeitaria';

function findPolicies(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            if (file !== 'node_modules' && file !== '.next') {
                findPolicies(fullPath);
            }
        } else if (file.endsWith('.sql')) {
            const content = fs.readFileSync(fullPath, 'utf8');
            const lines = content.split('\n');
            lines.forEach((line, i) => {
                if (line.toLowerCase().includes('policy') && line.toLowerCase().includes('profiles')) {
                    console.log(`${fullPath}:${i+1}: ${line.trim()}`);
                }
            });
        }
    }
}

findPolicies(baseDir);
