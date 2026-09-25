#!/usr/bin/env node
/**
 * Draw the LabVR mark into the PNGs Expo needs.
 *
 *   npm run brand
 *
 * There is no image-processing dependency here on purpose. The mark is defined
 * as geometry in `src/brand/logoGeometry.js`, so rather than checking in a
 * binary and hoping it stays in step with the in-app SVG, this script fills the
 * same outlines with a scanline rasteriser and encodes the result with node's
 * own zlib. Change the geometry, re-run this, and the launcher icon, the splash
 * and the favicon all follow.
 *
 * (No rasteriser was installed on this machine — no rsvg, no ImageMagick, no
 * sharp — which is the other reason this exists.)
 */

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const {
  VIEW,
  BRAND,
  blades,
} = require('../src/brand/logoGeometry');

const OUT = path.join(__dirname, '..', 'assets');

/** Vertical supersampling. 5 sub-scanlines is smooth at every size we emit. */
const SS = 5;

// ---------------------------------------------------------------------------
// Rasteriser
// ---------------------------------------------------------------------------

/**
 * Fill closed polygons into a coverage buffer.
 *
 * Scanline rather than per-pixel point-in-polygon: the latter is O(pixels ×
 * edges), which at 1024² with nine 98-edge blades is billions of operations.
 * This is O(scanlines × edges) and finishes instantly.
 */
function rasterise(polys, size, scale, offset) {
  const cov = new Float32Array(size * size);

  for (const poly of polys) {
    const pts = poly.map(([x, y]) => [x * scale + offset, y * scale + offset]);

    let minY = Infinity;
    let maxY = -Infinity;
    for (const [, y] of pts) {
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
    const y0 = Math.max(0, Math.floor(minY));
    const y1 = Math.min(size - 1, Math.ceil(maxY));

    for (let py = y0; py <= y1; py++) {
      for (let s = 0; s < SS; s++) {
        const sy = py + (s + 0.5) / SS;

        // Where this sub-scanline crosses the outline.
        const xs = [];
        for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
          const [xi, yi] = pts[i];
          const [xj, yj] = pts[j];
          if (yi > sy !== yj > sy) {
            xs.push(xi + ((sy - yi) * (xj - xi)) / (yj - yi));
          }
        }
        if (xs.length < 2) continue;
        xs.sort((a, b) => a - b);

        for (let k = 0; k + 1 < xs.length; k += 2) {
          addSpan(cov, size, py, xs[k], xs[k + 1], 1 / SS);
        }
      }
    }
  }

  for (let i = 0; i < cov.length; i++) if (cov[i] > 1) cov[i] = 1;
  return cov;
}

/** Add `amount` of coverage across [xa, xb) on row `py`, with soft ends. */
function addSpan(cov, size, py, xa, xb, amount) {
  if (xb <= 0 || xa >= size) return;
  const a = Math.max(0, xa);
  const b = Math.min(size, xb);
  if (b <= a) return;

  const first = Math.floor(a);
  const last = Math.ceil(b) - 1;
  const row = py * size;

  if (first === last) {
    cov[row + first] += (b - a) * amount;
    return;
  }
  cov[row + first] += (first + 1 - a) * amount;
  for (let x = first + 1; x < last; x++) cov[row + x] += amount;
  cov[row + last] += (b - last) * amount;
}

// ---------------------------------------------------------------------------
// PNG
// ---------------------------------------------------------------------------

const CRC_TABLE = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();

function crc32(buf) {
  let c = -1;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

/** 8-bit RGBA, non-interlaced. */
function encodePNG(rgba, size) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // colour type: RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  // One filter byte (0 = none) per scanline.
  const stride = size * 4;
  const raw = Buffer.alloc((stride + 1) * size);
  for (let y = 0; y < size; y++) {
    raw[y * (stride + 1)] = 0;
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// ---------------------------------------------------------------------------
// Compose
// ---------------------------------------------------------------------------

function hex(c) {
  return [
    parseInt(c.slice(1, 3), 16),
    parseInt(c.slice(3, 5), 16),
    parseInt(c.slice(5, 7), 16),
  ];
}

/**
 * @param size     square edge, px
 * @param inset    fraction of the edge left clear around the mark
 * @param bg       '#rrggbb' for an opaque icon, or null for transparency
 * @param fg       the mark's colour
 */
function render({ size, inset = 0.14, bg = null, fg = BRAND }) {
  const draw = size * (1 - 2 * inset);
  const scale = draw / VIEW;
  const offset = size * inset;

  const cov = rasterise(blades(), size, scale, offset);

  const [fr, fg_, fb] = hex(fg);
  const [br, bg_, bb] = bg ? hex(bg) : [0, 0, 0];
  const out = Buffer.alloc(size * size * 4);

  for (let i = 0; i < cov.length; i++) {
    const a = cov[i];
    const o = i * 4;
    if (bg) {
      // Composite over an opaque background — iOS rejects an icon with alpha.
      out[o] = Math.round(br + (fr - br) * a);
      out[o + 1] = Math.round(bg_ + (fg_ - bg_) * a);
      out[o + 2] = Math.round(bb + (fb - bb) * a);
      out[o + 3] = 255;
    } else {
      out[o] = fr;
      out[o + 1] = fg_;
      out[o + 2] = fb;
      out[o + 3] = Math.round(a * 255);
    }
  }
  return encodePNG(out, size);
}

function flat(size, colour) {
  const [r, g, b] = hex(colour);
  const out = Buffer.alloc(size * size * 4);
  for (let i = 0; i < size * size; i++) {
    out[i * 4] = r;
    out[i * 4 + 1] = g;
    out[i * 4 + 2] = b;
    out[i * 4 + 3] = 255;
  }
  return encodePNG(out, size);
}

const JOBS = [
  // Launcher icon: opaque, iOS will not accept alpha here.
  ['icon.png', () => render({ size: 1024, inset: 0.14, bg: '#FFFFFF' })],
  // Android adaptive foreground: transparent, and inset hard — the launcher
  // masks it to a circle and animates it, so only the middle ~66% is safe.
  ['android-icon-foreground.png', () => render({ size: 1024, inset: 0.26 })],
  ['android-icon-background.png', () => flat(1024, '#FFFFFF')],
  ['android-icon-monochrome.png', () => render({ size: 1024, inset: 0.26, fg: '#000000' })],
  ['splash-icon.png', () => render({ size: 512, inset: 0.06 })],
  ['favicon.png', () => render({ size: 64, inset: 0.06, bg: '#FFFFFF' })],
];

if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });
for (const [name, make] of JOBS) {
  const buf = make();
  fs.writeFileSync(path.join(OUT, name), buf);
  console.log(`${name.padEnd(30)} ${(buf.length / 1024).toFixed(1)} KB`);
}
