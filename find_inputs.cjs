const fs = require('fs');
const path = require('path');

const dir = path.join(process.cwd(), 'pages');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.tsx'));
const issues = [];

files.forEach(file => {
  const content = fs.readFileSync(path.join(dir, file), 'utf8');
  const lines = content.split('\n');
  lines.forEach((line, i) => {
    if (line.includes('<input') && (line.includes('type="number"') || line.includes("type='number'"))) {
      if (!line.includes('min=') || !line.includes('max=')) {
        issues.push(`${file}:${i + 1}: ${line.trim()}`);
      }
    }
  });
});

fs.writeFileSync('input_validation_issues.txt', issues.join('\n'));
console.log(`Found ${issues.length} number inputs missing min/max bounds.`);
