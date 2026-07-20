# Roman Abashin portfolio

Static bilingual portfolio published with GitHub Pages.

## Local preview

```powershell
node scripts/serve.mjs 4173
```

Then open `http://127.0.0.1:4173/`.

## Maintenance

After adding or renaming a project page, run:

```powershell
node scripts/enhance-project-pages.mjs
node scripts/check-site.mjs
```

The enhancement script keeps project metadata, language alternates, image loading hints, `robots.txt`, and `sitemap.xml` in sync. The check script validates metadata, landmarks, image dimensions, internal references, duplicate IDs, and sitemap coverage.

## Content rule

Do not invent product metrics. Add measured outcomes to the featured case studies when they can be shared; if a value is under NDA, use an approved range or a directional result with clear context.
