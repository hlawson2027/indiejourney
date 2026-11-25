// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { unified } from '@astrojs/markdown-remark';
import remarkIndie from './src/plugins/remark-indie.mjs';

const SITE = process.env.SITE_URL || 'https://myindiejourney.com';
const PREVIEW = process.env.PREVIEW === 'true';

export default defineConfig({
  site: SITE,
  trailingSlash: 'always',
  build: { format: 'directory' },
  integrations: PREVIEW ? [] : [sitemap({ filter: (page) => !/\/(search|404)\/?$/.test(page) })],
  markdown: {
    processor: unified({ remarkPlugins: [remarkIndie] }),
  },
  image: {
    // Responsive images: Astro writes several sizes so phones download small files.
    responsiveStyles: true,
    layout: 'constrained',
  },
});
