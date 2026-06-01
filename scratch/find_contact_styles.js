import fs from 'fs';

const cssPath = 'c:/Users/Public/DEV/Multipla/Multipla-astro/src/styles/post-598.css';
const content = fs.readFileSync(cssPath, 'utf8');

const classes = ['5e53b21', '0351609', '5c09842', '27ce1ce'];
const matches = [];

classes.forEach(cls => {
  const re = new RegExp(`\\.elementor-element-${cls}[^{]*\\{([^}]+)\\}`, 'g');
  let match;
  while ((match = re.exec(content)) !== null) {
    matches.push(match[0]);
  }
});

// Adiciona regras gerais de campos de formulário
const formRegexes = [
  /\.elementor-field-textual[^{]*\{([^}]+)\}/g,
  /\.elementor-field[^{]*\{([^}]+)\}/g,
  /\.card-vidro[^{]*\{([^}]+)\}/g
];

formRegexes.forEach(re => {
  let match;
  while ((match = re.exec(content)) !== null) {
    matches.push(match[0]);
  }
});

console.log("=== CONTACT FORM CSS ===");
console.log(matches.join("\n\n"));
