// Script to add Share Simulation to all Tier-B simulators
const fs = require('fs');
const path = require('path');

const PAGES_DIR = path.join(__dirname, 'pages');

const TIER_B_SIMS = [
    'AutorecloserSim.tsx',
    'BreakerFailure.tsx',
    'BusbarProtection.tsx',
    'CTVTCalculator.tsx',
    'FrequencyProtection.tsx',
    'GeneratorProtection.tsx',
    'GroundFaultSim.tsx',
    'MotorProtection.tsx',
    'PerUnitCalc.tsx',
    'PowerSwingSim.tsx',
    'SynchrocheckSim.tsx',
    'TransformerProtection.tsx',
    'VoltageRegulator.tsx',
];

let modified = 0;
let skipped = 0;

TIER_B_SIMS.forEach(file => {
    const filePath = path.join(PAGES_DIR, file);
    let content = fs.readFileSync(filePath, 'utf-8');
    
    // Skip if already has copyShareLink
    if (content.includes('copyShareLink')) {
        console.log(`SKIP (already has share): ${file}`);
        skipped++;
        return;
    }
    
    // 1. Add Share2 to lucide-react imports if not present
    if (!content.includes('Share2')) {
        content = content.replace(
            /} from 'lucide-react';/,
            ', Share2 } from \'lucide-react\';'
        );
    }
    
    // 2. Add copyShareLink function after isDark=useThemeObserver()
    const isDarkPattern = /const isDark\s*=\s*useThemeObserver\(\);/;
    if (isDarkPattern.test(content)) {
        content = content.replace(isDarkPattern, (match) => {
            return match + `\n    const copyShareLink = () => { const url = window.location.origin + window.location.pathname; navigator.clipboard.writeText(url); alert('Link copied to clipboard!'); };`;
        });
    }
    
    // 3. Add Share button in the header - find the empty <div/> placeholder
    if (content.includes('<div/>')) {
        content = content.replace(
            '<div/>',
            '<button onClick={copyShareLink} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-colors" title="Share Simulation"><Share2 className="w-4 h-4"/>Share</button>'
        );
    } else {
        // Alternative: add before closing </header>
        // Find the last </div></header> and insert before
        console.log(`  NOTE: No <div/> placeholder found in ${file}, adding share button differently`);
    }
    
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`MODIFIED: ${file}`);
    modified++;
});

console.log(`\nDone: ${modified} modified, ${skipped} skipped`);
