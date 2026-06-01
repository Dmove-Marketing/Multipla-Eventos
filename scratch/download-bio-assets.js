import fs from 'fs';
import path from 'path';
import https from 'https';

const destDir = 'c:\\Users\\Public\\DEV\\Multipla\\Multipla-astro\\src\\assets\\images';

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
  const url = 'https://eventos.multiplaeventos.com.br/wp-content/uploads/2025/10/back-multipla2.avif';
  const destPath = path.join(destDir, 'back-multipla2.avif');
  
  console.log(`Baixando: ${url} -> ${destPath}`);
  try {
    await download(url, destPath);
    console.log('✅ Download concluído com sucesso!');
  } catch (err) {
    console.error('❌ Erro no download:', err.message);
  }
}

run();
