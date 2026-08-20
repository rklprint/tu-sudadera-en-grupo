import Link from "next/link";
import { FlowFooter, FlowHeader } from "@/app/_components/flow-shell";
import {
  audiencePageList,
  type AudiencePageData,
} from "@/app/_content/audiences";
import { SITE_URL } from "@/lib/site";

export function AudienceLanding({ data }: { data: AudiencePageData }) {
  const pageUrl = `${SITE_URL}/${data.slug}`;
  const quoteHref = `/presupuesto?groupType=${encodeURIComponent(data.groupType)}&backDesign=${encodeURIComponent(data.quoteDesign)}`;
  const relatedPages = audiencePageList.filter(
    (candidate) => candidate.slug !== data.slug,
  );
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Inicio",
            item: SITE_URL,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: data.label,
            item: pageUrl,
          },
        ],
      },
      {
        "@type": "Service",
        "@id": `${pageUrl}#service`,
        name: data.label,
        description: data.metaDescription,
        url: pageUrl,
        provider: { "@id": `${SITE_URL}/#organization` },
        areaServed: { "@type": "Country", name: "España" },
        serviceOutput: "Sudaderas personalizadas para grupos",
      },
      {
        "@type": "FAQPage",
        "@id": `${pageUrl}#preguntas`,
        mainEntity: data.faq.map((item) => ({
          "@type": "Question",
          name: item.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: item.answer,
          },
        })),
      },
    ],
  };

  return (
    <main
      className="flow-page audience-page"
      style={
        {
          "--audience-accent": data.accent,
          "--audience-garment": data.garment,
          "--audience-print": data.print,
        } as React.CSSProperties
      }
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <FlowHeader />

      <nav className="audience-breadcrumbs" aria-label="Migas de pan">
        <Link href="/">Inicio</Link>
        <span>→</span>
        <span aria-current="page">{data.shortLabel}</span>
      </nav>

      <section className="audience-hero">
        <div className="audience-hero-copy">
          <p className="flow-eyebrow">{data.eyebrow}</p>
          <h1>
            {data.title}
            <br />
            <em>{data.titleAccent}</em>
          </h1>
          <p>{data.lead}</p>
          <div className="audience-actions">
            <Link className="audience-primary" href={quoteHref}>
              Pedir presupuesto <span>↗</span>
            </Link>
            <Link className="audience-secondary" href="/#personalizador">
              Probar el personalizador
            </Link>
          </div>
          <div className="audience-hero-proof">
            <span>Diseño inicial incluido</span>
            <span>Desde 5 unidades</span>
            <span>Envíos a toda España</span>
          </div>
        </div>

        <div className="audience-visual" aria-hidden="true">
          <span className="audience-visual-label">HECHO PARA PERTENECER</span>
          <div className="audience-orbit" />
          <div className="audience-hoodie">
            <div className="audience-hood" />
            <div className="audience-sleeve left" />
            <div className="audience-sleeve right" />
            <div className="audience-body">
              <span>{data.hoodieTop}</span>
              <strong>{data.hoodieMain}</strong>
            </div>
          </div>
          <div className="audience-visual-note">
            <small>Vuestra idea</small>
            <strong>Revisada antes de producir</strong>
          </div>
        </div>
      </section>

      <section className="audience-benefits" aria-label="Ventajas del servicio">
        {data.benefits.map((benefit, index) => (
          <article key={benefit.title}>
            <span>{String(index + 1).padStart(2, "0")}</span>
            <h2>{benefit.title}</h2>
            <p>{benefit.text}</p>
          </article>
        ))}
      </section>

      <section className="audience-explainer">
        <div>
          <p className="flow-eyebrow">Un proceso pensado para grupos</p>
          <h2>{data.introTitle}</h2>
        </div>
        <div className="audience-explainer-copy">
          {data.intro.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
          <Link href={quoteHref}>Contarnos vuestra idea →</Link>
        </div>
      </section>

      <section className="audience-ideas">
        <header>
          <p className="flow-eyebrow">Puntos de partida</p>
          <h2>{data.ideasTitle}</h2>
          <p>{data.ideasIntro}</p>
        </header>
        <div>
          {data.ideas.map((idea, index) => (
            <article key={idea.title}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <h3>{idea.title}</h3>
              <p>{idea.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="audience-process">
        <header>
          <p className="flow-eyebrow">De la idea al pedido</p>
          <h2>Primero lo dejamos claro. Después lo producimos.</h2>
        </header>
        <div>
          <article>
            <span>01</span>
            <h3>Pedís presupuesto</h3>
            <p>Nos enviáis cantidad, fecha y las referencias que ya tengáis.</p>
          </article>
          <article>
            <span>02</span>
            <h3>Hablamos por WhatsApp</h3>
            <p>Revisamos la idea, preparamos el diseño y cerramos los detalles.</p>
          </article>
          <article>
            <span>03</span>
            <h3>Aprobáis la propuesta</h3>
            <p>Confirmáis maqueta, cantidad, precio y fecha antes de pagar.</p>
          </article>
          <article>
            <span>04</span>
            <h3>Abrimos el pedido privado</h3>
            <p>Cada persona completa sus datos y paga, o el grupo abona el total.</p>
          </article>
        </div>
      </section>

      <section className="audience-faq" id="preguntas">
        <header>
          <p className="flow-eyebrow">Preguntas frecuentes</p>
          <h2>Lo importante, antes de empezar.</h2>
        </header>
        <div>
          {data.faq.map((item, index) => (
            <details key={item.question} open={index === 0}>
              <summary>
                {item.question}
                <span>+</span>
              </summary>
              <p>{item.answer}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="audience-related">
        <p className="flow-eyebrow">También trabajamos con</p>
        <div>
          {relatedPages.map((page) => (
            <Link key={page.slug} href={`/${page.slug}`}>
              <span>{page.shortLabel}</span>
              <b>↗</b>
            </Link>
          ))}
        </div>
      </section>

      <section className="audience-cta">
        <p>No hace falta que tengáis el diseño terminado.</p>
        <h2>Contadnos quiénes sois.<br /><em>Nosotros le damos forma.</em></h2>
        <Link href={quoteHref}>Pedir presupuesto sin compromiso <span>↗</span></Link>
      </section>

      <FlowFooter />
    </main>
  );
}
