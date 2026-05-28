import fs from 'fs';
import path from 'path';
import https from 'https';

const htmlFile = 'c:\\Users\\Public\\DEV\\Multipla\\Multipla-astro\\_html-originais\\debutantes-v1.html';
const destDir = 'c:\\Users\\Public\\DEV\\Multipla\\Multipla-astro\\src\\assets\\images';

if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}

// Função para baixar uma imagem com suporte a redirecionamentos
function download(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    
    function get(targetUrl) {
      https.get(targetUrl, (response) => {
        if (response.statusCode === 301 || response.statusCode === 302) {
          // Seguir redirecionamento
          get(response.headers.location);
          return;
        }
        if (response.statusCode !== 200) {
          reject(new Error(`Failed to download ${targetUrl}: status code ${response.statusCode}`));
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
    }
    
    get(url);
  });
}

async function run() {
  try {
    const html = fs.readFileSync(htmlFile, 'utf8');
    
    // Regex para achar URLs de imagens (tanto em src como data-thumbnail, srcset, style background-image)
    const imgUrls = new Set();
    
    // 1. Tags <img> src
    const imgRx = /<img[^>]+src=["'](https?:\/\/[^"']+\.(?:jpg|jpeg|png|webp|avif|gif))["']/gi;
    let m;
    while ((m = imgRx.exec(html)) !== null) {
      imgUrls.add(m[1]);
    }
    
    // 2. data-thumbnail nas galerias
    const thumbRx = /data-thumbnail=["'](https?:\/\/[^"']+\.(?:jpg|jpeg|png|webp|avif|gif))["']/gi;
    while ((m = thumbRx.exec(html)) !== null) {
      imgUrls.add(m[1]);
    }
    
    // 3. Imagens em links da galeria (lightbox)
    const hrefRx = /href=["'](https?:\/\/[^"']+\.(?:jpg|jpeg|png|webp|avif|gif))["']/gi;
    while ((m = hrefRx.exec(html)) !== null) {
      if (m[1].includes('wp-content/uploads/')) {
        imgUrls.add(m[1]);
      }
    }

    // 4. Background-image em styles inline ou blocos
    const bgRx = /url\(["']?(https?:\/\/[^"')]+\.(?:jpg|jpeg|png|webp|avif|gif))["']?\)/gi;
    while ((m = bgRx.exec(html)) !== null) {
      imgUrls.add(m[1]);
    }
    
    // 5. data-src ou data-lazy-src
    const dataSrcRx = /data-src=["'](https?:\/\/[^"']+\.(?:jpg|jpeg|png|webp|avif|gif))["']/gi;
    while ((m = dataSrcRx.exec(html)) !== null) {
      imgUrls.add(m[1]);
    }

    console.log(`Encontradas ${imgUrls.size} URLs de imagens únicas no HTML de debutantes.`);
    
    const urls = Array.from(imgUrls);
    let downloadedCount = 0;
    
    for (let i = 0; i < urls.length; i++) {
      const url = urls[i];
      const fileName = url.split('/').pop().split('?')[0];
      const destPath = path.join(destDir, fileName);
      
      if (fs.existsSync(destPath)) {
        console.log(`[${i+1}/${urls.length}] Já existe: ${fileName}`);
        downloadedCount++;
        continue;
      }
      
      try {
        console.log(`[${i+1}/${urls.length}] Baixando: ${url} ...`);
        await download(url, destPath);
        downloadedCount++;
      } catch (err) {
        console.error(`❌ Erro ao baixar ${url}:`, err.message);
      }
    }
    
    console.log(`\n🎉 Concluído! ${downloadedCount}/${urls.length} imagens salvas em src/assets/images/`);
    
  } catch (err) {
    console.error('Erro geral no download:', err);
  }
}

run();
