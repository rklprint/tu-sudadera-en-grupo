import { AudienceLanding } from "@/app/_components/audience-landing";
import { audiencePages } from "@/app/_content/audiences";
import { createPageMetadata } from "@/lib/site";

const data = audiencePages.graduation;

export const metadata = createPageMetadata({
  title: "Sudaderas de fin de curso y promociones",
  description: data.metaDescription,
  path: `/${data.slug}`,
});

export default function GraduationHoodiesPage() {
  return <AudienceLanding data={data} />;
}
