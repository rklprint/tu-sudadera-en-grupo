import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tu selección privada | Tu Sudadera en Grupo",
  robots: { index: false, follow: false },
};

export default function ParticipantLayout({ children }: { children: React.ReactNode }) {
  return children;
}
