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
          background: "linear-gradient(135deg, #16120E 0%, #3B130A 55%, #E0401A 100%)",
          color: "#FAF4EC",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", fontSize: 96, fontWeight: 800, letterSpacing: -2 }}>
          TBD
          <span style={{ color: "#FFB400" }}>.NYC</span>
        </div>
        <div style={{ marginTop: 16, fontSize: 44, fontWeight: 600, color: "#FFEAD1" }}>
          Eat · Drink · Decide
        </div>
        <div style={{ marginTop: 24, fontSize: 30, color: "#FFEAD1" }}>
          An interactive map of curated New York City bars
        </div>
        <div style={{ display: "flex", marginTop: 48, gap: 16 }}>
          {["#FF5A1F", "#FFB400", "#FFCE3A", "#FF5A1F", "#FFB400"].map((c, i) => (
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
