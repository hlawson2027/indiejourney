# The Indie Journey

Lifestyle magazine website. Astro (static) + Pages CMS (editing) + Cloudflare Workers static assets (hosting).
Owner instructions: [OWNER-GUIDE.md](OWNER-GUIDE.md).

## How it works

- Content lives in `src/content/` as Markdown/JSON; photos in `src/assets/uploads/` (written as `/uploads/<file>`).
- `.pages.yml` defines the dashboard forms.
- `.github/workflows/deploy.yml` builds and deploys on every push, every morning (scheduled posts), and on the dashboard's "Publish site now" button. It deploys two Workers: `indiejourney` (public) and `indiejourney-preview` (drafts visible, `noindex`; protect it with Cloudflare Access).
- Drafts (`draft: true`) and future-dated posts are left out of the public build.
- Body shortcodes (see `src/plugins/remark-indie.mjs`): a line `[[product: Name]]` renders a product card; a line with only a YouTube link renders a click-to-play video.

## Commands

```
npm ci
npm run dev            # local site at http://localhost:4321
npm run build          # public build → dist/
npm run build:preview  # build including drafts
```

## Required GitHub settings

- Secrets: `CLOUDFLARE_API_TOKEN` (template "Edit Cloudflare Workers"), `CLOUDFLARE_ACCOUNT_ID`
- Variables (optional): `SITE_URL` (default https://myindiejourney.com), `PREVIEW_URL`

## Cost guardrails

- Static files only: no server, database or paid API.
- `scripts/check-size.mjs` warns at 15,000 files (free limit 20,000). Next step then: move `src/assets/uploads` to Cloudflare R2.
