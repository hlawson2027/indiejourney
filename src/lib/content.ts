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
  return (await getCollection('books')).sort((a, b) => a.data.order - b.data.order);
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
