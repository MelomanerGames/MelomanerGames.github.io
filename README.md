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

## Business card

Both contact sections include a localized PNG business card, a 90 x 50 mm vector PDF, a standalone QR code, and a vCard contact. Russian files link to `https://melomanergames.github.io/`; English files (the `-en` variants) link directly to `https://melomanergames.github.io/index-en.html`. No tracking or redirect service is used. Each page also offers the other language's PNG card.

To rebuild on Windows with Python, Segoe UI fonts, and Poppler:

```powershell
python -m pip install reportlab qrcode pillow pypdf zxing-cpp
python scripts/create-business-card.py
pdftoppm -png -singlefile -scale-to-x 1800 -scale-to-y 1000 output/pdf/roman-abashin-card.pdf assets/roman-abashin-card
pdftoppm -png -singlefile -scale-to-x 1800 -scale-to-y 1000 output/pdf/roman-abashin-card-en.pdf assets/roman-abashin-card-en
python scripts/check-business-card.py
```

The generator builds both languages by default. Use `--language ru` or `--language en` to regenerate only one. The check verifies both QR destinations at multiple sizes, translations, PDF links, and localized contacts.

The PDF uses the finished card size, without printer-specific bleed or crop marks. Request the print shop's specifications before a production print run. No Python or build step is needed to serve the website on GitHub Pages.

## Content rule

Do not invent product metrics. Add measured outcomes to the featured case studies when they can be shared; if a value is under NDA, use an approved range or a directional result with clear context.
