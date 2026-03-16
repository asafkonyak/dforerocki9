const fs = require('fs');
const path = require('path');

const screensDir = path.join(__dirname, 'src/app/screens');

function walk(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const full = path.join(dir, file);
    if (fs.statSync(full).isDirectory()) walk(full);
    else if (full.endsWith('.tsx')) {
       processFile(full);
    }
  }
}

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');
  
  // We want to find transition={{ ... }} blocks associated with an animate prop that uses an array.
  // Actually, an easier regex:
  // Find transition={{ ..., repeat: Infinity, ... }} and ensure type: 'tween' is in it.
  // We can just find all `transition={{` and replace them IF they have `repeat: Infinity` without `type: 'tween'` or `repeatType: 'reverse'`
  
  // Let's do a simple regex:
  // If we see `transition={{` followed by something containing `repeat: Infinity`, we can inject `type: 'tween', ` right after `transition={{ `
  // Wait, let's just make sure we add it to all repeat: Infinity if not present.
  
  // A regex to match transition={{ ... }} block
  content = content.replace(/transition=\{\{([^}]*)\}\}/g, (match, p1) => {
    if ((p1.includes('repeat: Infinity') || p1.includes('repeat: matchFound ? 0 : Infinity')) && !p1.includes("type: 'tween'") && !p1.includes('type: "tween"') && !p1.includes('repeatType:')) {
      return `transition={{ type: 'tween', ${p1} }}`;
    }
    return match;
  });

  // What about ones with arrays but not repeat: Infinity? 
  // e.g. animate={{ scale: [0, 1.4, 1] }} 
  // It says "any animations using multi-keyframe arrays or repeatType: 'reverse'".
  
  fs.writeFileSync(filePath, content, 'utf-8');
}

walk(screensDir);
console.log('done');
