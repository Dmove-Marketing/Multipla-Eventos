import fs from 'fs';

const css = fs.readFileSync('c:\\Users\\Public\\DEV\\Multipla\\Multipla-astro\\src\\styles\\post-598.css', 'utf8');
const rx = /url\(['"]?(https?:\/\/[^'"\)]+)['"]?\)/g;
const urls = new Set();
let m;

while ((m = rx.exec(css)) !== null) {
  if (m[1].includes('wp-content/uploads/')) {
    urls.add(m[1]);
  }
}

console.log('FOUND BACKGROUND IMAGES:');
console.log(Array.from(urls));
