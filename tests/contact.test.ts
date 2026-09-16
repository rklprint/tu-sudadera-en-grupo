import assert from "node:assert/strict";
import test from "node:test";
import { whatsappUrl } from "../lib/contact";

test("WhatsApp encodes configuration without leaking extra form or order fields", () => {
  const configuration = {
    product: "Camiseta", model: "Modelo por confirmar", color: "Azul petróleo",
    quantity: 35, design: "Peña & año 27", printColor: "Rosa fosforito",
    front: "Nombre · DTF", sleeve: "Sin bandera",
    email: "private@example.test", phone: "600000000", privateToken: "secret-token",
  };
  const url = new URL(whatsappUrl(configuration));
  assert.equal(url.origin, "https://wa.me");
  assert.equal(url.pathname, "/34641228861");
  assert.deepEqual([...url.searchParams.keys()], ["text"]);
  const text = url.searchParams.get("text")!;
  assert.ok(text.includes("Cantidad: 35"));
  assert.ok(text.includes("Peña & año 27"));
  assert.ok(text.includes("Azul petróleo"));
  for (const privateValue of [configuration.email, configuration.phone, configuration.privateToken]) {
    assert.equal(text.includes(privateValue), false);
  }
  assert.equal(new URL(whatsappUrl()).pathname, url.pathname);
});
