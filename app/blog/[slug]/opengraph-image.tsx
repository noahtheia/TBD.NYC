import { ImageResponse } from "next/og";
import { getPostBySlug } from "@/lib/posts";

export const alt = "TBD.NYC Guide";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function PostOgImage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  const title = post?.title ?? "The Guide";
  const meta = [post?.tags?.[0], post?.author].filter(Boolean).join("  •  ");

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 80,
          background: "linear-gradient(135deg, #16120E 0%, #3B130A 55%, #E0401A 100%)",
          color: "#FAF4EC",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", fontSize: 36, fontWeight: 800, letterSpacing: -1 }}>
          TBD<span style={{ color: "#FFB400" }}>.NYC</span>
          <span style={{ marginLeft: 16, color: "#FFB400", fontWeight: 600 }}>· The Guide</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              display: "flex",
              fontSize: 68,
              fontWeight: 800,
              letterSpacing: -2,
              lineHeight: 1.08,
            }}
          >
            {title}
          </div>
          {meta && (
            <div style={{ display: "flex", marginTop: 24, fontSize: 32, color: "#FFEAD1" }}>
              {meta}
            </div>
          )}
        </div>
      </div>
    ),
    { ...size }
  );
}
