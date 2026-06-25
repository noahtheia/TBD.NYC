import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  {
    key: "Permissions-Policy",
    value: "geolocation=(self), camera=(), microphone=(), payment=()",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  images: {
    // Venue photos come from many arbitrary CDNs (og:image / Places). Allow any
    // https host so the optimizer can resize + serve AVIF/WebP; http URLs are
    // rendered unoptimized and fall back to the gradient if they fail.
    remotePatterns: [{ protocol: "https", hostname: "**" }],
    formats: ["image/avif", "image/webp"],
    imageSizes: [16, 32, 48, 64, 96, 160, 256],
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
