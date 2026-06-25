import type { Venue } from "@/types/venue";
import type { Post } from "@/types/post";
import { SITE_URL } from "@/lib/site";

/** schema.org WebSite for the homepage, with a search action into the explorer. */
export function websiteJsonLd(): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "TBD.NYC",
    url: SITE_URL,
    potentialAction: {
      "@type": "SearchAction",
      target: `${SITE_URL}/explore?q={query}`,
      "query-input": "required name=query",
    },
  };
}

/** schema.org Article for a blog post. */
export function articleJsonLd(post: Post): Record<string, unknown> {
  const url = `${SITE_URL}/blog/${post.id}`;
  const data: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    url,
    mainEntityOfPage: url,
    publisher: { "@type": "Organization", name: "TBD.NYC", url: SITE_URL },
  };
  if (post.excerpt) data.description = post.excerpt;
  if (post.coverImageUrl) data.image = post.coverImageUrl;
  if (post.author) data.author = { "@type": "Person", name: post.author };
  if (post.publishedAt) data.datePublished = post.publishedAt;
  if (post.updatedAt) data.dateModified = post.updatedAt;
  return data;
}

// schema.org dayOfWeek names, indexed by Google's 0=Sunday convention.
const DOW = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

/** Minutes-from-midnight -> "HH:MM" (24h), for OpeningHoursSpecification. */
function hhmm(min: number): string {
  const m = ((Math.round(min) % 1440) + 1440) % 1440;
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
}

/** schema.org Restaurant/BarOrPub structured data for a venue, for rich results
 *  (star rating, price, hours, map pin). Only includes fields the venue actually has. */
export function venueJsonLd(venue: Venue): Record<string, unknown> {
  const loc = venue.locations[0];
  const data: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": venue.category === "restaurant" ? "Restaurant" : "BarOrPub",
    name: venue.name,
    url: `${SITE_URL}/venue/${venue.id}`,
  };

  if (venue.photoUrl) data.image = venue.photoUrl;
  if (venue.cuisines?.length) data.servesCuisine = venue.cuisines;
  if (venue.priceLevel) data.priceRange = "$".repeat(venue.priceLevel);
  if (venue.menuUrl) data.menu = venue.menuUrl;

  const sameAs = [venue.website, venue.instagram].filter(Boolean);
  if (sameAs.length) data.sameAs = sameAs;

  if (loc) {
    data.address = {
      "@type": "PostalAddress",
      streetAddress: loc.address,
      addressLocality: loc.neighborhood ?? "New York",
      addressRegion: "NY",
      addressCountry: "US",
    };
    data.geo = {
      "@type": "GeoCoordinates",
      latitude: loc.coordinates.lat,
      longitude: loc.coordinates.lng,
    };
  }

  if (venue.rating != null && venue.userRatingCount) {
    data.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: venue.rating,
      reviewCount: venue.userRatingCount,
    };
  }

  const hours = loc?.hours;
  if (hours?.open24) {
    data.openingHoursSpecification = [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: DOW,
        opens: "00:00",
        closes: "23:59",
      },
    ];
  } else if (hours?.periods.length) {
    data.openingHoursSpecification = hours.periods.map((p) => ({
      "@type": "OpeningHoursSpecification",
      dayOfWeek: DOW[p.openDay % 7],
      opens: hhmm(p.openMin),
      closes: hhmm(p.closeMin),
    }));
  }

  return data;
}
