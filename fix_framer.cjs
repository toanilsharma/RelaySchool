const fs = require('fs');
const path = require('path');

const files = [
    'pages/GroundFaultSim.tsx',
    'pages/FrequencyProtection.tsx',
    'pages/GeneratorProtection.tsx',
    'pages/FastBusTransfer.tsx',
    'pages/BreakerFailure.tsx',
    'pages/BusbarProtection.tsx'
];

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');

    // 1. Add import if not present
    if (!content.includes("from 'framer-motion'")) {
        const importMatch = content.match(/import\s+.*?\s+from\s+['"]lucide-react['"];?/s);
        if (importMatch) {
            content = content.replace(importMatch[0], importMatch[0] + "\nimport { motion, AnimatePresence } from 'framer-motion';");
        } else {
            console.log("Could not find lucide-react import in " + file);
        }
    }

    // 2. Wrap events.map with AnimatePresence
    // Look for: {events.map((e, i) => (<div key={i}...</div>))}
    // Or similar variations
    const mapRegex = /\{events\.map\(\(e,\s*i\)\s*=>\s*\(\s*<div\s+key=\{([^\}]+)\}\s+className=\{([^>]+)\}/g;
    
    // We want to replace <div with <motion.div
    // and wrap the whole {events.map(...)} in <AnimatePresence>
    
    // First, let's see if it's already wrapped
    if (!content.includes('<AnimatePresence>\n                        {events.map') && !content.includes('<AnimatePresence>\r\n                        {events.map') && !content.includes('<AnimatePresence> {events.map')) {
        
        let newContent = content.replace(/\{events\.map\(\s*\(e,\s*i\)\s*=>\s*\([\s\S]*?\)\s*\)\s*\}/g, (match) => {
            if (match.includes('<motion.div')) return match; // already done

            // Add AnimatePresence wrapper
            let wrapped = "<AnimatePresence>\n                            " + match + "\n                        </AnimatePresence>";
            
            // Replace <div key=... with <motion.div key=... initial=... animate=...
            wrapped = wrapped.replace(/<div\s+key=\{([^\}]+)\}\s+className/g, (divMatch, keyVal) => {
                // If the key is just 'i', we should ideally make it unique like 'e.msg + i' or 'i'
                let newKey = keyVal === 'i' ? 'e.msg + i' : keyVal;
                // Exception for object keys, string matching
                if (keyVal.includes('e.type')) newKey = keyVal; 
                
                return `<motion.div \n                                key={${newKey}}\n                                initial={{ opacity: 0, height: 0, marginBottom: 0 }}\n                                animate={{ opacity: 1, height: 'auto', marginBottom: 6 }}\n                                className`;
            });
            wrapped = wrapped.replace(/<\/div>/g, "</motion.div>");
            
            return wrapped;
        });
        
        if (newContent !== content) {
            fs.writeFileSync(file, newContent);
            console.log(`Updated ${file}`);
        } else {
            console.log(`No map replacement made in ${file} (Regex didn't match perfectly)`);
        }
        
    } else {
        console.log(`Already has AnimatePresence in ${file}`);
    }
});
