const fs = require('fs');
const path = require('path');

const basePath = 'e:/GOOGLE AI STUDIO/RELAYSCHOOL/RELAYSHOOL UNZIPPED';
const dirs = ['pages', 'data/learning-modules'];

let fixCount = 0;

function escapeLatexString(str) {
    let res = '';
    for (let j = 0; j < str.length; j++) {
        if (str[j] === '\\') {
            if (str[j + 1] === '\\') {
                res += '\\\\';
                j++; // skip the second slash
            } else {
                res += '\\\\'; // double the single slash
            }
        } else {
            res += str[j];
        }
    }
    return res;
}

function processDirectory(dirPath) {
    if (!fs.existsSync(dirPath)) return;
    
    const items = fs.readdirSync(dirPath);
    for (const item of items) {
        const fullPath = path.join(dirPath, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
            processDirectory(fullPath);
        } else if (item.endsWith('.tsx') || item.endsWith('.ts')) {
            const lines = fs.readFileSync(fullPath, 'utf8').split('\n');
            let modified = false;

            for (let i = 0; i < lines.length; i++) {
                let line = lines[i];

                if (line.includes('<InlineMath math={') || line.includes('<MathBlock formula=')) {
                    line = line.replace(/(math|formula)=\{(['"`])(.*?)\2\}/g, (match, prop, quote, inner) => {
                        const fixed = escapeLatexString(inner);
                        if (fixed !== inner) modified = true;
                        return `${prop}={${quote}${fixed}${quote}}`;
                    });
                    
                    line = line.replace(/(formula)=(['"`])(.*?)\2/g, (match, prop, quote, inner) => {
                        const fixed = escapeLatexString(inner);
                        if (fixed !== inner) modified = true;
                        return `${prop}=${quote}${fixed}${quote}`;
                    });
                }
                
                // ALSO fix <InlineMath math={"string"} /> without braces, sometimes people write it
                if (line.includes('<InlineMath math="')) {
                    line = line.replace(/math="([^"]*)"/g, (match, inner) => {
                        const fixed = escapeLatexString(inner);
                        if (fixed !== inner) modified = true;
                        return `math="${fixed}"`;
                    });
                }

                lines[i] = line;
            }

            if (modified) {
                fs.writeFileSync(fullPath, lines.join('\n'), 'utf8');
                fixCount++;
                console.log('Fixed', item);
            }
        }
    }
}

for (const dir of dirs) {
    processDirectory(path.join(basePath, dir));
}

console.log('Total files fixed:', fixCount);
