import fs from 'fs';

const files = [
  'src/pages/index.astro',
  'src/styles/index.css'
];

const forbidden = [
  'wp-content',
  'elementor',
  'wp-includes',
  'hello-elementor',
  'wp-singular'
];

let failed = false;

files.forEach(file => {
  console.log(`\nAuditando: ${file}`);
  if (!fs.existsSync(file)) {
    console.error(`❌ Arquivo não existe: ${file}`);
    failed = true;
    return;
  }
  
  const content = fs.readFileSync(file, 'utf8');
  let fileFailed = false;
  
  forbidden.forEach(str => {
    // Escape string for regex
    const regex = new RegExp(str, 'gi');
    let match;
    while ((match = regex.exec(content)) !== null) {
      console.error(`❌ String proibida encontrada: "${str}" na posição ${match.index}`);
      fileFailed = true;
      failed = true;
    }
  });
  
  if (!fileFailed) {
    console.log(`✅ Nenhum termo proibido encontrado em ${file}!`);
  }
});

if (failed) {
  process.exit(1);
} else {
  console.log('\n🎉 AUDITORIA PASSO 4 CONCLUÍDA: 0% WORDPRESS DETECTADO! 100% CLEAN-ROOM!');
}
