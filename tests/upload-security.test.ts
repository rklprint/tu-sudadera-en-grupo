import assert from "node:assert/strict";
import test from "node:test";
import { validateDesignFile } from "../lib/design-files";

test("acepta PNG por firma y no solo por extensión", async () => {
  const bytes = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);
  const result = await validateDesignFile(new File([bytes], "../../diseño final.png", { type: "image/png" }));
  assert.ok("file" in result);
  if ("file" in result) {
    assert.equal(result.file.extension, "png");
    assert.doesNotMatch(result.file.safeName, /[\\/]/);
  }
});

test("rechaza SVG y archivos disfrazados", async () => {
  const svg = await validateDesignFile(new File(["<svg></svg>"], "diseño.svg", { type: "image/svg+xml" }));
  assert.ok("error" in svg);
  const fakePng = await validateDesignFile(new File(["contenido ejecutable"], "foto.png", { type: "image/png" }));
  assert.ok("error" in fakePng);
});
