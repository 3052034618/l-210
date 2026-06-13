const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const ICON_SIZES = [16, 32, 48, 64, 128, 256];

function createPNG(size) {
  const PRIMARY_R = 30;
  const PRIMARY_G = 58;
  const PRIMARY_B = 95;
  const ACCENT_R = 249;
  const ACCENT_G = 115;
  const ACCENT_B = 22;
  const WHITE_R = 255;
  const WHITE_G = 255;
  const WHITE_B = 255;

  const rawData = [];

  for (let y = 0; y < size; y++) {
    rawData.push(0);
    for (let x = 0; x < size; x++) {
      const cx = size / 2;
      const cy = size / 2;
      const radius = size * 0.45;
      const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);

      let r, g, b, a;

      if (dist > radius) {
        r = 0; g = 0; b = 0; a = 0;
      } else {
        const innerRadius = size * 0.35;
        if (dist < innerRadius) {
          r = ACCENT_R; g = ACCENT_G; b = ACCENT_B; a = 255;
        } else {
          r = PRIMARY_R; g = PRIMARY_G; b = PRIMARY_B; a = 255;
        }

        if (size >= 32) {
          const ballCx = cx - size * 0.05;
          const ballCy = cy - size * 0.02;
          const ballR = size * 0.2;
          const ballDist = Math.sqrt((x - ballCx) ** 2 + (y - ballCy) ** 2);

          if (ballDist < ballR) {
            const lineDist1 = Math.abs(y - ballCy);
            const lineDist2 = Math.abs(
              (y - ballCy) * Math.cos(Math.PI / 3) + (x - ballCx) * Math.sin(Math.PI / 3)
            );
            const lineDist3 = Math.abs(
              (y - ballCy) * Math.cos(-Math.PI / 3) + (x - ballCx) * Math.sin(-Math.PI / 3)
            );

            const lineWidth = Math.max(1, size * 0.02);
            if (lineDist1 < lineWidth || lineDist2 < lineWidth || lineDist3 < lineWidth) {
              r = PRIMARY_R; g = PRIMARY_G; b = PRIMARY_B; a = 255;
            } else {
              r = ACCENT_R; g = ACCENT_G; b = ACCENT_B; a = 255;
            }
          }
        }
      }

      rawData.push(r, g, b, a);
    }
  }

  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  function crc32(buf) {
    let crc = 0xffffffff;
    const table = [];
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) {
        c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      }
      table[n] = c;
    }
    for (let i = 0; i < buf.length; i++) {
      crc = table[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
    }
    return (crc ^ 0xffffffff) >>> 0;
  }

  function makeChunk(type, data) {
    const typeData = Buffer.concat([Buffer.from(type), data]);
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(typeData), 0);
    return Buffer.concat([len, typeData, crc]);
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const rawBuf = Buffer.from(rawData);
  const compressed = zlib.deflateSync(rawBuf);

  return Buffer.concat([
    signature,
    makeChunk('IHDR', ihdr),
    makeChunk('IDAT', compressed),
    makeChunk('IEND', Buffer.alloc(0)),
  ]);
}

function createICO() {
  const pngs = ICON_SIZES.map((size) => ({ size, data: createPNG(size) }));

  const headerSize = 6;
  const entrySize = 16;
  const dirSize = headerSize + entrySize * pngs.length;

  let dataOffset = dirSize;
  const entries = pngs.map(({ size, data }) => {
    const entry = Buffer.alloc(entrySize);
    entry[0] = size === 256 ? 0 : size;
    entry[1] = size === 256 ? 0 : size;
    entry[2] = 0;
    entry[3] = 0;
    entry.writeUInt16LE(1, 4);
    entry.writeUInt16LE(32, 6);
    entry.writeUInt32LE(data.length, 8);
    entry.writeUInt32LE(dataOffset, 12);
    dataOffset += data.length;
    return entry;
  });

  const header = Buffer.alloc(headerSize);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(pngs.length, 4);

  return Buffer.concat([header, ...entries, ...pngs.map((p) => p.data)]);
}

const publicDir = path.join(__dirname, '..', 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

const iconPath = path.join(publicDir, 'icon.ico');
fs.writeFileSync(iconPath, createICO());
console.log(`✅ 图标已生成: ${iconPath}`);
