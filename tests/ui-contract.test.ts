import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path: string) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("la capa visual no duplica animación, zoom, lightbox ni shadcn", async () => {
  const packageJson = JSON.parse(await read("package.json")) as { dependencies: Record<string, string> };

  assert.equal(packageJson.dependencies["lucide-react"], "^1.34.0");
  assert.equal(packageJson.dependencies.sonner, "^2.0.8");
  assert.equal(packageJson.dependencies["embla-carousel-react"], "^8.6.0");
  assert.equal(packageJson.dependencies.vaul, "^1.1.2");
  assert.equal(packageJson.dependencies.motion, undefined);
  assert.equal(packageJson.dependencies["react-zoom-pan-pinch"], undefined);
  assert.equal(packageJson.dependencies["yet-another-react-lightbox"], undefined);
  assert.equal(packageJson.dependencies.shadcn, undefined);
});

test("el personalizador conserva el estado al cambiar color o vista", async () => {
  const source = await read("app/page.tsx");
  const selectColor = source.match(/const selectColor = \(nextColor:[\s\S]*?\n  };/)?.[0] ?? "";

  assert.match(selectColor, /setGarment\(nextColor\)/);
  assert.doesNotMatch(selectColor, /setQuantity|setStyle|setSleeveFlag|setFrontText/);
  assert.match(source, /aria-pressed=\{side==="front"\}/);
  assert.match(source, /const previewKey = `\$\{productType\}-\$\{garment\.name\}-\$\{side\}`/);
  assert.match(source, /<CustomizerDrawer/);
});

test("carrusel y drawer mantienen contratos táctiles, accesibles y reduced-motion", async () => {
  const carousel = await read("app/_components/design-carousel.tsx");
  const drawer = await read("app/_components/customizer-drawer.tsx");
  const css = await read("app/enhancements.css");

  assert.match(carousel, /aria-roledescription="carrusel"/);
  assert.match(carousel, /aria-label="Ver diseño anterior"/);
  assert.doesNotMatch(carousel, /autoplay/i);
  assert.match(drawer, /Drawer\.Title/);
  assert.match(drawer, /Drawer\.Description/);
  assert.match(css, /touch-action: pan-y pinch-zoom/);
  assert.match(css, /min-width: 44px/);
  assert.match(css, /@media \(max-width: 580px\)/);
  assert.match(css, /@media \(max-width: 360px\)/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
});

test("grupo, checkout y admin comparten estados legibles y accesibles", async () => {
  const status = await read("app/_components/status-badge.tsx");
  const group = await read("app/pedido/[code]/page.tsx");
  const checkout = await read("app/_components/payment-checkout.tsx");
  const admin = await read("app/admin/admin-dashboard.tsx");
  const premium = await read("app/premium.css");

  assert.match(status, /Pagado/);
  assert.match(status, /En producción/);
  assert.match(group, /role="progressbar"/);
  assert.match(group, /Siguiente acción/);
  assert.match(checkout, /ShieldCheck/);
  assert.match(admin, /<StatusBadge/);
  assert.match(admin, /aria-current=/);
  assert.match(premium, /status-badge-success/);
});

test("la capa premium cubre los anchos móviles críticos sin tocar precios", async () => {
  const premium = await read("app/premium.css");
  const commercial = await read("lib/commercial.ts");

  for (const width of [320, 375, 390, 430]) {
    assert.match(premium, new RegExp(`max-width: ${width}px`));
  }
  assert.match(premium, /prefers-reduced-motion: reduce/);
  assert.match(commercial, /pricingForSelection/);
});

test("el personalizador móvil une preview, vista y color sin desbordar la página", async () => {
  const page = await read("app/page.tsx");
  const mobile = await read("app/customizer-mobile.css");

  assert.match(page, /mobile-preview-controls/);
  assert.match(page, /mobile-color-rail/);
  assert.match(page, /aria-label="Color de la prenda"/);
  assert.match(mobile, /\.customizer-layout,[\s\S]*min-width: 0/);
  assert.match(mobile, /\.preview-stage[\s\S]*aspect-ratio: 1 \/ 1/);
  assert.match(mobile, /\.mobile-color-rail[\s\S]*overflow-x: auto/);
  assert.match(mobile, /\.preview-summary,[\s\S]*\.desktop-product-color[\s\S]*display: none/);
  assert.doesNotMatch(mobile, /width:\s*100vw/);
});
