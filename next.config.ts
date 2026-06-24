import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Venue photos come from many arbitrary CDNs (og:image / Places). Allow any
    // https host so the optimizer can resize + serve AVIF/WebP; http URLs are
    // rendered unoptimized and fall back to the gradient if they fail.
    remotePatterns: [{ protocol: "https", hostname: "**" }],
    formats: ["image/avif", "image/webp"],
    imageSizes: [16, 32, 48, 64, 96, 160, 256],
  },
};

export default nextConfig;
