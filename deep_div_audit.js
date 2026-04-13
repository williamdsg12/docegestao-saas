const fs = require('fs');
const content = fs.readFileSync('d:/app/sistema confeitaria/components/dashboard/profile/ProfileTabs.tsx', 'utf8');
const lines = content.split('\n');

let stack = [];

lines.forEach((line, i) => {
    const lineNum = i + 1;
    // Match <div or </div
    const tagMatches = line.matchAll(/<(\/?)(div)([^>]*?)(\/?)>/g);
    
    for (const m of tagMatches) {
        const isClosing = m[1] === '/';
        const isSelfClosing = m[4] === '/';
        
        if (isSelfClosing) continue;
        
        if (isClosing) {
            if (stack.length === 0) {
                console.log(`Error: Unexpected </div> at line ${lineNum}`);
            } else {
                stack.pop();
            }
        } else {
            stack.push({ line: lineNum, content: line.trim().substring(0, 100) });
        }
    }
});

console.log("\nUnclosed Divs Stack (Path to Error):");
stack.forEach((t, idx) => {
    console.log(`[${idx}] Line ${t.line}: ${t.content}`);
});
