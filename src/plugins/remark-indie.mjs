// Turns simple things typed in the dashboard editor into rich blocks:
//   • a paragraph that is just  [[product: Product name]]  → a shoppable product card
//   • a paragraph that is just a YouTube link            → a fast, click-to-play video
//   • images uploaded into the article body (/uploads/…)  → optimized by Astro
import fs from 'node:fs';
import path from 'node:path';
import { parse as parseYaml } from 'yaml';
import { visit } from 'unist-util-visit';

const ROOT = process.cwd();
const UPLOADS = path.join(ROOT, 'src/assets/uploads');
const PRODUCTS = path.join(ROOT, 'src/content/products');

const esc = (s = '') =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function frontmatter(file) {
  const m = fs.readFileSync(file, 'utf8').match(/^---\r?\n([\s\S]*?)\r?\n---/);
  return m ? parseYaml(m[1]) : null;
}

function readProduct(slug, typed) {
  const file = path.join(PRODUCTS, `${slug}.md`);
  if (fs.existsSync(file)) return frontmatter(file);
  // Fall back to matching the product name exactly as typed.
  if (!fs.existsSync(PRODUCTS)) return null;
  const want = typed.trim().toLowerCase();
  for (const f of fs.readdirSync(PRODUCTS)) {
    if (!f.endsWith('.md')) continue;
    const data = frontmatter(path.join(PRODUCTS, f));
    if (data?.name && String(data.name).trim().toLowerCase() === want) return data;
  }
  return null;
}

function youtubeId(url) {
  const m = String(url).match(
    /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|shorts\/|embed\/|live\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/
  );
  return m ? m[1] : null;
}

export function youtubeHtml(id, title = 'YouTube video') {
  return `<div class="yt" data-yt="${id}"><button type="button" class="yt-btn" aria-label="Play video: ${esc(
    title
  )}"><img src="https://i.ytimg.com/vi/${id}/hqdefault.jpg" alt="" loading="lazy" width="480" height="360"><span class="yt-play" aria-hidden="true"></span></button></div>`;
}

function paragraphText(node) {
  return node.children
    .map((c) => (c.type === 'text' ? c.value : c.type === 'link' ? c.url : c.type === 'inlineCode' ? c.value : ''))
    .join('')
    .trim();
}

function relativeUpload(fileDir, url) {
  const rel = path.relative(fileDir, path.join(UPLOADS, decodeURI(url.replace(/^\/uploads\//, ''))));
  return rel.startsWith('.') ? rel : './' + rel;
}

export default function remarkIndie() {
  return (tree, file) => {
    const filePath = file?.path || file?.history?.[0];
    const fileDir = filePath ? path.dirname(filePath) : null;

    visit(tree, 'paragraph', (node, index, parent) => {
      if (!parent || index == null) return;
      const text = paragraphText(node);

      const prod = text.match(/^\[\[\s*product\s*:\s*(.+?)\s*\]\]$/i);
      if (prod) {
        const slug = prod[1].toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        const p = readProduct(slug, prod[1]);
        if (!p) {
          parent.children.splice(index, 1);
          return index;
        }
        const nodes = [
          {
            type: 'html',
            value: `<aside class="pcard-inline"><a href="${esc(p.link)}" rel="sponsored noopener" target="_blank">`,
          },
        ];
        if (!p.image && p.image_url) {
          nodes.push({ type: 'html', value: `<span class="pcard-inline-img media ext"><img src="${esc(p.image_url)}" alt="${esc(p.image_alt || p.name)}" loading="lazy" width="240" height="240" referrerpolicy="no-referrer"></span>` });
        } else if (p.image && fileDir) {
          nodes.push({
            type: 'paragraph',
            data: { hName: 'span', hProperties: { className: ['pcard-inline-img'] } },
            children: [{ type: 'image', url: relativeUpload(fileDir, p.image), alt: p.image_alt || p.name }],
          });
        }
        nodes.push({
          type: 'html',
          value: `<span class="pcard-inline-text"><span class="kick">${esc(p.retailer)}</span><strong>${esc(
            p.name
          )}</strong>${p.description ? `<span class="pcard-inline-desc">${esc(p.description)}</span>` : ''}<span class="pcard-inline-cta">Shop now →</span></span></a></aside>`,
        });
        parent.children.splice(index, 1, ...nodes);
        return index + nodes.length;
      }

      const id = youtubeId(text);
      if (id && /^\S+$/.test(text)) {
        parent.children.splice(index, 1, { type: 'html', value: youtubeHtml(id) });
        return index + 1;
      }
    });

    if (fileDir) {
      visit(tree, 'image', (node) => {
        if (typeof node.url === 'string' && node.url.startsWith('/uploads/')) {
          node.url = relativeUpload(fileDir, node.url);
        }
      });
    }
  };
}
