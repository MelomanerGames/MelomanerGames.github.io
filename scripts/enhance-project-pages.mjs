import {
    readFileSync,
    readdirSync,
    writeFileSync,
} from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(scriptDir, '..');
const projectsDir = path.join(rootDir, 'projects');
const siteRoot = 'https://melomanergames.github.io';
const projectFiles = readdirSync(projectsDir).filter((name) => name.endsWith('.html')).sort();

function escapeAttribute(value) {
    return value
        .replaceAll('&', '&amp;')
        .replaceAll('"', '&quot;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;');
}

function cleanText(value) {
    return value
        .replace(/<[^>]*>/g, ' ')
        .replaceAll('&amp;', '&')
        .replaceAll('&mdash;', '—')
        .replace(/\s+/g, ' ')
        .trim();
}

function getImageDimensions(filePath) {
    try {
        const bytes = readFileSync(filePath);
        if (bytes.length >= 24 && bytes.toString('ascii', 1, 4) === 'PNG') {
            return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
        }

        if (bytes.length >= 4 && bytes[0] === 0xff && bytes[1] === 0xd8) {
            let offset = 2;
            while (offset + 9 < bytes.length) {
                if (bytes[offset] !== 0xff) {
                    offset += 1;
                    continue;
                }

                const marker = bytes[offset + 1];
                const length = bytes.readUInt16BE(offset + 2);
                if ([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf].includes(marker)) {
                    return {
                        width: bytes.readUInt16BE(offset + 7),
                        height: bytes.readUInt16BE(offset + 5),
                    };
                }
                if (length < 2) break;
                offset += 2 + length;
            }
        }
    } catch {
        return null;
    }
    return null;
}

function findMatchingDivClose(html, openingIndex) {
    const tagPattern = /<div\b[^>]*>|<\/div\s*>/gi;
    tagPattern.lastIndex = openingIndex;
    let depth = 0;
    let match;

    while ((match = tagPattern.exec(html))) {
        if (/^<div\b/i.test(match[0])) depth += 1;
        else depth -= 1;
        if (depth === 0) return { start: match.index, end: tagPattern.lastIndex };
    }
    return null;
}

function addImageHints(html, htmlFile) {
    return html.replace(/<img\b[^>]*>/gi, (tag) => {
        let next = tag;
        if (!/\bloading=/i.test(next)) next = next.replace(/>$/, ' loading="lazy">');
        if (!/\bdecoding=/i.test(next)) next = next.replace(/>$/, ' decoding="async">');

        if (!/\bwidth=/i.test(next) && !/\bheight=/i.test(next)) {
            const source = next.match(/\bsrc=["']([^"']+)["']/i)?.[1];
            if (source && !/^(?:https?:|data:)/i.test(source)) {
                const cleanSource = decodeURIComponent(source.split(/[?#]/)[0]);
                const imagePath = path.resolve(path.dirname(htmlFile), cleanSource.replaceAll('/', path.sep));
                const dimensions = getImageDimensions(imagePath);
                if (dimensions) {
                    next = next.replace(/>$/, ` width="${dimensions.width}" height="${dimensions.height}">`);
                }
            }
        }
        return next;
    });
}

function moveReturnLinkAfterScreenshots(html) {
    const menuStart = html.lastIndexOf('<div class="menu-return-bottom">');
    const screenshotsStart = html.indexOf('<div class="screenshots">');
    if (menuStart < 0 || screenshotsStart < 0 || menuStart > screenshotsStart) return html;

    const menuClose = findMatchingDivClose(html, menuStart);
    if (!menuClose) return html;

    const menuBlock = html.slice(menuStart, menuClose.end).trim();
    const withoutMenu = `${html.slice(0, menuStart)}${html.slice(menuClose.end)}`;
    const updatedScreenshotsStart = withoutMenu.indexOf('<div class="screenshots">');
    const screenshotsClose = findMatchingDivClose(withoutMenu, updatedScreenshotsStart);
    if (!screenshotsClose) return html;

    return `${withoutMenu.slice(0, screenshotsClose.end)}\n        ${menuBlock}${withoutMenu.slice(screenshotsClose.end)}`;
}

for (const fileName of projectFiles) {
    const filePath = path.join(projectsDir, fileName);
    let html = readFileSync(filePath, 'utf8');
    html = html
        .replace(/<!--[\s\S]*?-->\s*/g, '')
        .replace(/\/\*[\s\S]*?\*\//g, '');
    const isEnglish = fileName.endsWith('-en.html');
    const baseName = fileName.replace(/-en\.html$/, '').replace(/\.html$/, '');
    const ruFile = `${baseName}.html`;
    const enFile = `${baseName}-en.html`;
    const heading = cleanText(html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1] || fileName.replace('.html', ''));
    const canonical = `${siteRoot}/projects/${encodeURI(fileName)}`;
    const ruUrl = `${siteRoot}/projects/${encodeURI(ruFile)}`;
    const enUrl = `${siteRoot}/projects/${encodeURI(enFile)}`;
    const description = isEnglish
        ? `${heading} case study by Roman Abashin: role, responsibilities, tools, production contribution, and project materials.`
        : `Кейс ${heading} в портфолио Романа Абашина: роль, задачи, инструменты, вклад в производство и материалы проекта.`;

    html = html.replaceAll(`${siteRoot}/assets/social-preview.svg`, `${siteRoot}/assets/social-preview.png`);
    if (html.includes(`${siteRoot}/assets/social-preview.png`) && !html.includes('property="og:image:width"')) {
        html = html.replace(
            /(<meta property="og:image"[^>]*>)/i,
            '$1\n    <meta property="og:image:width" content="1200">\n    <meta property="og:image:height" content="630">',
        );
    }

    if (!/<meta\s+name=["']description["']/i.test(html)) {
        const structuredData = JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'CreativeWork',
            name: heading,
            url: canonical,
            author: {
                '@type': 'Person',
                name: isEnglish ? 'Roman Abashin' : 'Роман Абашин',
                url: isEnglish ? `${siteRoot}/index-en.html` : `${siteRoot}/`,
            },
        });
        const metadata = `
    <meta name="description" content="${escapeAttribute(description)}">
    <meta name="theme-color" content="#111111">
    <link rel="canonical" href="${canonical}">
    <link rel="alternate" hreflang="ru" href="${ruUrl}">
    <link rel="alternate" hreflang="en" href="${enUrl}">
    <link rel="alternate" hreflang="x-default" href="${ruUrl}">
    <link rel="icon" href="../assets/favicon.svg" type="image/svg+xml">
    <meta property="og:type" content="article">
    <meta property="og:title" content="${escapeAttribute(heading)} — Roman Abashin">
    <meta property="og:description" content="${escapeAttribute(description)}">
    <meta property="og:url" content="${canonical}">
    <meta property="og:image" content="${siteRoot}/assets/social-preview.png">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    <meta name="twitter:card" content="summary_large_image">
    <script type="application/ld+json">${structuredData}</script>`;
        html = html.replace(/(<meta\s+name=["']viewport["'][^>]*>)/i, `$1${metadata}`);
    }

    if (!html.includes('project-enhancements.css')) {
        html = html.replace(/<\/style>/i, '</style>\n    <link rel="stylesheet" href="../assets/project-enhancements.css">');
    }

    if (!html.includes('class="skip-link"')) {
        const label = isEnglish ? 'Skip to case study' : 'Перейти к кейсу';
        html = html.replace(/<body([^>]*)>/i, `<body$1>\n    <a class="skip-link" href="#main">${label}</a>`);
    }

    if (!/<main\b[^>]*id=["']main["']/i.test(html)) {
        const opening = html.match(/<div\s+class=["']content["'][^>]*>/i);
        if (opening?.index != null) {
            const close = findMatchingDivClose(html, opening.index);
            if (close) {
                const openEnd = opening.index + opening[0].length;
                html = `${html.slice(0, opening.index)}<main id="main" class="content">${html.slice(openEnd, close.start)}</main>${html.slice(close.end)}`;
            }
        }
    }

    html = addImageHints(html, filePath);
    html = moveReturnLinkAfterScreenshots(html);

    if (!html.includes('project-enhancements.js')) {
        html = html.replace(/<\/body>/i, '    <script src="../assets/project-enhancements.js" defer></script>\n</body>');
    }

    html = html.replace(/[ \t]+$/gm, '');
    writeFileSync(filePath, html, 'utf8');
}

const sitemapUrls = [
    { location: `${siteRoot}/`, priority: '1.0' },
    { location: `${siteRoot}/index-en.html`, priority: '0.9' },
    ...projectFiles.map((fileName) => ({
        location: `${siteRoot}/projects/${encodeURI(fileName)}`,
        priority: '0.7',
    })),
];
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapUrls.map(({ location, priority }) => `  <url>\n    <loc>${location}</loc>\n    <priority>${priority}</priority>\n  </url>`).join('\n')}
</urlset>
`;
writeFileSync(path.join(rootDir, 'sitemap.xml'), sitemap, 'utf8');
writeFileSync(path.join(rootDir, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${siteRoot}/sitemap.xml\n`, 'utf8');

console.log('Enhanced project pages:', projectFiles.length);
console.log('Generated sitemap URLs:', sitemapUrls.length);
