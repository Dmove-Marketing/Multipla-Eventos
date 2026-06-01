import fs from 'fs';
import path from 'path';
import https from 'https';

const destDir = 'c:\\Users\\Public\\DEV\\Multipla\\Multipla-astro\\src\\assets\\images';

const urls = [
  'https://eventos.multiplaeventos.com.br/wp-content/uploads/2026/04/desktop-multiplaaaa1-copiar.jpg.avif',
  'https://eventos.multiplaeventos.com.br/wp-content/uploads/2026/04/pattern-m-011-1.avif',
  'https://eventos.multiplaeventos.com.br/wp-content/uploads/2026/04/destination-scaled.avif',
  'https://eventos.multiplaeventos.com.br/wp-content/uploads/2026/04/praia.avif',
  'https://eventos.multiplaeventos.com.br/wp-content/uploads/2026/04/igreja-scaled.avif',
  'https://eventos.multiplaeventos.com.br/wp-content/uploads/2026/04/salao.avif',
  'https://eventos.multiplaeventos.com.br/wp-content/uploads/2026/04/castelo-scaled.avif',
  'https://eventos.multiplaeventos.com.br/wp-content/uploads/2026/04/fazenda-scaled.avif',
  'https://eventos.multiplaeventos.com.br/wp-content/uploads/2025/11/DSC05345.avif',
  'https://eventos.multiplaeventos.com.br/wp-content/uploads/2026/04/mobile-multiplaaaa1-copiar.jpg.avif'
];

function download(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download ${url}: status code ${response.statusCode}`));
        return;
      }
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
}

async function run() {
  console.log(`Iniciando download de ${urls.length} imagens...`);
  for (let i = 0; i < urls.length; i++) {
    const url = urls[i];
    const fileName = url.split('/').pop().split('?')[0];
    const destPath = path.join(destDir, fileName);
    
    if (fs.existsSync(destPath)) {
      console.log(`[${i+1}/${urls.length}] Já existe: ${fileName}`);
      continue;
    }
    
    try {
      console.log(`[${i+1}/${urls.length}] Baixando: ${url} ...`);
      await download(url, destPath);
      console.log(`✅ Sucesso: ${fileName}`);
    } catch (err) {
      console.error(`❌ Erro: ${fileName} - ${err.message}`);
    }
  }
  console.log('Concluído!');
}

run();
