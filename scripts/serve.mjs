import http from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const port = Number.parseInt(process.argv[2] || '4173', 10);
const types = {
    '.css': 'text/css; charset=utf-8',
    '.html': 'text/html; charset=utf-8',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.js': 'text/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.svg': 'image/svg+xml',
    '.txt': 'text/plain; charset=utf-8',
    '.webmanifest': 'application/manifest+json',
    '.xml': 'application/xml; charset=utf-8',
};

http.createServer(async (request, response) => {
    try {
        const url = new URL(request.url || '/', 'http://localhost');
        const relativePath = decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname);
        const requestedPath = path.resolve(root, `.${relativePath}`);
        if (!requestedPath.startsWith(root + path.sep)) throw new Error('Outside root');

        const body = await readFile(requestedPath);
        response.writeHead(200, {
            'Content-Type': types[path.extname(requestedPath).toLowerCase()] || 'application/octet-stream',
            'Cache-Control': 'no-store',
        });
        response.end(body);
    } catch {
        response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        response.end('Not found');
    }
}).listen(port, '127.0.0.1', () => {
    console.log(`Portfolio preview: http://127.0.0.1:${port}`);
});
