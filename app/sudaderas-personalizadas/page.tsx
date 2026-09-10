import { AudienceLanding } from "@/app/_components/audience-landing";
import { audiencePages } from "@/app/_content/audiences";
import { createPageMetadata } from "@/lib/site";

const data = audiencePages.generic;
export const metadata = createPageMetadata({ title: "Sudaderas personalizadas para grupos", description: data.metaDescription, path: `/${data.slug}` });
export default function PersonalizedHoodiesPage() { return <AudienceLanding data={data} />; }
