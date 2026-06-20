import { ImageResponse } from "next/og";

export const alt = "TBD.NYC — NYC bars & happy hours";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          background: "linear-gradient(135deg, #1c1917 0%, #3f1d2b 60%, #9f1239 100%)",
          color: "white",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", fontSize: 96, fontWeight: 800, letterSpacing: -2 }}>
          TBD
          <span style={{ color: "#fb7185" }}>.NYC</span>
        </div>
        <div style={{ marginTop: 16, fontSize: 44, fontWeight: 600, color: "#fafafa" }}>
          NYC bars &amp; happy hours
        </div>
        <div style={{ marginTop: 24, fontSize: 30, color: "#d4d4d8" }}>
          An interactive map of curated New York City bars
        </div>
        <div style={{ display: "flex", marginTop: 48, gap: 16 }}>
          {["#fb7185", "#f59e0b", "#fb7185", "#f59e0b", "#fb7185"].map((c, i) => (
            <div
              key={i}
              style={{ width: 28, height: 28, borderRadius: 999, background: c }}
            />
          ))}
        </div>
      </div>
    ),
    { ...size }
  );
}
