import fs from 'fs';

const cssPath = 'c:/Users/Public/DEV/Multipla/Multipla-astro/src/styles/post-598.css';
const content = fs.readFileSync(cssPath, 'utf8');

const classes = ['bd2d11e', 'a3136f5', '91be808', '65ee710', '38a6ad9'];
const matches = [];

classes.forEach(cls => {
  const re = new RegExp(`\\.elementor-element-${cls}[^{]*\\{([^}]+)\\}`, 'g');
  let match;
  while ((match = re.exec(content)) !== null) {
    matches.push(match[0]);
  }
});

console.log("=== FOOTER CSS ===");
console.log(matches.join("\n\n"));
