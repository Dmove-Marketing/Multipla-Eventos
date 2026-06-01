import fs from 'fs';

const cssPath = 'c:/Users/Public/DEV/Multipla/Multipla-astro/src/styles/post-598.css';
const content = fs.readFileSync(cssPath, 'utf8');

const regex = /url\([^)]+\)/g;
let match;
const matches = new Set();
while ((match = regex.exec(content)) !== null) {
  matches.add(match[0]);
}

console.log("=== ALL IMAGE URLS IN CSS ===");
console.log(Array.from(matches).join("\n"));
