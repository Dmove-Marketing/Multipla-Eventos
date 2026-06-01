import fs from 'fs';

const cssPath = 'c:/Users/Public/DEV/Multipla/Multipla-astro/src/styles/post-598.css';
const content = fs.readFileSync(cssPath, 'utf8');

const classes = ['9b91373', '5e83b2e', 'faa5af3'];
const matches = [];

classes.forEach(cls => {
  const re = new RegExp(`\\.elementor-element-${cls}[^{]*\\{([^}]+)\\}`, 'g');
  let match;
  while ((match = re.exec(content)) !== null) {
    matches.push(match[0]);
  }
});

// Adiciona regras genéricas de depoimentos
const testimonialRegexes = [
  /\.elementor-testimonial[^{]*\{([^}]+)\}/g,
  /\.elementor-testimonial__content[^{]*\{([^}]+)\}/g,
  /\.elementor-testimonial__text[^{]*\{([^}]+)\}/g,
  /\.elementor-testimonial__cite[^{]*\{([^}]+)\}/g
];

testimonialRegexes.forEach(re => {
  let match;
  while ((match = re.exec(content)) !== null) {
    matches.push(match[0]);
  }
});

console.log("=== TESTIMONIALS CSS ===");
console.log(matches.join("\n\n"));
