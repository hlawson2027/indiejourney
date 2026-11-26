// Builds a lookbook mood board from products already on the site.
//
//   node scripts/moodboard.mjs <config.json> <out.jpg>
//
// config.json:
//   { "bg": "#EFE6DA",
//     "items": [ { "product": "copper-chunky-knit-throw", "fit": "cover", "cols": 2, "rows": 2 }, ... ] }
//
// Items fill a 3-column grid (1200 x 1500) in order, each taking cols x rows cells,
// packed like CSS grid "dense". The total number of cells should be a multiple of 3.
// Images come from each product's image_url (Walmart / Zazzle only; never Amazon).
// Writes the board JPG and prints JSON with each tile's centre in % of the board.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import sharp from 'sharp';
import { parse as parseYaml } from 'yaml';

const [cfgPath, outPath] = process.argv.slice(2);
if (!cfgPath || !outPath) {
  console.error('usage: node scripts/moodboard.mjs <config.json> <out.jpg>');
  process.exit(1);
}
const cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
const W = 1200, H = 1500, PAD = 56, GAP = 20, COLS = 3, RADIUS = 18;
const items = cfg.items.map((it) => ({ fit: 'cover', cols: 1, rows: 1, ...it }));
const cells = items.reduce((n, it) => n + it.cols * it.rows, 0);
const ROWS = Math.ceil(cells / COLS);

// Dense packing on a COLS x ROWS grid.
const grid = Array.from({ length: ROWS }, () => Array(COLS).fill(false));
const fits = (r, c, it) => {
  if (c + it.cols > COLS || r + it.rows > ROWS) return false;
  for (let y = r; y < r + it.rows; y++) for (let x = c; x < c + it.cols; x++) if (grid[y][x]) return false;
  return true;
};
for (const it of items) {
  outer: for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
    if (fits(r, c, it)) {
      for (let y = r; y < r + it.rows; y++) for (let x = c; x < c + it.cols; x++) grid[y][x] = true;
      it.r = r; it.c = c;
      break outer;
    }
  }
  if (it.r === undefined) throw new Error(`No room for ${it.product}; check cols/rows`);
}

const cw = (W - 2 * PAD - (COLS - 1) * GAP) / COLS;
const ch = (H - 2 * PAD - (ROWS - 1) * GAP) / ROWS;
const tmp = fs.mkdtempSync('/tmp/moodboard-');
const composites = [];
const spots = [];

for (const it of items) {
  const file = path.join('src/content/products', `${it.product}.md`);
  const fm = parseYaml(fs.readFileSync(file, 'utf8').match(/^---\r?\n([\s\S]*?)\r?\n---/)[1]);
  const url = fm.image_url;
  if (!url) throw new Error(`${it.product} has no image_url`);
  if (/media-amazon|amazon\./.test(url)) throw new Error(`${it.product} is an Amazon image; not allowed on boards`);
  const img = path.join(tmp, `${it.product}.img`);
  execFileSync('curl', ['-sL', '--max-time', '30', '-o', img, url]);
  const x = Math.round(PAD + it.c * (cw + GAP));
  const y = Math.round(PAD + it.r * (ch + GAP));
  const w = Math.round(it.cols * cw + (it.cols - 1) * GAP);
  const h = Math.round(it.rows * ch + (it.rows - 1) * GAP);
  const pic = await sharp(img)
    .resize(w, h, { fit: it.fit === 'contain' ? 'contain' : 'cover', background: '#ffffff' })
    .flatten({ background: '#ffffff' })
    .toBuffer();
  const mask = Buffer.from(`<svg width="${w}" height="${h}"><rect width="${w}" height="${h}" rx="${RADIUS}" ry="${RADIUS}"/></svg>`);
  const rounded = await sharp(pic).composite([{ input: mask, blend: 'dest-in' }]).png().toBuffer();
  composites.push({ input: rounded, left: x, top: y });
  spots.push({ product: it.product, x: Math.round(((x + w * 0.82) / W) * 100), y: Math.round(((y + h * 0.85) / H) * 100) });
}

await sharp({ create: { width: W, height: H, channels: 3, background: cfg.bg || '#EFE6DA' } })
  .composite(composites)
  .jpeg({ quality: 86 })
  .toFile(outPath);
fs.rmSync(tmp, { recursive: true, force: true });
console.log(JSON.stringify(spots, null, 2));
