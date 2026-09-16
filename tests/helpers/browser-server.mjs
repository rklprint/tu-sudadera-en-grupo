// Isolated browser QA only: in-memory D1/R2, loopback binding, no mail or TPV.
// Run after npm run build. Never use this adapter as a deployed server.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve, extname, sep } from 'node:path';
import { D1TestDatabase, R2TestBucket } from './d1-test-database.mjs';
import worker from '../../dist/server/index.js';

const root = fileURLToPath(new URL('../../', import.meta.url));
const port = 4173;
const origin = `http://127.0.0.1:${port}`;
const types = { '.js':'text/javascript', '.css':'text/css', '.json':'application/json', '.webp':'image/webp', '.png':'image/png', '.svg':'image/svg+xml', '.woff2':'font/woff2', '.ico':'image/x-icon' };
async function asset(request) {
  const pathname = decodeURIComponent(new URL(request.url).pathname);
  for (const directory of ['dist/client', 'public']) {
    const base = resolve(root, directory);
    const path = resolve(base, '.' + pathname);
    if (!path.startsWith(base + sep)) continue;
    try { return new Response(await readFile(path), { headers: { 'Content-Type': types[extname(path)] || 'application/octet-stream' } }); } catch { /* Try the next public asset root. */ }
  }
  return new Response('Not found', { status:404 });
}
const runtime = {
  DB: new D1TestDatabase(), BUCKET: new R2TestBucket(), ASSETS: { fetch: asset },
  APP_ENV:'development', APP_ORIGIN:origin,
  TRUST_OPENAI_IDENTITY_HEADERS:'true', ADMIN_EMAIL:'browser-qa@example.invalid',
  BANK_TRANSFER_IBAN:'ES0000000000000000000000', BANK_TRANSFER_ACCOUNT_HOLDER:'PRUEBA SINTÉTICA — NO TRANSFERIR',
};
createServer(async (incoming, outgoing) => {
  try {
    const chunks=[];
    for await (const chunk of incoming) chunks.push(chunk);
    const request = new Request(origin + incoming.url, {
      method: incoming.method, headers: incoming.headers,
      ...(chunks.length ? { body:Buffer.concat(chunks) } : {}),
    });
    let response = await asset(request);
    if (response.status === 404) response = await worker.fetch(request, runtime, { waitUntil() {}, passThroughOnException() {} });
    outgoing.writeHead(response.status, Object.fromEntries(response.headers));
    outgoing.end(Buffer.from(await response.arrayBuffer()));
  } catch (error) { console.error(error); outgoing.writeHead(500); outgoing.end('QA adapter error'); }
}).listen(port, '127.0.0.1', () => console.log(`Synthetic QA only: ${origin}`));
