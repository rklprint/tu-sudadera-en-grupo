import { AudienceLanding } from "@/app/_components/audience-landing";
import { audiencePages } from "@/app/_content/audiences";
import { createPageMetadata } from "@/lib/site";

const data = audiencePages.schools;

export const metadata = createPageMetadata({
  title: "Sudaderas personalizadas para colegios e institutos",
  description: data.metaDescription,
  path: `/${data.slug}`,
});

export default function SchoolHoodiesPage() {
  return <AudienceLanding data={data} />;
}
