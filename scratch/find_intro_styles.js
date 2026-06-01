import fs from 'fs';

const cssPath = 'c:/Users/Public/DEV/Multipla/Multipla-astro/src/styles/post-598.css';
const content = fs.readFileSync(cssPath, 'utf8');

const classes = ['9780118', '5c5e8e2', '19c2577', 'd264027'];
const matches = [];

classes.forEach(cls => {
  const re = new RegExp(`\\.elementor-element-${cls}[^{]*\\{([^}]+)\\}`, 'g');
  let match;
  while ((match = re.exec(content)) !== null) {
    matches.push(match[0]);
  }
});

console.log("=== INTRO SECTION CSS ===");
console.log(matches.join("\n\n"));
