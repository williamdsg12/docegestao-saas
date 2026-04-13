const fs = require('fs');
const content = fs.readFileSync('d:/app/sistema confeitaria/components/dashboard/profile/ProfileTabs.tsx', 'utf8');
const lines = content.split('\n');

let stack = [];

lines.forEach((line, i) => {
    const lineNum = i + 1;
    const tagMatches = line.matchAll(/<(\/?)(div|motion\.div)([^>]*?)(\/?)>/g);
    
    for (const m of tagMatches) {
        const isClosing = m[1] === '/';
        const tagName = m[2];
        const isSelfClosing = m[4] === '/';
        
        if (isSelfClosing) continue;
        
        if (isClosing) {
            if (stack.length === 0) {
                console.log(`Error: Unexpected closing tag </${tagName}> at line ${lineNum}`);
                continue;
            }
            const last = stack.pop();
            if (last.name !== tagName) {
                console.log(`Mismatch at line ${lineNum}: Expected </${last.name}> (from line ${last.line}), got </${tagName}>`);
            }
        } else {
            stack.push({ name: tagName, line: lineNum });
        }
    }
});

console.log("\nUnclosed tags:");
stack.forEach(t => console.log(`- <${t.name}> at line ${t.line}`));
