const fs = require('fs');

const content = fs.readFileSync('d:/app/sistema confeitaria/components/dashboard/profile/ProfileTabs.tsx', 'utf8');

const tags = [];
const lines = content.split('\n');

const divRegex = /<(div|motion\.div|Tabs|AnimatePresence|TabsContent|TabsList|TabsTrigger|Button|Input|Switch|Label|Textarea|QRCodeSVG|ChevronRight|RotateCw|Save|Sparkles|Zap|Search|Eye|Clock|Smartphone|Store|User|Palette|Receipt|Globe|Monitor|Smartphone|Smartphone|ExternalLink|Check|Copy|QrCode)/g;

let stack = [];

lines.forEach((line, i) => {
    let match;
    const lineNum = i + 1;
    
    // Simplistic tag extractor
    const tagMatches = line.matchAll(/<(\/?)([a-zA-Z0-9\.]+)([^>]*?)(\/?)>/g);
    
    for (const m of tagMatches) {
        const isClosing = m[1] === '/';
        const tagName = m[2];
        const isSelfClosing = m[4] === '/' || ['Input', 'Switch', 'br', 'img', 'hr'].includes(tagName);
        
        if (isSelfClosing) continue;
        
        if (isClosing) {
            if (stack.length === 0) {
                console.log(`Error: Unexpected closing tag </${tagName}> at line ${lineNum}`);
                continue;
            }
            const last = stack.pop();
            if (last.name !== tagName) {
                console.log(`Mismatch: Expected </${last.name}> (from line ${last.line}), got </${tagName}> at line ${lineNum}`);
            }
        } else {
            stack.push({ name: tagName, line: lineNum, content: line.trim().substring(0, 50) });
        }
    }
});

console.log("\nUnclosed tags at end of file:");
stack.forEach(t => console.log(`- <${t.name}> at line ${t.line}: ${t.content}`));
