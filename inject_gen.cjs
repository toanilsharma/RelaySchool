const fs = require('fs');
const p = 'pages/GeneratorProtection.tsx';
let txt = fs.readFileSync(p, 'utf8');

txt = txt.replace(
    "import { useThemeObserver } from '../hooks/useThemeObserver';",
    "import { useThemeObserver } from '../hooks/useThemeObserver';\nimport { useSmoothedValues } from '../hooks/useSmoothedValues';"
);
txt = txt.replace(
    /const CapabilityCurve = \({ isDark, mw, mvar, trips }: { isDark: boolean; mw: number; mvar: number; trips: string\[\] }\) => \{[\s\S]*?const canvasRef = useRef<HTMLCanvasElement>\(null\);[\s\S]*?useEffect\(\(\) => \{/,
    `const CapabilityCurve = ({ isDark, mw, mvar, trips }: { isDark: boolean; mw: number; mvar: number; trips: string[] }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const smoothed = useSmoothedValues({ mw, mvar });
    useEffect(() => {`
);
txt = txt.replace(
    /const px = cx \+ mw \* scale;\s*const py = cy - mvar \* scale;/g,
    `const px = cx + smoothed.mw * scale;
        const py = cy - smoothed.mvar * scale;`
);
txt = txt.replace(
    /ctx\.fillText\(\`\(\$\{mw\}, \$\{mvar\}\)\`, px \+ 10, py - 8\);/g,
    "ctx.fillText(`(${smoothed.mw.toFixed(0)}, ${smoothed.mvar.toFixed(0)})`, px + 10, py - 8);"
);
txt = txt.replace(
    /\}, \[isDark, mw, mvar, trips\]\);/g,
    "}, [isDark, smoothed, trips]);"
);

fs.writeFileSync(p, txt, 'utf8');
console.log('Fixed GeneratorProtection.tsx');
