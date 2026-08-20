import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Administración | Tu Sudadera en Grupo",
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return children;
}
