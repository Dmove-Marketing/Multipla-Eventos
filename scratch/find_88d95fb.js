import fs from 'fs';

const cssPath = 'c:/Users/Public/DEV/Multipla/Multipla-astro/src/styles/post-598.css';
const content = fs.readFileSync(cssPath, 'utf8');

const regex = /\.elementor-element-88d95fb[^}]*\}/g;
let match;
const matches = [];
while ((match = regex.exec(content)) !== null) {
  matches.push(match[0]);
}

console.log("=== 88d95fb RULES ===");
console.log(matches.join("\n\n"));
