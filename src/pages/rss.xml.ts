import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { settings } from '../lib/settings';
import { getArticles, articleUrl } from '../lib/content';

export async function GET(context: APIContext) {
  const articles = await getArticles();
  return rss({
    title: settings.title,
    description: settings.description,
    site: context.site!,
    items: articles.slice(0, 50).map((a) => ({
      title: a.data.title,
      description: a.data.excerpt || undefined,
      pubDate: a.data.date,
      link: articleUrl(a),
    })),
  });
}
