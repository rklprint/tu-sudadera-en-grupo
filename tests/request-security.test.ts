import assert from "node:assert/strict";
import test from "node:test";
import { readBoundedBody, readJsonBody, rejectCrossOriginMutation } from "../lib/request-security";

test("rechaza mutaciones con un Origin de otro sitio", () => {
  const response = rejectCrossOriginMutation(new Request("https://tusudaderaengrupo.es/api/test", {
    method: "POST",
    headers: { Origin: "https://sitio-atacante.example" },
  }));
  assert.equal(response?.status, 403);
});

test("limita el body aunque el cliente omita Content-Length", async () => {
  const request = new Request("https://tusudaderaengrupo.es/api/test", {
    method: "POST",
    body: new Uint8Array(128),
  });
  assert.equal(request.headers.has("content-length"), false);
  const result = await readBoundedBody(request, 64);
  assert.ok("response" in result);
  if ("response" in result) assert.equal(result.response.status, 413);
});

test("acepta JSON válido y rechaza tipos de contenido ambiguos", async () => {
  const valid = await readJsonBody<{ ok: boolean }>(new Request("https://tusudaderaengrupo.es/api/test", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ok: true }),
  }), 1024);
  assert.ok("data" in valid && valid.data.ok);

  const invalid = await readJsonBody(new Request("https://tusudaderaengrupo.es/api/test", {
    method: "POST",
    headers: { "Content-Type": "text/plain" },
    body: "{}",
  }), 1024);
  assert.ok("response" in invalid);
  if ("response" in invalid) assert.equal(invalid.response.status, 415);
});
