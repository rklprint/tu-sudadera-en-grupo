import { AudienceLanding } from "@/app/_components/audience-landing";
import { audiencePages } from "@/app/_content/audiences";
import { createPageMetadata } from "@/lib/site";

const data = audiencePages.tshirts;
export const metadata = createPageMetadata({ title: "Camisetas personalizadas para grupos", description: data.metaDescription, path: `/${data.slug}` });
export default function PersonalizedTShirtsPage() { return <AudienceLanding data={data} />; }
