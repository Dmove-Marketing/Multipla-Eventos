import fs from 'fs';

const cssPath = 'c:/Users/Public/DEV/Multipla/Multipla-astro/src/styles/post-598.css';
const content = fs.readFileSync(cssPath, 'utf8');

const classes = ['5675996', '88d95fb', 'a80ce65', '9417de9'];
const matches = [];

classes.forEach(cls => {
  const re = new RegExp(`\\.elementor-element-${cls}[^{]*\\{([^}]+)\\}`, 'g');
  let match;
  while ((match = re.exec(content)) !== null) {
    matches.push(match[0]);
  }
});

console.log("=== SECTION 7 CSS ===");
console.log(matches.join("\n\n"));
