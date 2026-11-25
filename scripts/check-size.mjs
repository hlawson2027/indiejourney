// Warns well before Cloudflare's free limit of 20,000 files per site.
import fs from 'node:fs';
import path from 'node:path';
let count = 0;
const walk = (d) => { for (const e of fs.readdirSync(d, { withFileTypes: true })) e.isDirectory() ? walk(path.join(d, e.name)) : count++; };
walk('dist');
const msg = `Site files: ${count} of 20,000 allowed on Cloudflare's free plan.`;
if (count > 15000) console.warn(`\n⚠️  ${msg} Time to move photos to Cloudflare R2 (see OWNER-GUIDE.md).\n`);
else console.log(msg);
