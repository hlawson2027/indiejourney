import type { APIContext } from 'astro';

export function GET({ site }: APIContext) {
  const preview = process.env.PREVIEW === 'true';
  const body = preview
    ? 'User-agent: *\nDisallow: /\n'
    : `User-agent: *\nAllow: /\nDisallow: /search/\n\nSitemap: ${new URL('sitemap-index.xml', site).href}\n`;
  return new Response(body, { headers: { 'Content-Type': 'text/plain' } });
}
