#!/usr/bin/env node
/**
 * Dependency-free preview server.
 *
 *   npm start        published content only
 *   npm run dev:drafts   published AND draft content, local only
 *
 * Draft mode is selected by the command that starts the server, never by a
 * committed configuration value (Addendum A, C2). In draft mode the server
 * layers the gitignored _preview/ directory over the repository root, so the
 * published artefacts on disk are read but never altered.
 */
import http from 'node:http';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { extname, join, normalize, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));
const DRAFTS = process.argv.slice(2).includes('--drafts');
const PREVIEW = join(ROOT, '_preview');
const port = Number(process.env.PORT || 8080);

if (DRAFTS && !existsSync(PREVIEW)) {
  console.error('\nDraft preview requested but _preview/ does not exist.');
  console.error('Run:  npm run dev:drafts\n');
  process.exit(2);
}

/* Draft mode searches _preview first, then falls back to the repository. */
const SEARCH = DRAFTS ? [PREVIEW, ROOT] : [ROOT];

const types = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml', '.xml': 'application/xml; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8', '.pdf': 'application/pdf',
  '.txt': 'text/plain; charset=utf-8'
};

const resolveFile = safe => {
  for (const base of SEARCH) {
    let file = join(base, safe || 'index.html');
    if (!file.startsWith(base)) continue;
    if (existsSync(file) && statSync(file).isDirectory()) file = join(file, 'index.html');
    if (existsSync(file) && statSync(file).isFile()) return file;
  }
  return null;
};

http.createServer((req, res) => {
  try {
    const raw = decodeURIComponent((req.url || '/').split('?')[0]);
    const safe = normalize(raw).replace(/^(\.\.[/\\])+/, '').replace(/^[/\\]+/, '');
    const file = resolveFile(safe) || join(ROOT, '404.html');
    const is404 = file.endsWith('404.html') && !safe.endsWith('404.html');
    res.writeHead(is404 ? 404 : 200, {
      'Content-Type': types[extname(file).toLowerCase()] || 'application/octet-stream',
      'Cache-Control': 'no-cache',
      'X-Draft-Preview': DRAFTS ? 'true' : 'false'
    });
    res.end(readFileSync(file));
  } catch {
    res.writeHead(500);
    res.end('Server error');
  }
}).listen(port, () => {
  console.log(`\nPortfolio preview: http://localhost:${port}`);
  if (DRAFTS) {
    console.log('\n  *** DRAFT PREVIEW — includes unpublished content. Do not share this view. ***');
  }
  console.log('\nPress Ctrl+C to stop.\n');
});
