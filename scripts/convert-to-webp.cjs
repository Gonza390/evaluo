const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const publicDir = path.join(__dirname, '..', 'public');

const images = [
  'hero-home-estudiante.png',
  'como-funciona-1.png',
  'como-funciona-2.png',
  'como-funciona-3.png',
  'hero-student-right-v2.png',
  'hero-student-right.png',
  'simulador-resultado-motivacional.png',
  'simulador-resultado.png',
];

async function convert() {
  for (const image of images) {
    const inputPath = path.join(publicDir, image);
    const outputPath = path.join(publicDir, image.replace('.png', '.webp'));

    if (!fs.existsSync(inputPath)) {
      console.log(`Skipping ${image} - not found`);
      continue;
    }

    await sharp(inputPath)
      .webp({ quality: 80 })
      .toFile(outputPath);

    const originalSize = fs.statSync(inputPath).size;
    const webpSize = fs.statSync(outputPath).size;
    const saved = ((1 - webpSize / originalSize) * 100).toFixed(1);

    console.log(`${image} -> ${image.replace('.png', '.webp')} | ${(originalSize / 1024).toFixed(0)}KB -> ${(webpSize / 1024).toFixed(0)}KB (${saved}% saved)`);
  }
}

convert().catch(console.error);
