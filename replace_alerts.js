const fs = require('fs');
const path = require('path');

const dir = 'e:/GOOGLE AI STUDIO/RELAYSCHOOL/RELAYSHOOL UNZIPPED/pages';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.tsx'));

for (const file of files) {
    const fullPath = path.join(dir, file);
    let content = fs.readFileSync(fullPath, 'utf8');
    
    if (content.includes("alert(")) {
        // Success matches
        content = content.replace(/alert\(['"]([^'"]*copied[^'"]*)['"]\);?/g, "toast.success('$1');");
        // Error matches
        content = content.replace(/alert\(['"]([^'"]*failed|[^'"]*Fail|[^'"]*Please[^'"]*|[^'"]*SAFETY[^'"]*|[^'"]*already[^'"]*)['"]\);?/gi, "toast.error('$1');");
        // Catch remaining
        content = content.replace(/alert\(['"](.*)['"]\);?/g, "toast.info('$1');");

        if (!content.includes("import { toast }")) {
            let lines = content.split('\n');
            let importIndex = 0;
            for (let i = lines.length - 1; i >= 0; i--) {
                if (lines[i].startsWith('import ')) {
                    importIndex = i + 1;
                    break;
                }
            }
            lines.splice(importIndex, 0, "import { toast } from '../components/Toast';");
            content = lines.join('\n');
        }
        
        fs.writeFileSync(fullPath, content);
        console.log('Updated', file);
    }
}
