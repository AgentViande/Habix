import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import pngToIcoModule from 'png-to-ico';

const pngToIco = pngToIcoModule.default || pngToIcoModule;

async function generateIcons() {
  const svgPath = path.resolve('src/assets/logo.svg');
  if (!fs.existsSync(svgPath)) {
    throw new Error(`SVG source not found at: ${svgPath}`);
  }

  const svgBuffer = fs.readFileSync(svgPath);

  // Ensure directories exist
  ['build', 'electron', 'public', 'public/icons'].forEach((dir) => {
    const fullDir = path.resolve(dir);
    if (!fs.existsSync(fullDir)) {
      fs.mkdirSync(fullDir, { recursive: true });
    }
  });

  console.log('Generating PNGs at multiple resolutions from logo.svg...');

  // Generate 512x512 master PNG
  const png512 = await sharp(svgBuffer).resize(512, 512).png().toBuffer();
  // Generate 192x192 PNG for PWA
  const png192 = await sharp(svgBuffer).resize(192, 192).png().toBuffer();

  // Multi-size buffers for ICO (16, 32, 48, 64, 128, 256)
  const icoSizes = [16, 32, 48, 64, 128, 256];
  const icoPngBuffers = await Promise.all(
    icoSizes.map((size) => sharp(svgBuffer).resize(size, size).png().toBuffer())
  );

  console.log('Generating multi-size ICO (16, 32, 48, 64, 128, 256)...');
  const icoBuffer = await pngToIco(icoPngBuffers);

  // Write files
  fs.writeFileSync(path.resolve('build/icon.png'), png512);
  fs.writeFileSync(path.resolve('build/icon.ico'), icoBuffer);
  fs.writeFileSync(path.resolve('electron/icon.png'), png512);
  fs.writeFileSync(path.resolve('electron/icon.ico'), icoBuffer);

  fs.writeFileSync(path.resolve('public/icon.ico'), icoBuffer);
  fs.writeFileSync(path.resolve('public/favicon.ico'), icoBuffer);
  fs.writeFileSync(path.resolve('public/favicon.svg'), svgBuffer);

  fs.writeFileSync(path.resolve('public/icons/icon-512.png'), png512);
  fs.writeFileSync(path.resolve('public/icons/icon-512-maskable.png'), png512);
  fs.writeFileSync(path.resolve('public/icons/icon-192.png'), png192);

  console.log('✅ All icons generated successfully:');
  console.log('  - build/icon.png (512x512)');
  console.log('  - build/icon.ico (16, 32, 48, 64, 128, 256)');
  console.log('  - electron/icon.png & electron/icon.ico');
  console.log('  - public/favicon.svg & public/favicon.ico');
  console.log('  - public/icons/icon-192.png, icon-512.png, icon-512-maskable.png');
}

generateIcons().catch((err) => {
  console.error('❌ Error generating icons:', err);
  process.exit(1);
});
