const fs = require('fs');
const path = require('path');
const p = 'e:/GOOGLE AI STUDIO/RELAYSCHOOL/RELAYSHOOL UNZIPPED';
let found = 0;
function scan(d) {
  const dirPath = path.join(p, d);
  const items = fs.readdirSync(dirPath);
  for(let x of items) {
    const xp = path.join(dirPath, x);
    if(fs.statSync(xp).isDirectory()) {
      scan(path.join(d, x));
    } else if(x.endsWith('.tsx') || x.endsWith('.ts')) {
      let content = fs.readFileSync(xp, 'utf8');
      if(content.includes('math=\\'') || content.includes('math=\\"')) {
         const lines = content.split('\\n');
         let broke = false;
         for(let i=0; i<lines.length; i++) {
           if((lines[i].includes('math=\\'') || lines[i].includes('math=\\"')) && lines[i].includes('\\\\') && !lines[i].includes('\\\\\\\\')) {
             console.log(d + '/' + x + ':' + (i+1) + ' -> ' + lines[i].trim());
             broke = true;
           }
         }
         if(broke) found++;
      }
    }
  }
}
scan('pages');
scan('data/learning-modules');
console.log('Total broken files:', found);
