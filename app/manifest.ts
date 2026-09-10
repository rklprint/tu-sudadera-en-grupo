import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Tu Sudadera en Grupo",
    short_name: "TSG",
    description:
      "Diseño y producción de sudaderas personalizadas para grupos.",
    start_url: "/",
    display: "standalone",
    background_color: "#f4f0e7",
    theme_color: "#0b1830",
    lang: "es",
    icons: [
      {
        src: "/favicon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
  };
}
