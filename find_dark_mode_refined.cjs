const fs = require('fs');
const path = require('path');
const dir = path.join(process.cwd(), 'pages');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.tsx'));
const issues = [];
for (const file of files) {
  const content = fs.readFileSync(path.join(dir, file), 'utf8');
  const lines = content.split('\n');
  lines.forEach((line, i) => {
    // Ignore lines that handle it with JS condition `isDark`
    if (line.includes('isDark')) return;
    
    // Ignore opacity variants like bg-white/20
    if (line.includes('bg-white/') || line.includes('bg-slate-50/') || line.includes('bg-slate-100/')) return;
    
    // Must contain the actual problematic hardcoded term
    const hasLightBg = line.includes('bg-white') || line.match(/bg-slate-(50|100)\b/);
    const hasLightText = line.match(/text-slate-(900|800)\b/);
    
    if (!hasLightBg && !hasLightText) return;

    // Check if it has a dark equivalent (either dark:bg-, dark:text-, or dark:hover:)
    const hasDarkBg = line.includes('dark:bg-');
    const hasDarkText = line.includes('dark:text-') || line.includes('dark:hover:text-');
    const hasDarkBorder = line.includes('dark:border-');
    const hasDarkVariant = hasDarkBg || hasDarkText || hasDarkBorder || line.includes('dark:hover:bg-');

    if (!hasDarkVariant && !line.includes('from-') && !line.includes('to-')) {
      issues.push(`${file}:${i + 1}: ${line.trim()}`);
    }
  });
}
fs.writeFileSync('dark_mode_issues_refined.txt', issues.join('\n'));
console.log('Refined script done, found ' + issues.length + ' issues.');
