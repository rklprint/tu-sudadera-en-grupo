import Link from "next/link";
import { FlowFooter, FlowHeader } from "@/app/_components/flow-shell";

export type LegalSection = { title: string; paragraphs: string[]; items?: string[] };

export function LegalPage({ eyebrow, title, notice, sections }: { eyebrow: string; title: string; notice?: string; sections: LegalSection[] }) {
  return <main className="flow-page legal-page"><FlowHeader /><article><header><p className="flow-eyebrow">{eyebrow}</p><h1>{title}</h1>{notice && <p className="legal-notice"><strong>Documento previo al lanzamiento.</strong> {notice}</p>}</header>{sections.map((section) => <section key={section.title}><h2>{section.title}</h2>{section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}{section.items && <ul>{section.items.map((item) => <li key={item}>{item}</li>)}</ul>}</section>)}<nav aria-label="Documentos legales"><Link href="/privacidad">Privacidad</Link><Link href="/cookies">Cookies</Link><Link href="/condiciones">Condiciones</Link></nav></article><FlowFooter /></main>;
}
