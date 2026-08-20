import type { ReactNode } from "react";
import { createPageMetadata } from "@/lib/site";

export const metadata = createPageMetadata({
  title: "Solicitud de presupuesto recibida",
  description:
    "Confirmación privada de una solicitud de presupuesto de Tu Sudadera en Grupo.",
  path: "/presupuesto/recibido",
  noIndex: true,
});

export default function QuoteReceivedLayout({
  children,
}: {
  children: ReactNode;
}) {
  return children;
}
