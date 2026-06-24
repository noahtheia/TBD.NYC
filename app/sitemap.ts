import type { MetadataRoute } from "next";
import { getVenues } from "@/lib/venues";
import { SITE_URL } from "@/lib/site";
import meta from "@/data/meta.json";

// Keep the sitemap fresh alongside the catalog (ISR).
export const revalidate = 300;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const lastModified = new Date(meta.generatedAt);
  const venues = await getVenues();

  const venuePages: MetadataRoute.Sitemap = venues.map((v) => ({
    url: `${SITE_URL}/venue/${v.id}`,
    lastModified,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  return [
    { url: SITE_URL, lastModified, changeFrequency: "daily", priority: 1 },
    ...venuePages,
  ];
}
