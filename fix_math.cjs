const fs = require('fs');
const path = require('path');

const filesToFix = [
  'pages/VectorLab.tsx',
  'pages/SymComponents.tsx',
  'pages/FastBusTransfer.tsx',
  'pages/DiffSlope.tsx'
];

const basePath = `e:\\GOOGLE AI STUDIO\\RELAYSCHOOL\\RELAYSHOOL UNZIPPED`;

filesToFix.forEach(relPath => {
  const fullPath = path.join(basePath, relPath);
  let content = fs.readFileSync(fullPath, 'utf8');
  
  // Notice that strings are like {"$v(t) = V_{max} \\cos(\\omega t + \\phi)$"}
  // Also we must escape it correctly. Let's just grab everything inside {"$ and $"}
  // and replace it with <InlineMath math={"..."} />
  
  let modified = content.replace(/\{\"\$(.*?)\$\"\}/g, `<InlineMath math={'$1'} />`);
  
  // also handle {"$\\Delta V..."} where there are unescaped backslashes maybe?
  // Let's check diff.
  
  if (modified !== content) {
    if (!modified.includes("import { InlineMath }")) {
      const importStmt = `import { InlineMath } from 'react-katex';\nimport 'katex/dist/katex.min.css';\n`;
      // insert after first import
      modified = modified.replace(/^(import.*?;?\n)/m, `$1${importStmt}`);
    }
    fs.writeFileSync(fullPath, modified, 'utf8');
    console.log(`Updated ${relPath}`);
  } else {
    console.log(`No changes made to ${relPath}`);
  }
});
