import {
  Ban,
  CheckCircle2,
  CircleDashed,
  Clock3,
  Factory,
  PackageCheck,
  Send,
  ShieldCheck,
  XCircle,
} from "lucide-react";

type Tone = "neutral" | "info" | "warning" | "success" | "danger";

const STATUS_PRESENTATION: Record<string, { label: string; tone: Tone; Icon: typeof Clock3 }> = {
  pending: { label: "Pendiente", tone: "warning", Icon: Clock3 },
  processing: { label: "Procesando", tone: "info", Icon: CircleDashed },
  approved: { label: "Aprobado", tone: "success", Icon: ShieldCheck },
  open: { label: "Abierto", tone: "info", Icon: CircleDashed },
  registration: { label: "Registro abierto", tone: "info", Icon: CircleDashed },
  locked: { label: "Cerrado", tone: "neutral", Icon: ShieldCheck },
  closed: { label: "Registro cerrado", tone: "warning", Icon: Clock3 },
  paid: { label: "Pagado", tone: "success", Icon: CheckCircle2 },
  confirmed: { label: "Confirmado", tone: "success", Icon: CheckCircle2 },
  complete: { label: "Completado", tone: "success", Icon: CheckCircle2 },
  production: { label: "En producción", tone: "info", Icon: Factory },
  in_production: { label: "En producción", tone: "info", Icon: Factory },
  shipped: { label: "Enviado", tone: "info", Icon: Send },
  delivered: { label: "Entregado", tone: "success", Icon: PackageCheck },
  failed: { label: "Fallido", tone: "danger", Icon: XCircle },
  rejected: { label: "Rechazado", tone: "danger", Icon: XCircle },
  cancelled: { label: "Cancelado", tone: "neutral", Icon: Ban },
};

export function StatusBadge({ status, label }: { status?: string | null; label?: string }) {
  const normalized = (status || "pending").toLowerCase();
  const presentation = STATUS_PRESENTATION[normalized] || {
    label: normalized.replaceAll("_", " "),
    tone: "neutral" as const,
    Icon: CircleDashed,
  };
  const Icon = presentation.Icon;

  return (
    <span className={`status-badge status-badge-${presentation.tone}`} data-status={normalized}>
      <Icon aria-hidden="true" />
      <span>{label || presentation.label}</span>
    </span>
  );
}
