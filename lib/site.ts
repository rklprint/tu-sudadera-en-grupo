import type { Metadata } from "next";

export const SITE_NAME = "Tu Sudadera en Grupo";
export const SITE_URL = "https://tusudaderaengrupo.es";
export const SITE_DESCRIPTION =
  "Sudaderas personalizadas para colegios, fin de curso y grupos desde 22 €. Precio con IVA, diseño, nombres, DTF delante y detrás y envío a Península incluidos.";
export const SOCIAL_IMAGE = "/og-image.png";

const socialImage = {
  url: SOCIAL_IMAGE,
  width: 1200,
  height: 630,
  alt: "Sudaderas personalizadas para grupos — Tu Sudadera en Grupo",
};

type PageMetadataOptions = {
  title: string;
  description: string;
  path: string;
  noIndex?: boolean;
};

export function createPageMetadata({
  title,
  description,
  path,
  noIndex = false,
}: PageMetadataOptions): Metadata {
  const fullTitle = `${title} | ${SITE_NAME}`;

  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      title: fullTitle,
      description,
      url: path,
      siteName: SITE_NAME,
      locale: "es_ES",
      type: "website",
      images: [socialImage],
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: [SOCIAL_IMAGE],
    },
    robots: noIndex
      ? {
          index: false,
          follow: false,
          noarchive: true,
          noimageindex: true,
          googleBot: {
            index: false,
            follow: false,
            noimageindex: true,
          },
        }
      : undefined,
  };
}
