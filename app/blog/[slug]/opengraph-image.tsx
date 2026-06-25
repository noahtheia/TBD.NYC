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
          background: "linear-gradient(135deg, #1c1917 0%, #3f1d2b 60%, #9f1239 100%)",
          color: "white",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", fontSize: 36, fontWeight: 800, letterSpacing: -1 }}>
          TBD<span style={{ color: "#fb7185" }}>.NYC</span>
          <span style={{ marginLeft: 16, color: "#fb7185", fontWeight: 600 }}>· The Guide</span>
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
            <div style={{ display: "flex", marginTop: 24, fontSize: 32, color: "#e4e4e7" }}>
              {meta}
            </div>
          )}
        </div>
      </div>
    ),
    { ...size }
  );
}
