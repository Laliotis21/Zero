// Generates brand placeholder PNGs (no native deps) so the app bundles and ships.
// Dark brand background with a centered accent ring evoking the "0" in ZERØ.
const zlib = require('zlib');
const fs = require('fs');
const path = require('path');

function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return (~c) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crc]);
}

function png(size, draw) {
  const bytesPerPixel = 4;
  const rowLen = size * bytesPerPixel + 1; // +1 filter byte
  const raw = Buffer.alloc(rowLen * size);
  for (let y = 0; y < size; y++) {
    raw[y * rowLen] = 0; // filter: none
    for (let x = 0; x < size; x++) {
      const [r, g, b, a] = draw(x, y);
      const o = y * rowLen + 1 + x * bytesPerPixel;
      raw[o] = r; raw[o + 1] = g; raw[o + 2] = b; raw[o + 3] = a;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;  // bit depth
  ihdr[9] = 6;  // color type RGBA
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// Brand palette
const BG = [11, 12, 16, 255];        // #0B0C10
const ACCENT = [99, 124, 255, 255];  // indigo #637CFF

function ringDraw(size, opts = {}) {
  const transparentBg = opts.transparent;
  const cx = size / 2, cy = size / 2;
  const outer = size * 0.30, inner = size * 0.205;
  const slash = opts.slash !== false;
  return (x, y) => {
    const dx = x - cx, dy = y - cy;
    const d = Math.sqrt(dx * dx + dy * dy);
    // antialiased ring band
    let ring = 0;
    if (d <= outer + 1 && d >= inner - 1) {
      const eOuter = Math.min(1, Math.max(0, outer - d + 0.5));
      const eInner = Math.min(1, Math.max(0, d - inner + 0.5));
      ring = Math.min(eOuter, eInner);
    }
    // diagonal slash through the Ø
    if (slash) {
      const t = Math.abs((dx + dy)) / Math.SQRT2; // distance to line x+y=const through center? use perpendicular
      const distLine = Math.abs(dx - dy) / Math.SQRT2;
      if (distLine < size * 0.022 && d < outer + size * 0.06) {
        ring = Math.max(ring, Math.min(1, (size * 0.022 - distLine) + 0.5));
      }
    }
    if (transparentBg) {
      return [ACCENT[0], ACCENT[1], ACCENT[2], Math.round(255 * ring)];
    }
    const r = Math.round(BG[0] + (ACCENT[0] - BG[0]) * ring);
    const g = Math.round(BG[1] + (ACCENT[1] - BG[1]) * ring);
    const b = Math.round(BG[2] + (ACCENT[2] - BG[2]) * ring);
    return [r, g, b, 255];
  };
}

const outDir = path.resolve(__dirname, '..', 'assets');
fs.mkdirSync(outDir, { recursive: true });

const writes = [
  ['icon.png', png(1024, ringDraw(1024))],
  ['adaptive-icon.png', png(1024, ringDraw(1024, { transparent: true }))], // foreground only
  ['splash.png', png(1284, ringDraw(1284))],
  ['favicon.png', png(48, ringDraw(48))],
];
for (const [name, buf] of writes) {
  fs.writeFileSync(path.join(outDir, name), buf);
  console.log('wrote', name, buf.length, 'bytes');
}
