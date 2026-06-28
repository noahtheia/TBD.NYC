import type { PhotoTag, Venue, VenuePhoto } from "@/types/venue";

/** A photo ready to render in the detail gallery. */
export type GalleryPhoto = { url: string; caption?: string };

/** Tags that get a dedicated "featured" slot near the front of the gallery. */
const FEATURED_TAGS: PhotoTag[] = ["inside", "food", "drinks"];

/**
 * Order a venue's photos for the scrollable detail gallery:
 *   1. logo (`photoUrl`)
 *   2. featured inside photo (explicit `featured`, else first tagged `inside`)
 *   3. featured food photo
 *   4. featured drink photo
 *   5. everything else, in admin order (outside, extras, untagged)
 * Photos are de-duplicated by URL and empty URLs are dropped.
 */
export function orderedVenuePhotos(venue: Venue): GalleryPhoto[] {
  const photos = (venue.photos ?? []).filter((p) => p.url?.trim());
  const out: GalleryPhoto[] = [];
  const seen = new Set<string>();

  const push = (p: GalleryPhoto | undefined) => {
    if (!p || seen.has(p.url)) return;
    seen.add(p.url);
    out.push({ url: p.url, caption: p.caption });
  };

  if (venue.photoUrl?.trim()) push({ url: venue.photoUrl });

  for (const tag of FEATURED_TAGS) {
    const tagged = photos.filter((p) => p.tag === tag);
    const pick: VenuePhoto | undefined = tagged.find((p) => p.featured) ?? tagged[0];
    push(pick);
  }

  for (const p of photos) push(p);

  return out;
}
