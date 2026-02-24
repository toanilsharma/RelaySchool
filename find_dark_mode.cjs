const fs = require('fs');
const path = require('path');
const dir = path.join(process.cwd(), 'pages');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.tsx'));
const issues = [];
for (const file of files) {
  const content = fs.readFileSync(path.join(dir, file), 'utf8');
  const lines = content.split('\n');
  lines.forEach((line, i) => {
    if (
      ((line.includes('bg-white') && !line.includes('dark:bg-')) ||
      (line.includes('bg-slate-50') && !line.includes('dark:bg-')) ||
      (line.includes('bg-slate-100') && !line.includes('dark:bg-')) ||
      (line.includes('text-slate-900') && !line.includes('dark:text-')) || 
      (line.includes('text-slate-800') && !line.includes('dark:text-')))
      && !line.includes('from-') && !line.includes('to-')
    ) {
      issues.push(`${file}:${i + 1}: ${line.trim()}`);
    }
  });
}
fs.writeFileSync('dark_mode_issues.txt', issues.join('\n'));
console.log('Done, found ' + issues.length + ' issues.');
