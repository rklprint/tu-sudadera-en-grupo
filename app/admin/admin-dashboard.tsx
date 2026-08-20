"use client";

import { useMemo, useState } from "react";
import { unitPriceForQuantity } from "@/lib/catalog";
import { CatalogManager, type AdminCatalogProduct } from "@/app/admin/catalog-manager";

type Quote = { id: number; code: string; status: string; organizerName: string; phone: string; email: string; groupType: string; location: string; quantity: number; desiredDate: string; notes: string; configurationJson: string; createdAt: string; updatedAt: string; referenceUrl: string; emailStatus: string };
type Group = { id: number; quoteId: number | null; accessCode: string; groupName: string; organizerName: string; organizerEmail: string; organizerPhone: string; garment: string; color: string; estimatedQuantity: number; unitPriceCents: number; designStatus: string; registrationStatus: string; paymentStatus: string; productionStatus: string; deadline: string; shippingAddress: string; shippingRecipient: string; shippingPostalCode: string; shippingCity: string; shippingProvince: string; shippingCountry: string; carrier: string; trackingCode: string; privateLinkRevokedAt: string; configurationJson: string; createdAt: string; updatedAt: string };
type Payment = { id: number; groupId: number; participantId: number | null; reference: string; method: string; amountCents: number; status: string; validatedAt: string; createdAt: string };
type Item = { id: number; groupId: number; contactName: string; email: string; paymentStatus: string; printName: string; size: string; frontExtra: string; frontDetail: string; sleeveExtra: string; sleeveDetail: string; extrasCents: number; unitPriceCents: number };
type Props = { user: { name: string; email: string }; signOutUrl: string; initialQuotes: Quote[]; initialGroups: Group[]; initialPayments: Payment[]; initialItems: Item[]; initialCatalog: AdminCatalogProduct[] };

const money = (cents: number) => `${(cents / 100).toFixed(2).replace(".", ",")} €`;
const parseConfiguration = (value: string) => { try { return JSON.parse(value) as Record<string, string>; } catch { return {}; } };

export function AdminDashboard({ user, signOutUrl, initialQuotes, initialGroups, initialPayments, initialItems, initialCatalog }: Props) {
  const [quotes, setQuotes] = useState(initialQuotes);
  const [groups, setGroups] = useState(initialGroups);
  const [payments, setPayments] = useState(initialPayments);
  const [items, setItems] = useState(initialItems);
  const [openGroup, setOpenGroup] = useState<number | null>(null);
  const [priceDrafts, setPriceDrafts] = useState<Record<number, string>>({});
  const [quotePriceDrafts, setQuotePriceDrafts] = useState<Record<number, string>>({});
  const [shippingDrafts, setShippingDrafts] = useState<Record<number, { shippingAddress: string; shippingRecipient: string; shippingPostalCode: string; shippingCity: string; shippingProvince: string; shippingCountry: string; carrier: string; trackingCode: string }>>({});
  const [tab, setTab] = useState<"quotes" | "groups" | "payments" | "catalog">("quotes");
  const [busy, setBusy] = useState("");
  const [notice, setNotice] = useState("");
  const pendingQuotes = useMemo(() => quotes.filter(quote => !groups.some(group => group.quoteId === quote.id)), [quotes, groups]);

  const approve = async (quote: Quote) => {
    const suggested = suggestedPrice(quote.quantity);
    const rawPrice = quotePriceDrafts[quote.id] ?? (suggested ? String(suggested / 100) : "");
    const unitPriceCents = Math.round(Number(rawPrice.replace(",", ".")) * 100);
    if (!Number.isInteger(unitPriceCents) || unitPriceCents < 100 || unitPriceCents > 100000) {
      setNotice("Define el precio unitario acordado antes de crear el grupo.");
      return;
    }
    setBusy(quote.code); setNotice("");
    try {
      const response = await fetch(`/api/admin/presupuestos/${quote.code}/aprobar`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ unitPriceCents, deadline: quote.desiredDate, designApproved: true }) });
      const result = await response.json() as { group?: Group; error?: string };
      if (!response.ok || !result.group) throw new Error(result.error || "No se pudo abrir el grupo.");
      setGroups(current => [result.group!, ...current]);
      setQuotes(current => current.map(item => item.id === quote.id ? { ...item, status: "approved" } : item));
      setNotice(`Grupo aprobado. Enlace: /pedido/${result.group.accessCode}`);
    } catch (error) { setNotice(error instanceof Error ? error.message : "No se pudo abrir el grupo."); } finally { setBusy(""); }
  };

  const groupAction = async (group: Group, action: string, extra: Record<string, unknown> = {}) => {
    setBusy(`${group.accessCode}:${action}`); setNotice("");
    try {
      const response = await fetch(`/api/admin/grupos/${group.accessCode}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, ...extra }) });
      const result = await response.json() as { group?: Group; error?: string };
      if (!response.ok || !result.group) throw new Error(result.error || "No se pudo actualizar el grupo.");
      setGroups(current => current.map(item => item.id === group.id ? result.group! : item));
      setNotice("Estado actualizado correctamente.");
    } catch (error) { setNotice(error instanceof Error ? error.message : "No se pudo actualizar el grupo."); } finally { setBusy(""); }
  };

  const updateItemExtras = async (item: Item, extrasCents: number) => {
    setBusy(`item:${item.id}`); setNotice("");
    try {
      const response = await fetch(`/api/admin/prendas/${item.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ extrasCents }) });
      const result = await response.json() as { item?: { extrasCents: number }; error?: string };
      if (!response.ok || !result.item) throw new Error(result.error || "No se pudieron actualizar los extras.");
      setItems(current => current.map(currentItem => currentItem.id === item.id ? { ...currentItem, extrasCents: result.item!.extrasCents } : currentItem));
      setNotice("Extras de la prenda actualizados.");
    } catch (error) { setNotice(error instanceof Error ? error.message : "No se pudieron actualizar los extras."); } finally { setBusy(""); }
  };

  const validatePayment = async (payment: Payment, action: "confirm" | "reject" | "cancel" = "confirm") => {
    setBusy(payment.reference); setNotice("");
    try {
      const response = await fetch(`/api/admin/pagos/${payment.reference}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action }) });
      const result = await response.json() as { payment?: Payment; error?: string };
      if (!response.ok || !result.payment) throw new Error(result.error || "No se pudo validar la transferencia.");
      setPayments(current => current.map(item => item.id === payment.id ? result.payment! : item));
      setNotice(action === "confirm" ? "Transferencia validada." : action === "reject" ? "Transferencia rechazada." : "Transferencia cancelada.");
    } catch (error) { setNotice(error instanceof Error ? error.message : "No se pudo validar la transferencia."); } finally { setBusy(""); }
  };

  return <main className="admin-page">
    <header className="admin-topbar"><div><span className="admin-mark">TSG</span><div><strong>Panel operativo</strong><small>Tu Sudadera en Grupo</small></div></div><div><span>{user.name}<small>{user.email}</small></span><a href={signOutUrl}>Cerrar sesión</a></div></header>
    <section className="admin-shell">
      <header className="admin-title"><div><p>Administración privada</p><h1>Pedidos sin ruido.</h1></div><div className="admin-kpis"><span><b>{pendingQuotes.length}</b> solicitudes pendientes</span><span><b>{groups.length}</b> grupos activos</span><span><b>{payments.filter(payment => payment.status === "pending").length}</b> transferencias por validar</span></div></header>
      <nav className="admin-tabs"><button className={tab === "quotes" ? "active" : ""} onClick={() => setTab("quotes")}>Presupuestos <span>{pendingQuotes.length}</span></button><button className={tab === "groups" ? "active" : ""} onClick={() => setTab("groups")}>Grupos <span>{groups.length}</span></button><button className={tab === "payments" ? "active" : ""} onClick={() => setTab("payments")}>Transferencias <span>{payments.filter(payment => payment.status === "pending").length}</span></button><button className={tab === "catalog" ? "active" : ""} onClick={() => setTab("catalog")}>Catálogo <span>{initialCatalog.length}</span></button></nav>
      {notice && <div className="admin-notice" role="status">{notice}<button onClick={() => setNotice("")}>×</button></div>}

      {tab === "quotes" && <div className="admin-list">{pendingQuotes.length ? pendingQuotes.map(quote => {
        const configuration = parseConfiguration(quote.configurationJson);
        const suggested = suggestedPrice(quote.quantity);
        const priceValue = quotePriceDrafts[quote.id] ?? (suggested ? String(suggested / 100) : "");
        const parsedPrice = Number(priceValue.replace(",", "."));
        const validPrice = Number.isFinite(parsedPrice) && parsedPrice >= 1 && parsedPrice <= 1000;
        return <article className="admin-quote" key={quote.id}>
          <header><div><span>{quote.code}</span><h2>{configuration.groupName || quote.groupType}</h2><p>{quote.organizerName} · {quote.email} · {quote.phone}</p></div><time>{new Date(quote.createdAt).toLocaleDateString("es-ES")}</time></header>
          <div className="admin-detail-grid"><p><span>Cantidad prevista</span><b>{quote.quantity} prendas</b></p><p><span>Color</span><b>{configuration.color || "Por confirmar"}</b></p><p><span>Precio de referencia</span><b>{suggested ? money(suggested) : "A consultar"}</b></p><p><span>Fecha deseada</span><b>{quote.desiredDate || "Sin fecha"}</b></p></div>
          <label className="admin-quote-price"><span>{suggested ? "Precio unitario acordado" : "Precio obligatorio para 101+"}</span><div><input type="number" min="1" max="1000" step="0.01" value={priceValue} onChange={event => setQuotePriceDrafts(current => ({ ...current, [quote.id]: event.target.value }))} /><b>€</b></div><small>Se confirma con el organizador antes de abrir el enlace.</small></label>
          {quote.notes && <p className="admin-notes">{quote.notes}</p>}
          <footer><a href={`/pedido/${quote.code}`} target="_blank">Ver solicitud</a>{configuration.designFileName && <a href={`/api/admin/presupuestos/${quote.code}/archivo`}>Descargar {configuration.designFileName}</a>}<button disabled={busy === quote.code || !validPrice} onClick={() => approve(quote)}>{busy === quote.code ? "Creando…" : "Aprobar y crear enlace →"}</button></footer>
        </article>;
      }) : <EmptyState text="No hay presupuestos pendientes." />}</div>}

      {tab === "groups" && <div className="admin-list">{groups.length ? groups.map(group => {
        const groupItems = items.filter(item => item.groupId === group.id);
        const priceValue = priceDrafts[group.id] ?? String(group.unitPriceCents / 100);
        const shipping = shippingDrafts[group.id] || { shippingAddress: group.shippingAddress || "", shippingRecipient: group.shippingRecipient || "", shippingPostalCode: group.shippingPostalCode || "", shippingCity: group.shippingCity || "", shippingProvince: group.shippingProvince || "", shippingCountry: group.shippingCountry || "España", carrier: group.carrier || "", trackingCode: group.trackingCode || "" };
        const setShippingField = (field: keyof typeof shipping, value: string) => setShippingDrafts(current => ({ ...current, [group.id]: { ...shipping, [field]: value } }));
        return <article className="admin-group" key={group.id}>
          <header><div><span>{group.accessCode}</span><h2>{group.groupName}</h2><p>{group.garment} · {group.color} · {money(group.unitPriceCents)}</p></div><a href={`/pedido/${group.accessCode}`} target="_blank">Abrir enlace ↗</a></header>
          <div className="group-state-grid"><p><span>Diseño</span><b>{group.designStatus}</b></p><p><span>Registro</span><b>{group.registrationStatus}</b></p><p><span>Pagos</span><b>{group.paymentStatus}</b></p><p><span>Producción</span><b>{group.productionStatus}</b></p></div>
          <div className="admin-price-control"><label><span>Precio base por prenda</span><div><input type="number" min="1" step="0.01" disabled={group.paymentStatus !== "locked"} value={priceValue} onChange={event => setPriceDrafts(current => ({ ...current, [group.id]: event.target.value }))} /><b>€</b></div></label><button disabled={!!busy || group.paymentStatus !== "locked"} onClick={() => groupAction(group, "set_price", { unitPriceCents: Math.round(Number(priceValue.replace(",", ".")) * 100) })}>Guardar precio</button><button className="toggle-items" onClick={() => setOpenGroup(openGroup === group.id ? null : group.id)}>{openGroup === group.id ? "Ocultar prendas" : `Revisar prendas (${groupItems.length})`}</button></div>
          {openGroup === group.id && <div className="admin-item-list">{groupItems.length ? groupItems.map(item => <AdminItemRow key={item.id} item={item} locked={group.paymentStatus !== "locked" || item.paymentStatus === "paid"} busy={busy === `item:${item.id}`} onSave={updateItemExtras} />) : <p>Este grupo todavía no tiene prendas registradas.</p>}</div>}
          <section className="admin-shipping"><header><strong>Envío conjunto del grupo</strong><span>El seguimiento se comunica solo al organizador.</span></header><div><label><span>Destinatario</span><input value={shipping.shippingRecipient} onChange={event => setShippingField("shippingRecipient", event.target.value)} /></label><label><span>Dirección</span><input value={shipping.shippingAddress} onChange={event => setShippingField("shippingAddress", event.target.value)} /></label><label><span>Código postal</span><input value={shipping.shippingPostalCode} onChange={event => setShippingField("shippingPostalCode", event.target.value)} /></label><label><span>Localidad</span><input value={shipping.shippingCity} onChange={event => setShippingField("shippingCity", event.target.value)} /></label><label><span>Provincia</span><input value={shipping.shippingProvince} onChange={event => setShippingField("shippingProvince", event.target.value)} /></label><label><span>País</span><input value={shipping.shippingCountry} onChange={event => setShippingField("shippingCountry", event.target.value)} /></label><label><span>Transportista</span><input value={shipping.carrier} onChange={event => setShippingField("carrier", event.target.value)} /></label><label><span>Seguimiento</span><input value={shipping.trackingCode} onChange={event => setShippingField("trackingCode", event.target.value)} /></label></div><button disabled={!!busy} onClick={() => groupAction(group, "set_shipping", shipping)}>Guardar envío</button></section>
          <footer className="admin-action-row"><button disabled={!!busy || group.registrationStatus !== "open" || groupItems.length < 1} onClick={() => groupAction(group, "close_registration", { unitPriceCents: Math.round(Number(priceValue.replace(",", ".")) * 100) })}>Cerrar registro y recalcular</button><button disabled={!!busy || group.registrationStatus === "open" || group.paymentStatus !== "locked"} onClick={() => groupAction(group, "open_payment")}>Abrir pagos</button><button disabled={!!busy || group.paymentStatus !== "open"} onClick={() => groupAction(group, "complete_payment")}>Marcar pago completo</button><button disabled={!!busy || group.paymentStatus !== "complete"} onClick={() => groupAction(group, "start_production")}>Iniciar producción</button><button disabled={!!busy || group.productionStatus !== "in_production" || !shipping.carrier || !shipping.trackingCode} onClick={() => groupAction(group, "mark_shipped", { carrier: shipping.carrier, trackingCode: shipping.trackingCode })}>Marcar enviado</button><button disabled={!!busy || group.productionStatus !== "shipped"} onClick={() => groupAction(group, "mark_delivered")}>Marcar entregado</button><button disabled={!!busy || !!group.privateLinkRevokedAt} onClick={() => groupAction(group, "revoke_private_link")}>Revocar enlace</button><a href={`/api/admin/grupos/${group.accessCode}/exportar`}>Exportar CSV</a></footer>
        </article>;
      }) : <EmptyState text="Todavía no hay grupos aprobados." />}</div>}

      {tab === "payments" && <div className="admin-list">{payments.length ? payments.map(payment => <article className="admin-payment" key={payment.id}><div><span>{payment.reference}</span><strong>{payment.method}</strong><small>{new Date(payment.createdAt).toLocaleString("es-ES")}</small></div><b>{money(payment.amountCents)}</b><em className={`payment-${payment.status}`}>{payment.status}</em>{payment.status === "pending" && payment.method === "transfer" ? <div className="payment-admin-actions"><button disabled={busy === payment.reference} onClick={() => validatePayment(payment, "confirm")}>Validar</button><button disabled={busy === payment.reference} onClick={() => validatePayment(payment, "reject")}>Rechazar</button><button disabled={busy === payment.reference} onClick={() => validatePayment(payment, "cancel")}>Cancelar</button></div> : <span />}</article>) : <EmptyState text="No hay pagos registrados." />}</div>}
      {tab === "catalog" && <CatalogManager initialProducts={initialCatalog} />}
    </section>
  </main>;
}

function AdminItemRow({ item, locked, busy, onSave }: { item: Item; locked: boolean; busy: boolean; onSave: (item: Item, extrasCents: number) => Promise<void> }) {
  const [value, setValue] = useState(String(item.extrasCents / 100));
  return <article className="admin-item-row">
    <div><strong>{item.printName} · {item.size}</strong><span>{item.contactName} · {item.email}</span></div>
    <div><span>Pecho</span><b>{item.frontExtra}{item.frontDetail ? ` · ${item.frontDetail}` : ""}</b></div>
    <div><span>Manga</span><b>{item.sleeveExtra}{item.sleeveDetail ? ` · ${item.sleeveDetail}` : ""}</b></div>
    <label><span>Extras manuales</span><div><input type="number" min="0" step="0.01" disabled={locked || busy} value={value} onChange={event => setValue(event.target.value)} /><b>€</b></div></label>
    <button disabled={locked || busy} onClick={() => onSave(item, Math.round(Number(value.replace(",", ".")) * 100))}>{busy ? "Guardando…" : "Guardar"}</button>
  </article>;
}

function suggestedPrice(quantity: number): number | null { return unitPriceForQuantity(quantity); }
function EmptyState({ text }: { text: string }) { return <div className="admin-empty"><span>✓</span><strong>{text}</strong><p>El panel se actualizará cuando haya nueva actividad.</p></div>; }
