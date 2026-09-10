import { AudienceLanding } from "@/app/_components/audience-landing";
import { audiencePages } from "@/app/_content/audiences";
import { createPageMetadata } from "@/lib/site";

const data = audiencePages.clubs;

export const metadata = createPageMetadata({
  title: "Sudaderas personalizadas para peñas y fiestas",
  description: data.metaDescription,
  path: `/${data.slug}`,
});

export default function ClubHoodiesPage() {
  return <AudienceLanding data={data} />;
}
