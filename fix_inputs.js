const fs = require('fs');
const path = require('path');

const dir = path.join(process.cwd(), 'pages');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.tsx'));

let totalFixes = 0;

files.forEach(file => {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Only replace <input ... type="number" ... > that lack a 'min=' attribute
  // Basic guard: if it has type="number" and no min=
  const lines = content.split('\n');
  let modified = false;
  
  for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes('<input') && (lines[i].includes('type="number"') || lines[i].includes("type='number'"))) {
          if (!lines[i].includes('min=')) {
              lines[i] = lines[i].replace('type="number"', 'type="number" min="0"');
              modified = true;
              totalFixes++;
          }
      }
  }

  if (modified) {
      fs.writeFileSync(filePath, lines.join('\n'));
  }
});

console.log(`Applied min="0" guard to ${totalFixes} inputs.`);
