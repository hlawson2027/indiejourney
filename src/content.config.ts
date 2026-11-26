import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

// All image fields store a path such as "/uploads/photo.jpg" (written by the dashboard).
// src/lib/images.ts turns those paths into optimized images at build time.
const img = z.string().optional().nullable();

// Dashboard reference fields store a file path, e.g. "src/content/products/linen-throw.md".
// We keep only the file name (the entry id).
const ref = z
  .string()
  .transform((v) => v.split('/').pop()!.replace(/\.(md|mdx|json|ya?ml)$/i, ''));
const refs = z.array(ref).optional().default([]);

const seo = z
  .object({
    title: z.string().optional().nullable(),
    description: z.string().optional().nullable(),
  })
  .optional()
  .nullable();

const articles = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/articles' }),
  schema: z.object({
    title: z.string(),
    excerpt: z.string().optional().nullable(),
    category: ref,
    date: z.coerce.date(),
    updated: z.coerce.date().optional().nullable(),
    draft: z.boolean().optional().default(false),
    cover: img,
    cover_alt: z.string().optional().nullable(),
    pin_image: img,
    video: z.string().optional().nullable(),
    products: refs,
    featured: z.boolean().optional().default(false),
    seo,
  }),
});

const lookbooks = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/lookbooks' }),
  schema: z.object({
    title: z.string(),
    excerpt: z.string().optional().nullable(),
    date: z.coerce.date(),
    draft: z.boolean().optional().default(false),
    room_photo: img,
    room_photo_alt: z.string().optional().nullable(),
    pin_image: img,
    hotspots: z
      .array(
        z.object({
          product: ref,
          x: z.coerce.number().min(0).max(100),
          y: z.coerce.number().min(0).max(100),
        })
      )
      .optional()
      .default([]),
    products: refs,
    seo,
  }),
});

const products = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/products' }),
  schema: z.object({
    name: z.string(),
    retailer: z.string(),
    link: z.string().url(),
    image: img,
    image_url: z.string().url().optional().nullable().or(z.literal('')),
    image_alt: z.string().optional().nullable(),
    description: z.string().optional().nullable(),
    price_note: z.string().optional().nullable(),
    featured: z.boolean().optional().default(false),
    hidden: z.boolean().optional().default(false),
  }),
});

const books = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/books' }),
  schema: z.object({
    title: z.string(),
    subtitle: z.string().optional().nullable(),
    cover: img,
    order: z.coerce.number().optional().default(100),
    links: z
      .array(z.object({ label: z.string(), url: z.string().url() }))
      .optional()
      .default([]),
    seo,
  }),
});

const stores = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/stores' }),
  schema: z.object({
    name: z.string(),
    kind: z.string().optional().default('Store'),
    tagline: z.string().optional().nullable(),
    url: z.string().url(),
    image: img,
    order: z.coerce.number().optional().default(100),
  }),
});

const categories = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/categories' }),
  schema: z.object({
    title: z.string(),
    description: z.string().optional().nullable(),
    image: img,
    order: z.coerce.number().optional().default(100),
  }),
});

const pages = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/pages' }),
  schema: z.object({
    title: z.string(),
    image: img,
    seo,
  }),
});

export const collections = { articles, lookbooks, products, books, stores, categories, pages };
