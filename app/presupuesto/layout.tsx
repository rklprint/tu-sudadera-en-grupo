import type { ReactNode } from "react";
import { createPageMetadata } from "@/lib/site";

export const metadata = createPageMetadata({
  title: "Pedir presupuesto de sudaderas personalizadas",
  description:
    "Solicitad un presupuesto sin compromiso para las sudaderas personalizadas de vuestro grupo. Revisamos el diseño y continuamos personalmente por WhatsApp.",
  path: "/presupuesto",
});

export default function QuoteLayout({ children }: { children: ReactNode }) {
  return children;
}
