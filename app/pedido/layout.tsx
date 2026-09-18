import type { ReactNode } from "react";
import { createPageMetadata } from "@/lib/site";

export const metadata = createPageMetadata({
  title: "Acceso privado al pedido",
  description:
    "Acceso privado para consultar tallas, personalizaciones, pagos y estado de un pedido aprobado.",
  path: "/pedido",
  noIndex: true,
});

export default function OrderLayout({ children }: { children: ReactNode }) {
  return children;
}
