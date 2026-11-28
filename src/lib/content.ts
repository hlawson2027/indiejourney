import { getCollection, type CollectionEntry } from 'astro:content';

// PREVIEW=true builds the private preview site, which also shows drafts and
// future-dated posts. The public site shows only published, due content.
export const IS_PREVIEW = import.meta.env.PREVIEW === 'true' || process.env.PREVIEW === 'true';
const now = new Date();

function visible(d: { draft?: boolean; date: Date }) {
  if (IS_PREVIEW) return true;
  return !d.draft && d.date.getTime() <= now.getTime();
}

const byDateDesc = (a: { data: { date: Date } }, b: { data: { date: Date } }) =>
  b.data.date.getTime() - a.data.date.getTime();

export async function getArticles() {
  return (await getCollection('articles', ({ data }) => visible(data))).sort(byDateDesc);
}

export async function getLookbooks() {
  return (await getCollection('lookbooks', ({ data }) => visible(data))).sort(byDateDesc);
}

export async function getProducts() {
  return (await getCollection('products', ({ data }) => !data.hidden)).sort((a, b) =>
    a.data.name.localeCompare(b.data.name)
  );
}

export async function getProductMap() {
  const all = await getCollection('products');
  return new Map(all.map((p) => [p.id, p]));
}

export async function getCategories() {
  return (await getCollection('categories')).sort(
    (a, b) => a.data.order - b.data.order || a.data.title.localeCompare(b.data.title)
  );
}

export async function getCategoryMap() {
  const all = await getCollection('categories');
  return new Map(all.map((c) => [c.id, c]));
}

export async function getBooks() {
  return (await getCollection('books', ({ data }) => !data.hidden)).sort((a, b) => a.data.order - b.data.order);
}

/** A book gets its own page only when it has an uploaded cover or written description; otherwise it links straight to the store. */
export function bookHasPage(b: { body?: string; data: { cover?: unknown } }) {
  return Boolean((b.body || '').trim() || b.data.cover);
}
export function bookHref(b: { id: string; body?: string; data: { cover?: unknown; link?: string | null; links: { url: string }[] } }) {
  if (bookHasPage(b)) return `/books/${b.id}/`;
  return b.data.link || b.data.links[0]?.url || `/books/${b.id}/`;
}

export async function getStores() {
  return (await getCollection('stores')).sort((a, b) => a.data.order - b.data.order);
}

export const articleUrl = (a: CollectionEntry<'articles'>) => `/stories/${a.id}/`;
export const lookbookUrl = (l: CollectionEntry<'lookbooks'>) => `/lookbooks/${l.id}/`;
export const categoryUrl = (id: string) => `/${id}/`;
export const retailerSlug = (r: string) =>
  r.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

export function formatDate(d: Date) {
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });
}

/** Resolve a list of product ids to entries, skipping any that were deleted. */
export function pickProducts(ids: string[], map: Map<string, CollectionEntry<'products'>>) {
  return ids.map((id) => map.get(id)).filter((p): p is CollectionEntry<'products'> => !!p);
}

export const seriesUrl = (id: string) => `/series/${id}/`;

export async function getSeriesMap() {
  const all = await getCollection('series');
  return new Map(all.map((s) => [s.id, s]));
}

/** A series' published parts, in part order. */
export function seriesParts(articles: CollectionEntry<'articles'>[], id: string) {
  return articles
    .filter((a) => a.data.series === id)
    .sort((a, b) => (a.data.series_part ?? 99) - (b.data.series_part ?? 99) || +a.data.date - +b.data.date);
}

/** Replace every article in a series with one card for the whole series, at the spot of its newest part. */
export function collapseSeries(list: CollectionEntry<'articles'>[], seriesMap: Map<string, CollectionEntry<'series'>>) {
  const seen = new Set<string>();
  const out: ({ kind: 'article'; article: CollectionEntry<'articles'> } | { kind: 'series'; series: CollectionEntry<'series'>; count: number })[] = [];
  for (const a of list) {
    const sid = a.data.series;
    const s = sid ? seriesMap.get(sid) : undefined;
    const count = s ? list.filter((x) => x.data.series === s.id).length : 0;
    // A series only becomes one card when two or more of its parts are in this list;
    // a lone part (e.g. the Paris story on the Travel page) shows as itself.
    if (!s || count < 2) { out.push({ kind: 'article', article: a }); continue; }
    if (seen.has(s.id)) continue;
    seen.add(s.id);
    out.push({ kind: 'series', series: s, count });
  }
  return out;
}
