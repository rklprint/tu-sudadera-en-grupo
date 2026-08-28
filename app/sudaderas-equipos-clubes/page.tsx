import { AudienceLanding } from "@/app/_components/audience-landing";
import { audiencePages } from "@/app/_content/audiences";
import { createPageMetadata } from "@/lib/site";

const data = audiencePages.teams;

export const metadata = createPageMetadata({
  title: "Sudaderas personalizadas para equipos y clubes",
  description: data.metaDescription,
  path: `/${data.slug}`,
});

export default function TeamHoodiesPage() {
  return <AudienceLanding data={data} />;
}
