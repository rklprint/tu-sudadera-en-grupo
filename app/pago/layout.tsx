import type { Metadata } from "next";

export const metadata: Metadata = { title: "Estado del pago | Tu Sudadera en Grupo", robots: { index: false, follow: false } };

export default function PaymentLayout({ children }: { children: React.ReactNode }) { return children; }
