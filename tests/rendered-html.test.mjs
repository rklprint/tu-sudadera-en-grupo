import assert from "node:assert/strict";
import test from "node:test";

const workerUrl = new URL("../dist/server/index.js", import.meta.url);
workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
const workerPromise = import(workerUrl.href).then((module) => module.default);
const runtime = {
  ASSETS: {
    fetch: async () => new Response("Not found", { status: 404 }),
  },
};
const execution = { waitUntil() {}, passThroughOnException() {} };

async function fetchPath(path, accept = "text/html") {
  const worker = await workerPromise;
  return worker.fetch(
    new Request(`http://localhost${path}`, {
      headers: { accept },
    }),
    runtime,
    execution,
  );
}

test("renders the public homepage with production metadata", async () => {
  const response = await fetchPath("/");

  assert.equal(response.status, 200);
  assert.match(
    response.headers.get("content-type") ?? "",
    /^text\/html\b/i,
  );
  const html = await response.text();
  assert.match(html, /<html[^>]*\blang=["']es["']/i);
  assert.match(html, /<title>Sudaderas personalizadas para colegios y grupos \| Precios claros<\/title>/i);
  assert.match(html, /<link(?=[^>]*\brel=["']canonical["'])(?=[^>]*\bhref=["']https:\/\/tusudaderaengrupo\.es\/["'])[^>]*>/i);
  assert.match(html, /<meta(?=[^>]*\bname=["']description["'])[^>]*>/i);
  assert.match(html, /application\/ld\+json/i);
  assert.doesNotMatch(html, /codex-preview/i);
  assert.doesNotMatch(html, /RKL Print|C[oó]rdoba/i);
});

test("renders every public SEO landing without thin or broken pages", async () => {
  const routes = [
    "/sudaderas-personalizadas",
    "/sudaderas-colegios-institutos",
    "/sudaderas-fin-de-curso",
    "/sudaderas-penas",
    "/sudaderas-equipos-clubes",
    "/sudaderas-viaje-estudios",
    "/camisetas-personalizadas",
  ];
  for (const route of routes) {
    const response = await fetchPath(route);
    assert.equal(response.status, 200, route);
    const html = await response.text();
    assert.match(html, /<h1\b/i, route);
    assert.match(html, new RegExp(`<link(?=[^>]*rel=["']canonical["'])(?=[^>]*href=["']https:\\/\\/tusudaderaengrupo\\.es${route}["'])`, "i"), route);
    assert.match(html, /application\/ld\+json/i, route);
    assert.doesNotMatch(html, /RKL Print|C[oó]rdoba/i, route);
  }
});

test("publishes sitemap and robots while keeping private flows out of search", async () => {
  const robots = await fetchPath("/robots.txt", "text/plain");
  assert.equal(robots.status, 200);
  const robotsText = await robots.text();
  assert.match(robotsText, /Disallow: \/admin/i);
  assert.match(robotsText, /Sitemap: https:\/\/tusudaderaengrupo\.es\/sitemap\.xml/i);

  const sitemap = await fetchPath("/sitemap.xml", "application/xml");
  assert.equal(sitemap.status, 200);
  const sitemapText = await sitemap.text();
  assert.match(sitemapText, /https:\/\/tusudaderaengrupo\.es\/sudaderas-personalizadas/i);
  assert.match(sitemapText, /https:\/\/tusudaderaengrupo\.es\/camisetas-personalizadas/i);
  assert.doesNotMatch(sitemapText, /\/admin|\/pedido|\/participante|\/pago/i);

  const privatePage = await fetchPath("/pedido/TSG-DEMO");
  assert.equal(privatePage.status, 200);
  assert.match(await privatePage.text(), /<meta(?=[^>]*name=["']robots["'])(?=[^>]*content=["']noindex, nofollow[^"']*["'])/i);
});
