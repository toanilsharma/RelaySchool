const fs = require('fs');
const path = require('path');

const basePath = `e:\\GOOGLE AI STUDIO\\RELAYSCHOOL\\RELAYSHOOL UNZIPPED`;

const dirsToScan = ['pages', 'data/learning-modules'];
let filesToFix = [];

dirsToScan.forEach(dir => {
    const fullDir = path.join(basePath, dir);
    if (fs.existsSync(fullDir)) {
        const files = fs.readdirSync(fullDir).filter(f => f.endsWith('.tsx'));
        filesToFix = filesToFix.concat(files.map(f => path.posix.join(dir, f)));
    }
});

let totalUpdated = 0;

filesToFix.forEach(relPath => {
  const fullPath = path.join(basePath, relPath);
  let content = fs.readFileSync(fullPath, 'utf8');
  
  // Replace {"$...$"} with <InlineMath math={'...'} />
  let modified = content.replace(/\{\"\\?\$(.*?)\\?\$\"\}/g, `<InlineMath math={'$1'} />`);
  // also replace {'$...$'}
  modified = modified.replace(/\{\'\\?\$(.*?)\\?\$\'\}/g, `<InlineMath math={'$1'} />`);
  // also replace plain "$...$" if not inside jsx tags sometimes? No too risky. Let's stick to {"$...$"}
  
  if (modified !== content) {
    if (!modified.includes("import { InlineMath }")) {
      const importStmt = `import { InlineMath } from 'react-katex';\nimport 'katex/dist/katex.min.css';\n`;
      modified = modified.replace(/^(import.*?;?\n)/m, `$1${importStmt}`);
    }
    fs.writeFileSync(fullPath, modified, 'utf8');
    totalUpdated++;
    console.log(`Updated KaTeX in ${relPath}`);
  }
});

console.log(`Total files updated: ${totalUpdated}`);
