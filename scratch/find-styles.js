import fs from 'fs';

const css = fs.readFileSync('c:\\Users\\Public\\DEV\\Multipla\\Multipla-astro\\src\\styles\\post-598.css', 'utf8');

const selectors = [
  '7a0bac9', // Hero parent
  '25843d6', // Hero child / bg image
  '3b070a5', // Hero button
  '9780118', // Intro section
  '4c8b04d', // Video section
  '9b91373', // Testimonials section
  '5e83b2e', // Testimonials container
  'b93020b', // Styles section
  '677f5fc', // Styles grid
  '84e34f1', // Style 1: Destination
  '35700c4', // Style 2: Praia
  '615b8f1', // Style 3: Igreja
  '0c28e52', // Style 4: City Halls
  '1dc5f59', // Style 5: Castelos
  'c2f1f04', // Style 6: Fazendas
  'd613ea8', // Gallery section
  'e63a0a4', // Gallery grid
  '5675996', // Impecáveis section
  'a80ce65', // Impecáveis grid
  '9417de9', // Impecáveis left text
  '88d95fb', // Impecáveis right image/bg (DSC05345)
  '5e53b21', // Contact section (#contato)
  '5c09842', // Contact glass card
  'bd2d11e', // Footer section
];

selectors.forEach(sel => {
  console.log(`\n=================== SEARCHING SELECTOR: ${sel} ===================`);
  let lastIndex = 0;
  while (true) {
    const idx = css.indexOf(sel, lastIndex);
    if (idx === -1) break;
    
    // Find the surrounding block
    // Search backward for the selector start and forward for the closing brace
    const start = Math.max(0, css.lastIndexOf('}', idx));
    const end = css.indexOf('}', idx);
    if (end !== -1) {
      console.log(css.substring(start + 1, end + 1).trim());
    }
    lastIndex = idx + 1;
  }
});

