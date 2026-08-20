"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FlowFooter, FlowHeader } from "@/app/_components/flow-shell";
import { GarmentEditor, type GarmentDraft } from "@/app/_components/garment-editor";

type ParticipantData = {
  contactName: string;
  email: string;
  editable: boolean;
  paymentStatus: string;
  group: { code: string; name: string; garment: string; color: string; unitPriceCents: number; registrationStatus: string; paymentStatus: string };
  garments: GarmentDraft[];
};

export default function ParticipantPage() {
  const pathname = usePathname();
  const token = decodeURIComponent(pathname.split("/").filter(Boolean).pop() || "");
  const [data, setData] = useState<ParticipantData | null>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!token) return;
    fetch(`/api/participantes/${encodeURIComponent(token)}`)
      .then(async response => {
        const result = await response.json() as ParticipantData & { error?: string };
        if (!response.ok) throw new Error(result.error || "No hemos podido abrir tu selección.");
        setData(result);
      })
      .catch(fetchError => setError(fetchError instanceof Error ? fetchError.message : "No hemos podido abrir tu selección."));
  }, [token]);

  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!data) return;
    setSaving(true);
    setSaved(false);
    setError("");
    try {
      const response = await fetch(`/api/participantes/${encodeURIComponent(token)}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ contactName: data.contactName, email: data.email, garments: data.garments }) });
      const result = await response.json() as { ok?: boolean; error?: string };
      if (!response.ok) throw new Error(result.error || "No hemos podido guardar los cambios.");
      setSaved(true);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "No hemos podido guardar los cambios.");
    } finally { setSaving(false); }
  };

  if (error && !data) return <main className="flow-page"><FlowHeader current="order" /><section className="order-state-card error-state"><span>?</span><p className="flow-eyebrow">Enlace privado</p><h1>No podemos abrir<br /><em>esta selección.</em></h1><p>{error}</p><div><Link className="primary-flow-action" href="/pedido">Volver al pedido</Link></div></section><FlowFooter /></main>;
  if (!data) return <main className="flow-page"><FlowHeader current="order" /><section className="order-loading"><i /><p>Abriendo tus prendas…</p></section><FlowFooter /></main>;

  return <main className="flow-page participant-page"><FlowHeader current="order" /><section className="participant-shell">
    <header><div><p className="flow-eyebrow">Selección privada · {data.group.name}</p><h1>Tus prendas,<br /><em>bajo control.</em></h1><p>{data.group.garment} · {data.group.color}. Este enlace es personal y permite corregir los datos hasta el pago.</p></div><Link href={`/pedido/${data.group.code}`}>Ver resumen del grupo →</Link></header>
    {!data.editable && <div className="locked-selection"><span>⌁</span><div><strong>Selección bloqueada</strong><p>{data.paymentStatus === "paid" ? "El pago ya está confirmado. Cualquier cambio debe revisarse con nuestro equipo." : "El registro del grupo ya está cerrado y el precio definitivo está en revisión."}</p></div></div>}
    <form className="participant-edit-card" onSubmit={save}>
      <div className="participant-fields"><label><span>Nombre de contacto</span><input required disabled={!data.editable} value={data.contactName} onChange={event => setData({ ...data, contactName: event.target.value })} /></label><label><span>Correo del enlace privado</span><input required type="email" disabled={!data.editable} value={data.email} onChange={event => setData({ ...data, email: event.target.value })} /></label></div>
      <GarmentEditor garments={data.garments} onChange={garments => setData({ ...data, garments })} unitPriceCents={data.group.unitPriceCents} disabled={!data.editable || saving} />
      {error && <p className="form-error" role="alert">{error}</p>}
      {saved && <p className="form-success" role="status">Cambios guardados correctamente.</p>}
      {data.editable && <button className="registration-submit" disabled={saving} type="submit"><span>{saving ? "Guardando…" : "Guardar cambios"}<small>Actualiza todas tus prendas</small></span><b>✓</b></button>}
    </form>
  </section><FlowFooter /></main>;
}
