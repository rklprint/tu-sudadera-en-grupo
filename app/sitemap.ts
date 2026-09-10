import type { MetadataRoute } from "next";
import { audiencePageList } from "@/app/_content/audiences";
import { SITE_URL } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date("2026-08-20T00:00:00+02:00");

  return [
    {
      url: SITE_URL,
      lastModified,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${SITE_URL}/presupuesto`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    ...audiencePageList.map((page) => ({
      url: `${SITE_URL}/${page.slug}`,
      lastModified,
      changeFrequency: "monthly" as const,
      priority: 0.85,
    })),
  ];
}
