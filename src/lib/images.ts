import type { ImageMetadata } from 'astro';
import { getImage } from 'astro:assets';

// Every photo uploaded from the dashboard lands in src/assets/uploads and is
// written into content as "/uploads/<file>". Here we map those paths to real
// image files so Astro can resize and compress them at build time.
const files = import.meta.glob<{ default: ImageMetadata }>(
  '/src/assets/uploads/**/*.{jpg,jpeg,png,webp,avif,gif,JPG,JPEG,PNG,WEBP,AVIF,GIF}',
  { eager: true }
);

export function resolveImage(path?: string | null): ImageMetadata | undefined {
  if (!path) return undefined;
  const clean = decodeURI(path)
    .replace(/^https?:\/\/[^/]+/, '')
    .replace(/^\/?src\/assets\/uploads\//, '')
    .replace(/^\/?uploads\//, '');
  return files['/src/assets/uploads/' + clean]?.default;
}

/** Absolute-path URL of a share image (1200px JPG) for social/Pinterest tags. */
export async function shareImage(path?: string | null, width = 1200): Promise<string | undefined> {
  const meta = resolveImage(path);
  if (!meta) return undefined;
  const out = await getImage({ src: meta, width: Math.min(width, meta.width), format: 'jpg', quality: 82 });
  return out.src;
}
