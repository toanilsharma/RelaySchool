const fs = require('fs');
const content = fs.readFileSync('pages/VectorLab.tsx', 'utf8');

const regex = /<(InlineMath|MathBlock)[^>]+math=\\{(['"`])((?:(?!\\2).)*?)\\2\\}/g;

const fixed = content.replace(regex, (match, tag, quote, inner) => {
    let replaced = '';
    for (let i = 0; i < inner.length; i++) {
        if (inner[i] === '\\' && inner[i+1] !== '\\') {
            replaced += '\\\\';
        } else if (inner[i] === '\\' && inner[i+1] === '\\') {
            replaced += '\\\\';
            i++;
        } else {
            replaced += inner[i];
        }
    }
    return match.replace(inner, replaced);
});

if (content !== fixed) {
    fs.writeFileSync('pages/VectorLab.tsx', fixed, 'utf8');
    console.log('Fixed VectorLab');
} else {
    console.log('Nothing changed in VectorLab');
}
