/**
 * PWA ikon üretici — harici bağımlılık kullanmadan PNG yazar.
 * Kullanım: npm run icons
 *
 * Üretilen dosyalar:
 *  - public/icons/icon-192.png
 *  - public/icons/icon-512.png
 *  - public/icons/icon-maskable-512.png (güvenli alan içinde, tam taşan zemin)
 *  - public/icons/apple-touch-icon.png (180x180)
 */
import { deflateSync } from "node:zlib";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const outDir = join(here, "..", "public", "icons");
mkdirSync(outDir, { recursive: true });

/* ------------------------------- PNG encoder ------------------------------ */
const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const typeBuffer = Buffer.from(type, "ascii");
  const crcBuffer = Buffer.alloc(4);
  crcBuffer.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])), 0);
  return Buffer.concat([length, typeBuffer, data, crcBuffer]);
}

function encodePng(width, height, rgba) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y += 1) {
    raw[y * (stride + 1)] = 0; // filter yok
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, y * stride + stride);
  }

  return Buffer.concat([
    signature,
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

/* -------------------------------- Çizim ---------------------------------- */
const ORANGE = [255, 140, 66];
const ORANGE_DARK = [244, 118, 42];
const CREAM = [255, 244, 230];

function insideEllipse(x, y, cx, cy, rx, ry) {
  const dx = (x - cx) / rx;
  const dy = (y - cy) / ry;
  return dx * dx + dy * dy <= 1;
}

/** Yuvarlatılmış kare maskesi (0..1 normalize) */
function insideRoundedSquare(x, y, radius) {
  const r = radius;
  if (x >= r && x <= 1 - r) return true;
  if (y >= r && y <= 1 - r) return true;
  const cx = x < r ? r : 1 - r;
  const cy = y < r ? r : 1 - r;
  return (x - cx) ** 2 + (y - cy) ** 2 <= r * r;
}

function pawAt(x, y, scale = 1) {
  const cx = 0.5;
  const cy = 0.5;
  const px = (x - cx) / scale + cx;
  const py = (y - cy) / scale + cy;

  if (insideEllipse(px, py, 0.5, 0.625, 0.195, 0.155)) return true;
  if (insideEllipse(px, py, 0.295, 0.415, 0.075, 0.095)) return true;
  if (insideEllipse(px, py, 0.425, 0.35, 0.072, 0.094)) return true;
  if (insideEllipse(px, py, 0.575, 0.35, 0.072, 0.094)) return true;
  if (insideEllipse(px, py, 0.705, 0.415, 0.075, 0.095)) return true;
  return false;
}

/**
 * Süper örnekleme ile kenar yumuşatmalı ikon üretir.
 * @param {number} size
 * @param {{maskable?: boolean, rounded?: boolean}} options
 */
function renderIcon(size, { maskable = false, rounded = true } = {}) {
  const scale = 4;
  const big = size * scale;
  const hi = Buffer.alloc(big * big * 4);
  const pawScale = maskable ? 0.78 : 0.86;

  for (let y = 0; y < big; y += 1) {
    for (let x = 0; x < big; x += 1) {
      const nx = (x + 0.5) / big;
      const ny = (y + 0.5) / big;
      const index = (y * big + x) * 4;

      let alpha = 0;
      let color = ORANGE;

      const inShape =
        maskable || !rounded ? true : insideRoundedSquare(nx, ny, 0.235);
      if (inShape) {
        alpha = 255;
        // Hafif dikey degrade
        const t = ny;
        color = [
          Math.round(ORANGE[0] + (ORANGE_DARK[0] - ORANGE[0]) * t * 0.55),
          Math.round(ORANGE[1] + (ORANGE_DARK[1] - ORANGE[1]) * t * 0.55),
          Math.round(ORANGE[2] + (ORANGE_DARK[2] - ORANGE[2]) * t * 0.55),
        ];
        // Ortada yumuşak açık daire
        if (insideEllipse(nx, ny, 0.5, 0.46, 0.37, 0.37)) {
          color = [
            Math.min(255, color[0] + 10),
            Math.min(255, color[1] + 14),
            Math.min(255, color[2] + 16),
          ];
        }
        if (pawAt(nx, ny, pawScale)) {
          color = CREAM;
        }
      }

      hi[index] = color[0];
      hi[index + 1] = color[1];
      hi[index + 2] = color[2];
      hi[index + 3] = alpha;
    }
  }

  // 4x4 kutu bulanıklaştırma ile küçült
  const out = Buffer.alloc(size * size * 4);
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      let r = 0;
      let g = 0;
      let b = 0;
      let a = 0;
      for (let sy = 0; sy < scale; sy += 1) {
        for (let sx = 0; sx < scale; sx += 1) {
          const i = ((y * scale + sy) * big + (x * scale + sx)) * 4;
          const alpha = hi[i + 3] / 255;
          r += hi[i] * alpha;
          g += hi[i + 1] * alpha;
          b += hi[i + 2] * alpha;
          a += hi[i + 3];
        }
      }
      const count = scale * scale;
      const alphaAvg = a / count;
      const alphaFactor = alphaAvg / 255 || 1;
      const o = (y * size + x) * 4;
      out[o] = Math.round(r / count / alphaFactor);
      out[o + 1] = Math.round(g / count / alphaFactor);
      out[o + 2] = Math.round(b / count / alphaFactor);
      out[o + 3] = Math.round(alphaAvg);
    }
  }

  return encodePng(size, size, out);
}

const files = [
  ["icon-192.png", 192, { rounded: true }],
  ["icon-512.png", 512, { rounded: true }],
  ["icon-maskable-512.png", 512, { maskable: true }],
  ["apple-touch-icon.png", 180, { maskable: true }],
];

for (const [name, size, options] of files) {
  const png = renderIcon(size, options);
  const path = join(outDir, name);
  writeFileSync(path, png);
  console.log(`✓ ${name} (${size}x${size}, ${Math.round(png.length / 1024)} KB)`);
}

console.log("PWA ikonları hazır:", outDir);
