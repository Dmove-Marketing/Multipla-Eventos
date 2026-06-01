import fs from 'fs';
import path from 'path';

const cssPath = 'c:/Users/Public/DEV/Multipla/Multipla-astro/src/styles/post-598.css';
const content = fs.readFileSync(cssPath, 'utf8');

// Procura por 3b070a5 (botão hero) e 7a0bac9 (hero parent)
const matches = [];
const regexes = [
  /\.elementor-element-3b070a5[^{]*\{([^}]+)\}/g,
  /\.elementor-element-7a0bac9[^{]*\{([^}]+)\}/g,
  /\.elementor-element-25843d6[^{]*\{([^}]+)\}/g
];

regexes.forEach(re => {
  let match;
  while ((match = re.exec(content)) !== null) {
    matches.push(match[0]);
  }
});

console.log("=== ENCONTRADOS ===");
console.log(matches.join("\n\n"));
