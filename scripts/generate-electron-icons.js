import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

function createPNG(width, height) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  function chunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const typeBuf = Buffer.from(type);
    const crcVal = crc32(Buffer.concat([typeBuf, data]));
    const crcBuf = Buffer.alloc(4);
    crcBuf.writeInt32BE(crcVal, 0);
    return Buffer.concat([len, typeBuf, data, crcBuf]);
  }

  // IHDR
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // bit depth
  ihdrData[9] = 6; // color type: RGBA
  ihdrData[10] = 0; // compression
  ihdrData[11] = 0; // filter
  ihdrData[12] = 0; // interlace
  const ihdr = chunk('IHDR', ihdrData);

  // Scanlines with filter byte 0
  const rawData = Buffer.alloc(height * (width * 4 + 1));
  let offset = 0;

  const cornerRadius = width * 0.22; // rounded square app icon

  for (let y = 0; y < height; y++) {
    rawData[offset++] = 0; // filter type 0 (none)
    for (let x = 0; x < width; x++) {
      // Check rounded corner mask
      let inside = true;
      let alpha = 255;

      const dx = Math.min(x, width - 1 - x);
      const dy = Math.min(y, height - 1 - y);

      if (dx < cornerRadius && dy < cornerRadius) {
        const dist = Math.hypot(cornerRadius - dx, cornerRadius - dy);
        if (dist > cornerRadius) {
          inside = false;
          alpha = 0;
        } else if (dist > cornerRadius - 1.5) {
          alpha = Math.max(0, Math.min(255, Math.round((cornerRadius - dist) * 170)));
        }
      }

      if (!inside || alpha === 0) {
        rawData[offset++] = 0;
        rawData[offset++] = 0;
        rawData[offset++] = 0;
        rawData[offset++] = 0;
        continue;
      }

      // Center Flame/H symbol coordinates
      const cx = width / 2;
      const cy = height / 2;
      const distFromCenter = Math.hypot(x - cx, y - cy);

      // Base background: Habix indigo-to-purple gradient
      const gradRatio = (x + y) / (width + height);
      let r = Math.round(99 + 130 * gradRatio);
      let g = Math.round(102 - 30 * gradRatio);
      let b = Math.round(241 - 40 * gradRatio);

      // Stylized flame / core glow in the center
      if (distFromCenter < width * 0.28) {
        const glow = 1 - distFromCenter / (width * 0.28);
        r = Math.min(255, Math.round(r + glow * 80));
        g = Math.min(255, Math.round(g + glow * 120));
        b = Math.min(255, Math.round(b + glow * 40));
      }

      rawData[offset++] = r;
      rawData[offset++] = g;
      rawData[offset++] = b;
      rawData[offset++] = alpha;
    }
  }

  const compressed = zlib.deflateSync(rawData);
  const idat = chunk('IDAT', compressed);
  const iend = chunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdr, idat, iend]);
}

// CRC32 table
const crcTable = [];
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  crcTable[n] = c;
}

function crc32(buf) {
  let crc = -1;
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ crcTable[(crc ^ buf[i]) & 0xff];
  }
  return crc ^ -1;
}

function createICO(pngBuffer) {
  // ICONDIR header (6 bytes)
  const iconDir = Buffer.alloc(6);
  iconDir.writeUInt16LE(0, 0); // reserved
  iconDir.writeUInt16LE(1, 2); // 1 = ICO
  iconDir.writeUInt16LE(1, 4); // 1 image

  // ICONDIRENTRY (16 bytes)
  const iconDirEntry = Buffer.alloc(16);
  iconDirEntry.writeUInt8(0, 0); // width: 0 = 256px
  iconDirEntry.writeUInt8(0, 1); // height: 0 = 256px
  iconDirEntry.writeUInt8(0, 2); // color count
  iconDirEntry.writeUInt8(0, 3); // reserved
  iconDirEntry.writeUInt16LE(1, 4); // color planes
  iconDirEntry.writeUInt16LE(32, 6); // bits per pixel
  iconDirEntry.writeUInt32LE(pngBuffer.length, 8); // image size in bytes
  iconDirEntry.writeUInt32LE(22, 12); // offset: 6 + 16 = 22

  return Buffer.concat([iconDir, iconDirEntry, pngBuffer]);
}

// Generate 256x256 PNG and ICO
const png256 = createPNG(256, 256);
const icoData = createICO(png256);

// Ensure build and electron directories exist
['build', 'electron', 'public'].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

fs.writeFileSync(path.resolve('build/icon.png'), png256);
fs.writeFileSync(path.resolve('build/icon.ico'), icoData);
fs.writeFileSync(path.resolve('electron/icon.png'), png256);
fs.writeFileSync(path.resolve('electron/icon.ico'), icoData);
fs.writeFileSync(path.resolve('public/icon.ico'), icoData);

console.log('Electron icons (256x256 PNG & ICO) generated successfully!');
