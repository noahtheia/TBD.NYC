import type { MetadataRoute } from "next";
import { getVenues } from "@/lib/venues";
import { computeFacets } from "@/lib/facets";
import { SITE_URL } from "@/lib/site";
import { slugify } from "@/lib/slug";
import meta from "@/data/meta.json";

// Keep the sitemap fresh alongside the catalog (ISR).
export const revalidate = 300;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const lastModified = new Date(meta.generatedAt);
  const venues = await getVenues();
  const facets = computeFacets(venues);

  const venuePages: MetadataRoute.Sitemap = venues.map((v) => ({
    url: `${SITE_URL}/venue/${v.id}`,
    lastModified,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  const neighborhoodPages: MetadataRoute.Sitemap = facets.neighborhoods.map((n) => ({
    url: `${SITE_URL}/neighborhood/${slugify(n)}`,
    lastModified,
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  const cuisinePages: MetadataRoute.Sitemap = facets.cuisines.map((c) => ({
    url: `${SITE_URL}/cuisine/${slugify(c)}`,
    lastModified,
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  return [
    { url: SITE_URL, lastModified, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/happy-hour`, lastModified, changeFrequency: "daily", priority: 0.8 },
    ...neighborhoodPages,
    ...cuisinePages,
    ...venuePages,
  ];
}
