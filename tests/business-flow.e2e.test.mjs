import assert from "node:assert/strict";
import test from "node:test";
import { D1TestDatabase, R2TestBucket } from "./helpers/d1-test-database.mjs";

const SIGNING_KEY = "sq7HjrUOBfKmC576ILgskD5srU870gJ7";
const ADMIN_EMAIL = "e2e-admin@example.invalid";
const db = new D1TestDatabase();
const bucket = new R2TestBucket();
const workerUrl = new URL("../dist/server/index.js", import.meta.url);
workerUrl.searchParams.set("business-flow", `${process.pid}-${Date.now()}`);
const workerPromise = import(workerUrl.href).then((module) => module.default);
const runtime = {
  DB: db,
  BUCKET: bucket,
  TRUST_OPENAI_IDENTITY_HEADERS: "true",
  ADMIN_EMAIL,
  REDSYS_ENVIRONMENT: "test",
  REDSYS_MERCHANT_CODE: "999008881",
  REDSYS_TERMINAL: "001",
  REDSYS_SIGNING_KEY: SIGNING_KEY,
  REDSYS_BIZUM_ENABLED: "true",
  BANK_TRANSFER_IBAN: "ES0000000000000000000000",
  BANK_TRANSFER_ACCOUNT_HOLDER: "Titular E2E",
  ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) },
};
const execution = { waitUntil() {}, passThroughOnException() {} };
const origin = "https://e2e.example.invalid";
let flowQuoteCode = "";

function headers(admin = false) {
  return {
    origin,
    ...(admin ? { "oai-authenticated-user-email": ADMIN_EMAIL } : {}),
  };
}

async function request(path, options = {}) {
  const worker = await workerPromise;
  const response = await worker.fetch(new Request(`${origin}${path}`, options), runtime, execution);
  const type = response.headers.get("content-type") || "";
  const body = type.includes("json") ? await response.json() : await response.text();
  return { response, body };
}

function jsonRequest(path, method, body, admin = false, extraHeaders = {}) {
  return request(path, {
    method,
    headers: { ...headers(admin), "content-type": "application/json", ...extraHeaders },
    body: JSON.stringify(body),
  });
}

const selection = {
  productSlug: "sudadera-gildan-18500",
  productCategory: "hoodie",
  product: "Sudadera manipulada por cliente",
  model: "Modelo manipulado",
  color: "Azul marino",
  printColor: "Blanco",
  designPath: "upload",
  designStyle: "classic",
  backDesign: "PROMO 26",
  frontType: "coordinates",
  frontText: "40°25′N · 3°42′O",
  frontTechnique: "print",
  frontDesign: "Coordenadas en pecho",
  sleeveFlag: "none",
  sleeveDetail: "",
  sleeveTechnique: "print",
  sleeve: "Sin extra",
  basePrice: "0 €",
  configuredPrice: "0 €",
};

function garment(index, overrides = {}) {
  const sizes = ["S", "M", "L", "XL", "2XL", "3XL"];
  return {
    printName: `E2E-${index}`,
    size: sizes[index % sizes.length],
    namePlacement: index % 2 ? "back" : "front",
    frontExtra: index % 5 === 0 ? "coordinates" : "none",
    frontDetail: index % 5 === 0 ? `${40 + index}°N` : "",
    sleeveExtra: index % 4 === 0 ? "embroidered_flag" : index % 3 === 0 ? "dtf_flag" : "none",
    sleeveDetail: index % 4 === 0 ? "Madrid" : index % 3 === 0 ? "España" : "",
    ...overrides,
  };
}

function idempotency(label) {
  return `e2e-${label}-${"x".repeat(30)}`.slice(0, 70);
}

function decodeParameters(encoded) {
  const normalized = encoded.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(encoded.length / 4) * 4, "=");
  return JSON.parse(Buffer.from(normalized, "base64").toString("utf8"));
}

function base64Url(bytes) {
  return Buffer.from(bytes).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

async function signParameters(merchantParameters, order) {
  const encoder = new TextEncoder();
  const normalizedKey = SIGNING_KEY.slice(0, 16).padEnd(16, "0");
  const aesKey = await crypto.subtle.importKey("raw", encoder.encode(normalizedKey), { name: "AES-CBC" }, false, ["encrypt"]);
  const diversified = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-CBC", iv: new Uint8Array(16) }, aesKey, encoder.encode(order)));
  const hmacKey = await crypto.subtle.importKey("raw", encoder.encode(Buffer.from(diversified).toString("base64")), { name: "HMAC", hash: "SHA-512" }, false, ["sign"]);
  return base64Url(new Uint8Array(await crypto.subtle.sign("HMAC", hmacKey, encoder.encode(merchantParameters))));
}

async function redsysNotification(payment, responseCode, authorizationCode = "E2E001") {
  const parameters = {
    Ds_Order: payment.merchant_order,
    Ds_Amount: String(payment.amount_cents),
    Ds_Currency: "978",
    Ds_MerchantCode: "999008881",
    Ds_Terminal: "001",
    Ds_Response: responseCode,
    Ds_AuthorisationCode: authorizationCode,
    Ds_MerchantData: payment.reference,
  };
  const merchantParameters = base64Url(new TextEncoder().encode(JSON.stringify(parameters)));
  const form = new FormData();
  form.set("Ds_SignatureVersion", "HMAC_SHA512_V2");
  form.set("Ds_MerchantParameters", merchantParameters);
  form.set("Ds_Signature", await signParameters(merchantParameters, payment.merchant_order));
  return request("/api/pagos/redsys/notificacion", { method: "POST", body: form });
}

async function register(code, contactName, email, garments) {
  const result = await jsonRequest(`/api/pedidos/${code}`, "POST", { contactName, email, garments });
  assert.equal(result.response.status, 201, JSON.stringify(result.body));
  return new URL(result.body.editUrl).pathname.split("/").pop();
}

async function startPayment(body, key) {
  return jsonRequest("/api/pagos/iniciar", "POST", body, false, { "idempotency-key": idempotency(key) });
}

test("critical 25-garment flow preserves data through production export", async (t) => {
  await t.test("denies admin access and disables demo mutations by default", async () => {
    assert.equal((await request("/api/admin/resumen")).response.status, 403);
    assert.equal((await request("/api/admin/grupos/TSG-DEMO", { method: "PATCH", headers: { ...headers(), "content-type": "application/json" }, body: JSON.stringify({ action: "open_payment" }) })).response.status, 403);
    assert.equal((await request("/api/pedidos/TSG-DEMO")).response.status, 404);
    assert.equal((await request("/api/participantes/TSG-DEMO-EDIT")).response.status, 404);
  });

  await t.test("manual quantities and quote snapshot use authoritative commercial data", async () => {
    const quoteForm = new FormData();
    Object.entries({
      organizerName: "Organizador E2E",
      phone: "600000000",
      email: "organizador@example.invalid",
      groupName: "Grupo E2E 25",
      groupType: "Universidad o promoción",
      location: "Madrid",
      quantity: "25",
      desiredDate: "2026-09-30",
      notes: "Fixture sintético sin datos reales",
      referenceUrl: "https://example.invalid/referencia",
      configuration: JSON.stringify(selection),
      privacyAccepted: "true",
    }).forEach(([key, value]) => quoteForm.set(key, value));
    quoteForm.set("designFile", new File(["%PDF-1.4\n%%EOF"], "diseno-e2e.pdf", { type: "application/pdf" }));
    const created = await request("/api/presupuestos", { method: "POST", headers: headers(), body: quoteForm });
    assert.equal(created.response.status, 201, JSON.stringify(created.body));
    assert.equal(created.body.pricing.baseUnitPriceCents, 2600);
    assert.equal(created.body.pricing.quotedUnitPriceCents, 2600);
    assert.equal(bucket.objects.size, 1);
    t.diagnostic(`quote=${created.body.code}`);
    flowQuoteCode = created.body.code;

    const stored = db.query("SELECT configuration_json FROM quote_requests WHERE code = ?", created.body.code);
    const configuration = JSON.parse(stored.configuration_json);
    assert.equal(configuration.model, "Gildan 18500");
    assert.equal(configuration.product, "Sudadera");
    assert.equal(configuration.basePrice, "26 € por unidad");
    assert.equal(configuration.commercialSnapshot.baseIncludes, "Sudadera + impresión en pecho + espalda + nombre");
    assert.equal(configuration.commercialSnapshot.quotedUnitPriceCents, 2600);

    const quoteOnly = await request(`/api/pedidos/${created.body.code}`);
    assert.equal(quoteOnly.body.kind, "quote");
    assert.equal(db.query("SELECT count(*) AS total FROM group_orders").total, 0);

    const large = await jsonRequest("/api/presupuestos", "POST", {
      organizerName: "Organizador 500", phone: "600000001", email: "cantidad500@example.invalid",
      groupName: "Grupo 500", groupType: "Otro", location: "Madrid", quantity: 500,
      configuration: selection, privacyAccepted: true,
    });
    assert.equal(large.response.status, 201, JSON.stringify(large.body));
    assert.equal(large.body.pricing.quotedUnitPriceCents, null);
  });

  const code = flowQuoteCode;
  const approvalPayload = { unitPriceCents: 2600, deadline: "2026-09-30", designApproved: true };
  const [approvalA, approvalB] = await Promise.all([
    jsonRequest(`/api/admin/presupuestos/${code}/aprobar`, "POST", approvalPayload, true),
    jsonRequest(`/api/admin/presupuestos/${code}/aprobar`, "POST", approvalPayload, true),
  ]);
  assert.ok([200, 201].includes(approvalA.response.status), JSON.stringify(approvalA.body));
  assert.ok([200, 201].includes(approvalB.response.status), JSON.stringify(approvalB.body));
  assert.equal(approvalA.body.group.accessCode, approvalB.body.group.accessCode);
  assert.equal(db.query("SELECT count(*) AS total FROM group_orders WHERE quote_id = (SELECT id FROM quote_requests WHERE code = ?)", code).total, 1);
  const groupCode = approvalA.body.group.accessCode;
  assert.match(groupCode, /^TSG-[A-F0-9]{20}$/);
  const groupRow = db.query("SELECT * FROM group_orders WHERE access_code = ?", groupCode);
  assert.equal(groupRow.unit_price_cents, 2600);
  assert.equal(JSON.parse(groupRow.configuration_json).approvedCommercial.approvedUnitPriceCents, 2600);

  const fileDownload = await request(`/api/admin/presupuestos/${code}/archivo`, { headers: headers(true) });
  assert.equal(fileDownload.response.status, 200);
  assert.equal(fileDownload.response.headers.get("content-type"), "application/pdf");
  assert.equal((await request("/api/pedidos/TSG-FFFFFFFFFFFFFFFFFFFF")).response.status, 404);

  const participantGarments = [
    [garment(1, { printName: "ANA" })],
    [garment(2, { printName: "BRUNO" }), garment(3, { printName: "BRUNO-2" })],
    Array.from({ length: 10 }, (_, index) => garment(index + 4)),
    Array.from({ length: 12 }, (_, index) => garment(index + 14)),
  ];
  const tokens = await Promise.all(participantGarments.map((garments, index) => register(
    groupCode,
    `Participante ${index + 1}`,
    `participante${index + 1}@example.invalid`,
    garments,
  )));
  assert.equal(db.query("SELECT count(*) AS total FROM participants WHERE group_id = ?", groupRow.id).total, 4);
  assert.equal(db.query("SELECT sum(quantity) AS total FROM order_items oi JOIN participants p ON p.id = oi.participant_id WHERE p.group_id = ?", groupRow.id).total, 25);

  const firstBefore = await request(`/api/participantes/${tokens[0]}`);
  const editedGarments = [garment(30, { printName: "BRUNO-EDITADO", size: "3XL" }), garment(31, { printName: "BRUNO-DOS", frontExtra: "coordinates", frontDetail: "41°N" })];
  const edit = await jsonRequest(`/api/participantes/${tokens[1]}`, "PATCH", { contactName: "Participante 2 editado", email: "participante2@example.invalid", garments: editedGarments });
  assert.equal(edit.response.status, 200, JSON.stringify(edit.body));
  const firstAfter = await request(`/api/participantes/${tokens[0]}`);
  assert.deepEqual(firstAfter.body.garments, firstBefore.body.garments);
  assert.equal((await request(`/api/participantes/${tokens[1]}`)).body.garments[0].printName, "BRUNO-EDITADO");

  db.execute("UPDATE product_price_tiers SET unit_price_cents = 9900 WHERE min_quantity = 21");
  const closed = await jsonRequest(`/api/admin/grupos/${groupCode}`, "PATCH", { action: "close_registration", unitPriceCents: 8800 }, true);
  assert.equal(closed.response.status, 200, JSON.stringify(closed.body));
  assert.equal(closed.body.group.estimatedQuantity, 25);
  assert.equal(closed.body.group.unitPriceCents, 2600);
  assert.equal(JSON.parse(closed.body.group.configurationJson).closedCommercial.unitPriceCents, 2600);
  assert.equal((await jsonRequest(`/api/participantes/${tokens[1]}`, "PATCH", { contactName: "No", email: "no@example.invalid", garments: editedGarments })).response.status, 409);
  const opened = await jsonRequest(`/api/admin/grupos/${groupCode}`, "PATCH", { action: "open_payment" }, true);
  assert.equal(opened.response.status, 200, JSON.stringify(opened.body));
  assert.equal(opened.body.group.paymentStatus, "open");
  const frozenItemsBeforePayment = db.queryAll("SELECT participant_id, product_name, model, color, quantity, print_name, size, name_placement, front_extra, front_detail, sleeve_extra, sleeve_detail, extras_cents, unit_price_cents FROM order_items WHERE participant_id IN (SELECT id FROM participants WHERE group_id = ?) ORDER BY id", groupRow.id);

  const [cardStart, secondCardStart] = await Promise.all([
    startPayment({ method: "card", scope: "participant", participantToken: tokens[0] }, "p1-card"),
    startPayment({ method: "card", scope: "participant", participantToken: tokens[1] }, "p2-card"),
  ]);
  for (const started of [cardStart, secondCardStart]) {
    assert.equal(started.response.status, 201, JSON.stringify(started.body));
    assert.equal(started.body.kind, "redsys");
    assert.equal(started.body.status, "processing");
    assert.equal(started.body.form.action, "https://sis-t.redsys.es:25443/sis/realizarPago");
    const parameters = decodeParameters(started.body.form.fields.Ds_MerchantParameters);
    assert.equal(parameters.DS_MERCHANT_MERCHANTURL, `${origin}/api/pagos/redsys/notificacion`);
    assert.equal(parameters.DS_MERCHANT_URLOK.includes("estado=pendiente"), true);
  }
  const organizerBlocked = await startPayment({ method: "card", scope: "remaining", groupCode }, "organizer-blocked");
  assert.equal(organizerBlocked.response.status, 409);

  const p1Payment = db.query("SELECT * FROM payments WHERE reference = ?", cardStart.body.reference);
  const p2FailedPayment = db.query("SELECT * FROM payments WHERE reference = ?", secondCardStart.body.reference);
  const simultaneousParticipantCallbacks = await Promise.all([
    redsysNotification(p1Payment, "0000", "AUTH-P1"),
    redsysNotification(p2FailedPayment, "0190", ""),
  ]);
  assert.deepEqual(simultaneousParticipantCallbacks.map((result) => result.response.status), [200, 200]);
  assert.equal((await redsysNotification(p1Payment, "0000", "AUTH-P1")).response.status, 200);
  assert.equal(db.query("SELECT count(*) AS total FROM payment_events WHERE payment_id = ? AND event_type = 'payment_confirmed'", p1Payment.id).total, 1);
  assert.equal(db.query("SELECT count(*) AS total FROM invoices WHERE payment_id = ?", p1Payment.id).total, 1);
  assert.equal(db.query("SELECT status FROM payments WHERE id = ?", p2FailedPayment.id).status, "failed");

  const bizum = await startPayment({ method: "bizum", scope: "participant", participantToken: tokens[1] }, "p2-bizum");
  assert.equal(bizum.response.status, 201, JSON.stringify(bizum.body));
  const bizumParams = decodeParameters(bizum.body.form.fields.Ds_MerchantParameters);
  assert.equal(bizumParams.DS_MERCHANT_PAYMETHODS, "z");
  const cancelUrl = new URL(bizumParams.DS_MERCHANT_URLKO);
  const cancelled = await jsonRequest(`/api/pagos/${bizum.body.reference}/cancelar`, "POST", { token: cancelUrl.searchParams.get("token") });
  assert.equal(cancelled.response.status, 200, JSON.stringify(cancelled.body));
  assert.equal(cancelled.body.status, "cancelled");
  const cancelledPayment = db.query("SELECT * FROM payments WHERE reference = ?", bizum.body.reference);
  const collectedBeforeLate = db.query("SELECT coalesce(sum(amount_cents), 0) AS total FROM payments WHERE group_id = ? AND status = 'confirmed'", groupRow.id).total;
  assert.equal((await redsysNotification(cancelledPayment, "0000", "LATE01")).response.status, 409);
  assert.equal(db.query("SELECT status FROM payments WHERE id = ?", cancelledPayment.id).status, "cancelled");
  assert.equal(db.query("SELECT coalesce(sum(amount_cents), 0) AS total FROM payments WHERE group_id = ? AND status = 'confirmed'", groupRow.id).total, collectedBeforeLate);

  const p2Transfer = await startPayment({ method: "transfer", scope: "participant", participantToken: tokens[1] }, "p2-transfer");
  assert.equal(p2Transfer.response.status, 201);
  assert.equal(p2Transfer.body.status, "pending");
  const p2ConcurrentValidation = await Promise.all([
    jsonRequest(`/api/admin/pagos/${p2Transfer.body.reference}`, "PATCH", { action: "confirm" }, true),
    jsonRequest(`/api/admin/pagos/${p2Transfer.body.reference}`, "PATCH", { action: "confirm" }, true),
  ]);
  assert.deepEqual(p2ConcurrentValidation.map((result) => result.response.status), [200, 200]);
  const p2TransferRow = db.query("SELECT id FROM payments WHERE reference = ?", p2Transfer.body.reference);
  assert.equal(db.query("SELECT count(*) AS total FROM audit_logs WHERE action = 'transfer_confirmed' AND entity_id = ?", String(p2TransferRow.id)).total, 1);

  const p3Rejected = await startPayment({ method: "transfer", scope: "participant", participantToken: tokens[2] }, "p3-reject");
  assert.equal((await jsonRequest(`/api/admin/pagos/${p3Rejected.body.reference}`, "PATCH", { action: "reject" }, true)).response.status, 200);
  assert.equal(db.query("SELECT status FROM payments WHERE reference = ?", p3Rejected.body.reference).status, "rejected");
  const p3Cancelled = await startPayment({ method: "transfer", scope: "participant", participantToken: tokens[2] }, "p3-cancel");
  assert.equal((await jsonRequest(`/api/admin/pagos/${p3Cancelled.body.reference}`, "PATCH", { action: "cancel" }, true)).response.status, 200);
  assert.equal(db.query("SELECT status FROM payments WHERE reference = ?", p3Cancelled.body.reference).status, "cancelled");
  const p3Confirmed = await startPayment({ method: "transfer", scope: "participant", participantToken: tokens[2] }, "p3-confirm");
  assert.equal((await jsonRequest(`/api/admin/pagos/${p3Confirmed.body.reference}`, "PATCH", { action: "confirm" }, true)).response.status, 200);

  const expected = db.query("SELECT sum((oi.unit_price_cents + oi.extras_cents) * oi.quantity) AS total FROM order_items oi JOIN participants p ON p.id = oi.participant_id WHERE p.group_id = ?", groupRow.id).total;
  const confirmedBeforeOrganizer = db.query("SELECT sum(amount_cents) AS total FROM payments WHERE group_id = ? AND status = 'confirmed'", groupRow.id).total;
  const organizer = await startPayment({ method: "card", scope: "remaining", groupCode }, "organizer-final");
  assert.equal(organizer.response.status, 201, JSON.stringify(organizer.body));
  assert.equal(organizer.body.amountCents, expected - confirmedBeforeOrganizer);
  assert.equal((await startPayment({ method: "card", scope: "participant", participantToken: tokens[3] }, "p4-blocked")).response.status, 409);
  const organizerPayment = db.query("SELECT * FROM payments WHERE reference = ?", organizer.body.reference);
  assert.equal((await redsysNotification(organizerPayment, "0000", "AUTH-ORG")).response.status, 200);

  const confirmedTotal = db.query("SELECT sum(amount_cents) AS total FROM payments WHERE group_id = ? AND status = 'confirmed'", groupRow.id).total;
  assert.equal(confirmedTotal, expected);
  assert.ok(confirmedTotal <= expected);
  assert.equal(db.query("SELECT payment_status FROM group_orders WHERE id = ?", groupRow.id).payment_status, "complete");
  assert.deepEqual(db.queryAll("SELECT participant_id, product_name, model, color, quantity, print_name, size, name_placement, front_extra, front_detail, sleeve_extra, sleeve_detail, extras_cents, unit_price_cents FROM order_items WHERE participant_id IN (SELECT id FROM participants WHERE group_id = ?) ORDER BY id", groupRow.id), frozenItemsBeforePayment);
  assert.equal((await jsonRequest(`/api/participantes/${tokens[0]}`, "PATCH", { contactName: "Alterado", email: "alterado@example.invalid", garments: [garment(99)] })).response.status, 409);

  const publicPanel = await request(`/api/pedidos/${groupCode}`);
  assert.equal(publicPanel.body.registeredPeople, 4);
  assert.equal(publicPanel.body.registeredGarments, 25);
  assert.equal(publicPanel.body.paidPeople, 4);
  assert.equal(publicPanel.body.paidGarments, 25);
  assert.equal(publicPanel.body.amountCollectedCents, expected);
  assert.equal(publicPanel.body.amountOutstandingCents, 0);
  assert.equal(publicPanel.body.sizeDistribution.reduce((sum, row) => sum + Number(row.quantity), 0), 25);

  const adminSummary = await request("/api/admin/resumen", { headers: headers(true) });
  assert.equal(adminSummary.response.status, 200);
  assert.equal(adminSummary.body.items.filter((item) => item.groupId === groupRow.id).reduce((sum, item) => sum + item.quantity, 0), 25);
  assert.equal(adminSummary.body.payments.some((payment) => payment.status === "failed"), true);
  assert.equal(adminSummary.body.payments.some((payment) => payment.status === "rejected"), true);
  assert.equal(adminSummary.body.payments.some((payment) => payment.status === "cancelled"), true);
  assert.equal(adminSummary.body.payments.some((payment) => payment.status === "confirmed"), true);

  const exported = await request(`/api/admin/grupos/${groupCode}/exportar`, { headers: headers(true) });
  assert.equal(exported.response.status, 200);
  assert.match(exported.response.headers.get("content-disposition") || "", /\.xls"$/);
  const rows = [...exported.body.matchAll(/<Row>(.*?)<\/Row>/g)].map((match) => [...match[1].matchAll(/<Data[^>]*>(.*?)<\/Data>/g)].map((cell) => cell[1]));
  assert.equal(rows.length, 27);
  const productionRows = rows.slice(1, -1);
  assert.equal(productionRows.reduce((sum, row) => sum + Number(row[7]), 0), 25);
  assert.equal(Math.round(productionRows.reduce((sum, row) => sum + Number(row[16]), 0) * 100), expected);
  assert.equal(rows.at(-1)[0], "TOTALES");
  assert.equal(Number(rows.at(-1)[7]), 25);
  assert.equal(Math.round(Number(rows.at(-1)[16]) * 100), expected);
  assert.equal(productionRows.every((row) => row[3] === "Sudadera" && row[4] === "Gildan 18500" && row[5] === "Azul marino"), true);
  assert.equal(productionRows.every((row) => row[18] === "paid"), true);

  for (const [action, payload] of [
    ["start_production", {}],
    ["set_shipping", { shippingRecipient: "Organizador E2E", shippingAddress: "Calle de prueba 1", shippingPostalCode: "28000", shippingCity: "Madrid", shippingProvince: "Madrid", shippingCountry: "España" }],
    ["mark_shipped", { carrier: "Transportista E2E", trackingCode: "TRACK-E2E" }],
    ["mark_delivered", {}],
  ]) {
    const changed = await jsonRequest(`/api/admin/grupos/${groupCode}`, "PATCH", { action, ...payload }, true);
    assert.equal(changed.response.status, 200, `${action}: ${JSON.stringify(changed.body)}`);
  }
  assert.equal(db.query("SELECT production_status FROM group_orders WHERE id = ?", groupRow.id).production_status, "delivered");

  const revoked = await jsonRequest(`/api/admin/grupos/${groupCode}`, "PATCH", { action: "revoke_private_link" }, true);
  assert.equal(revoked.response.status, 200);
  assert.equal((await request(`/api/pedidos/${groupCode}`)).response.status, 404);
  assert.equal((await request(`/api/participantes/${tokens[0]}`)).response.status, 410);
});
