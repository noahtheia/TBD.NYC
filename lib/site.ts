/**
 * Canonical absolute site origin, used for metadata (canonical/OG), the sitemap,
 * and robots. Resolution order:
 *   1. NEXT_PUBLIC_SITE_URL (explicit)
 *   2. VERCEL_PROJECT_PRODUCTION_URL (the stable production domain on Vercel)
 *   3. http://localhost:3000 (dev fallback only)
 *
 * A localhost fallback in production silently de-indexes the site (every canonical
 * and OG URL would resolve to localhost), so warn loudly if we reach it in a
 * production build.
 */
function resolveSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicit) return explicit.replace(/\/+$/, "");

  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (vercel) {
    return `https://${vercel.replace(/^https?:\/\//, "").replace(/\/+$/, "")}`;
  }

  if (process.env.NODE_ENV === "production") {
    console.warn(
      "[site] NEXT_PUBLIC_SITE_URL is not set in a production build — canonical, " +
        "Open Graph, and sitemap URLs are falling back to http://localhost:3000, " +
        "which de-indexes the site. Set NEXT_PUBLIC_SITE_URL to the deployed origin."
    );
  }
  return "http://localhost:3000";
}

export const SITE_URL = resolveSiteUrl();
