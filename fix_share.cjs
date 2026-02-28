// Fix Share button placement in sims that have empty closing div
const fs = require('fs');
const path = require('path');
const PAGES_DIR = path.join(__dirname, 'pages');

// These files had different placeholder patterns
const FIX_FILES = [
    'AutorecloserSim.tsx',
    'FrequencyProtection.tsx',
    'GeneratorProtection.tsx',
    'GroundFaultSim.tsx',
    'PowerSwingSim.tsx',
    'SynchrocheckSim.tsx',
    'TransformerProtection.tsx',
];

let fixed = 0;

FIX_FILES.forEach(file => {
    const filePath = path.join(PAGES_DIR, file);
    let content = fs.readFileSync(filePath, 'utf-8');
    
    // Check if button already exists
    if (content.includes('<Share2 className')) {
        console.log(`SKIP (already has Share button): ${file}`);
        return;
    }
    
    // Pattern: <div className="flex items-center gap-4" /> or similar empty self-closing divs in header
    // Replace with div containing share button
    const patterns = [
        // Common empty self-closing div used as header spacer
        '<div className="flex items-center gap-4" />',
        '<div className="flex items-center gap-3" />',
        '<div className="flex items-center gap-2" />',
        // Also try any empty closing div with classes
    ];
    
    let replaced = false;
    for (const pattern of patterns) {
        if (content.includes(pattern)) {
            content = content.replace(
                pattern,
                '<button onClick={copyShareLink} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-colors" title="Share Simulation"><Share2 className="w-4 h-4"/>Share</button>'
            );
            replaced = true;
            break;
        }
    }
    
    if (!replaced) {
        // Fallback: Add before </header>
        content = content.replace(
            '</header>',
            '<button onClick={copyShareLink} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-colors" title="Share Simulation"><Share2 className="w-4 h-4"/>Share</button></header>'
        );
        console.log(`  FALLBACK (before </header>): ${file}`);
    }
    
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`FIXED: ${file}`);
    fixed++;
});

console.log(`\nDone: ${fixed} fixed`);
