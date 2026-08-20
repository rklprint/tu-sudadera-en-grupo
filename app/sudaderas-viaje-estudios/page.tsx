import { AudienceLanding } from "@/app/_components/audience-landing";
import { audiencePages } from "@/app/_content/audiences";
import { createPageMetadata } from "@/lib/site";

const data = audiencePages.travel;
export const metadata = createPageMetadata({ title: "Sudaderas para viajes de estudios", description: data.metaDescription, path: `/${data.slug}` });
export default function StudyTripHoodiesPage() { return <AudienceLanding data={data} />; }
