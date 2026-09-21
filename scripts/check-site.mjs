import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(scriptDir, '..');
const htmlFiles = [
    path.join(rootDir, 'index.html'),
    path.join(rootDir, 'index-en.html'),
    ...readdirSync(path.join(rootDir, 'projects'))
        .filter((name) => name.endsWith('.html'))
        .map((name) => path.join(rootDir, 'projects', name)),
];
const errors = [];

for (const filePath of htmlFiles) {
    const relativeFile = path.relative(rootDir, filePath).replaceAll(path.sep, '/');
    const html = readFileSync(filePath, 'utf8');

    const requiredPatterns = [
        ['description', /<meta\s+name=["']description["']/i],
        ['canonical URL', /<link\s+rel=["']canonical["']/i],
        ['Open Graph title', /<meta\s+property=["']og:title["']/i],
        ['Russian hreflang', /hreflang=["']ru["']/i],
        ['English hreflang', /hreflang=["']en["']/i],
        ['main landmark', /<main\b/i],
    ];

    for (const [label, pattern] of requiredPatterns) {
        if (!pattern.test(html)) errors.push(`${relativeFile}: missing ${label}`);
    }

    const ids = [...html.matchAll(/\bid=["']([^"']+)["']/gi)].map((match) => match[1]);
    for (const id of new Set(ids)) {
        if (ids.filter((candidate) => candidate === id).length > 1) {
            errors.push(`${relativeFile}: duplicate id "${id}"`);
        }
    }

    for (const match of html.matchAll(/(?:href|src)=["']([^"']+)["']/gi)) {
        const reference = match[1];
        if (reference.startsWith('#') && reference.length > 1 && !ids.includes(reference.slice(1))) {
            errors.push(`${relativeFile}: missing anchor target ${reference}`);
        }
        if (/^(?:https?:|mailto:|tel:|#|data:|javascript:)/i.test(reference)) continue;
        const cleanReference = decodeURIComponent(reference.split(/[?#]/)[0]);
        const target = path.resolve(path.dirname(filePath), cleanReference.replaceAll('/', path.sep));
        if (!existsSync(target)) errors.push(`${relativeFile}: missing internal reference ${reference}`);
    }

    if (!relativeFile.startsWith('projects/')) {
        const linkedProjects = new Set([...html.matchAll(/href=["'](projects\/[^"'#?]+\.html)["']/gi)]
            .map((match) => match[1]));
        const isEnglish = relativeFile === 'index-en.html';
        const expectedProjects = htmlFiles.filter((file) => path.dirname(file) === path.join(rootDir, 'projects')
            && path.basename(file).endsWith('-en.html') === isEnglish);
        for (const project of expectedProjects) {
            if (!linkedProjects.has(`projects/${path.basename(project)}`)) {
                errors.push(`${relativeFile}: project missing from homepage ${path.basename(project)}`);
            }
        }
        const cardSuffix = isEnglish ? '-en' : '';
        const cardImage = `assets/roman-abashin-card${cardSuffix}.png`;
        if (!html.includes(`class="pass-preview" href="${cardImage}"`)
            || !html.includes(`<img src="${cardImage}"`)) {
            errors.push(`${relativeFile}: business card preview has the wrong language`);
        }
        for (const asset of [cardImage, `assets/roman-abashin${cardSuffix}.vcf`, `assets/portfolio-qr${cardSuffix}.svg`, `output/pdf/roman-abashin-card${cardSuffix}.pdf`]) {
            if (!html.includes(`href="${asset}"`)) errors.push(`${relativeFile}: missing business card download ${asset}`);
        }
    }

    for (const match of html.matchAll(/<img\b[^>]*>/gi)) {
        const tag = match[0];
        if (!/\bsrc=["'][^"']+["']/i.test(tag)) continue;
        if (!/\balt=["'][^"']*["']/i.test(tag)) errors.push(`${relativeFile}: image missing alt text`);
        if (!/\bwidth=["']\d+["']/i.test(tag) || !/\bheight=["']\d+["']/i.test(tag)) {
            errors.push(`${relativeFile}: image missing intrinsic dimensions`);
        }
    }
}

const sitemap = readFileSync(path.join(rootDir, 'sitemap.xml'), 'utf8');
const sitemapUrlCount = [...sitemap.matchAll(/<url>/g)].length;
if (sitemapUrlCount !== htmlFiles.length) {
    errors.push(`sitemap.xml: expected ${htmlFiles.length} URLs, found ${sitemapUrlCount}`);
}

if (errors.length) {
    console.error(errors.join('\n'));
    process.exitCode = 1;
} else {
    console.log(`Site check passed: ${htmlFiles.length} HTML pages, ${sitemapUrlCount} sitemap URLs, no missing internal references.`);
}
