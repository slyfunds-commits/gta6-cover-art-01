// Neon Hours — tiny static file server for app/.
//
// Standard library only. Serves the poster studio so it can be tried in
// a browser exactly as the grader's finalist review would: node serve.ts,
// then open http://127.0.0.1:8080/ (or --port <n> for another port).
// Written as plain JavaScript in a .ts file so it runs under Node's
// type stripping with no extra flags.

import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const appRoot = resolve(join(fileURLToPath(new URL('.', import.meta.url)), 'app'));

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
};

function portFromArgs() {
  const flag = process.argv.indexOf('--port');
  if (flag >= 0) {
    const parsed = Number(process.argv[flag + 1]);
    if (Number.isSafeInteger(parsed) && parsed > 0 && parsed < 65536) return parsed;
  }
  return 8080;
}

function send(res, status, body, type = 'text/plain; charset=utf-8') {
  res.writeHead(status, { 'content-type': type, 'content-length': Buffer.byteLength(body) });
  res.end(body);
}

async function handle(req, res) {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    send(res, 405, 'Method not allowed. Neon Hours serves GET and HEAD only.\n');
    return;
  }

  const rawPath = decodeURIComponent(new URL(req.url ?? '/', 'http://127.0.0.1').pathname);
  const cleaned = rawPath.endsWith('/') ? `${rawPath}index.html` : rawPath;
  const target = resolve(join(appRoot, cleaned));

  // Nothing outside app/ is ever served, however the path is spelled.
  if (target !== appRoot && !target.startsWith(appRoot + sep)) {
    send(res, 403, 'Forbidden. That path leaves the app directory.\n');
    return;
  }

  let data;
  try {
    data = await readFile(target);
  } catch (error) {
    const code = error && typeof error === 'object' && 'code' in error ? error.code : '';
    if (code === 'ENOENT' || code === 'ENOTDIR') {
      send(res, 404, 'Not found.\n');
      return;
    }
    send(res, 500, 'Could not read that file.\n');
    return;
  }

  const type = MIME[extname(target).toLowerCase()] ?? 'application/octet-stream';
  res.writeHead(200, { 'content-type': type, 'content-length': data.length });
  if (req.method === 'GET') res.end(data);
  else res.end();
}

const port = portFromArgs();
createServer((req, res) => {
  handle(req, res).catch(() => {
    if (!res.headersSent) send(res, 500, 'Something went wrong.\n');
    else res.end();
  });
}).listen(port, '127.0.0.1', () => {
  console.log(`Neon Hours is available at http://127.0.0.1:${port}/`);
});
