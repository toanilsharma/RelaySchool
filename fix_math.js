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
  
  // Replace {"$...$"} with <InlineMath math="..." />
  // Note: We need to un-escape \\ back to \ so that katex renders it correctly.
  // In JSX {"$\\cos$"}, the string contains \cos. In <InlineMath math="\cos" />, JSX attributes don't double escape.
  // Wait, if it is {"$\\cos$"} in the source file, it's literal string '{\"$...$\"}'
  // If we replace it with `<InlineMath math="..." />`, we should keep the same backslashes if we use curly braces math={'...'}
  // Let's use <InlineMath math={'...'} /> to preserve exact string semantics so we don't have to worry about escaping.
  
  let modified = content.replace(/\{\"\\?\$(.*?)\\?\$\"\}/g, `<InlineMath math={'$1'} />`);
  
  if (modified !== content) {
    // Add import if not exists
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
