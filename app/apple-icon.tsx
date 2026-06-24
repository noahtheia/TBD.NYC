import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

// White cocktail-glass mark (mirrors app/icon.svg) on the rose brand color, as a
// data-URI img so Satori renders it reliably.
const GLASS =
  "data:image/svg+xml," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="104" height="104" viewBox="0 0 32 32" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 9h14l-7 8z"/><path d="M16 17v6"/><path d="M12 23h8"/></svg>'
  );

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#e11d48",
        }}
      >
        <img src={GLASS} width={104} height={104} alt="" />
      </div>
    ),
    { ...size }
  );
}
