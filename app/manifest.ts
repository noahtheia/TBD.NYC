import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "TBD.NYC — NYC Bars & Happy Hours",
    short_name: "TBD.NYC",
    description:
      "An interactive map of curated New York City bars, restaurants, and happy hours.",
    start_url: "/explore",
    display: "standalone",
    background_color: "#faf4ec",
    theme_color: "#ff5a1f",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png" },
    ],
  };
}
