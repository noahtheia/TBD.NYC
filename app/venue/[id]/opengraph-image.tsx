import { ImageResponse } from "next/og";
import { getVenueById } from "@/lib/venues";
import { priceLabel } from "@/lib/display";

export const alt = "Venue on TBD.NYC";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** A branded 1200x630 social card per venue (name, area, rating, price), so links
 *  preview consistently even when a venue has no usable photo. */
export default async function VenueOgImage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const venue = await getVenueById(id);

  const name = venue?.name ?? "TBD.NYC";
  const tags = venue
    ? venue.category === "restaurant"
      ? venue.cuisines?.length
        ? venue.cuisines
        : ["Restaurant"]
      : venue.types
    : [];
  const meta = [tags.slice(0, 3).join(" · "), venue?.neighborhood]
    .filter(Boolean)
    .join("  •  ");
  const rating = venue?.rating != null ? `★ ${venue.rating.toFixed(1)}` : null;
  const price = priceLabel(venue?.priceLevel);

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
          background:
            "linear-gradient(135deg, #1c1917 0%, #3f1d2b 60%, #9f1239 100%)",
          color: "white",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", fontSize: 40, fontWeight: 800, letterSpacing: -1 }}>
          TBD<span style={{ color: "#fb7185" }}>.NYC</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              display: "flex",
              fontSize: 76,
              fontWeight: 800,
              letterSpacing: -2,
              lineHeight: 1.05,
            }}
          >
            {name}
          </div>
          {meta && (
            <div style={{ display: "flex", marginTop: 20, fontSize: 34, color: "#e4e4e7" }}>
              {meta}
            </div>
          )}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 24,
              marginTop: 28,
              fontSize: 32,
              color: "#fafafa",
            }}
          >
            {rating && <div style={{ display: "flex" }}>{rating}</div>}
            {price && <div style={{ display: "flex" }}>{price}</div>}
            {venue?.happyHour === true && (
              <div
                style={{
                  display: "flex",
                  background: "#f59e0b",
                  color: "#451a03",
                  padding: "4px 18px",
                  borderRadius: 999,
                  fontSize: 26,
                  fontWeight: 700,
                }}
              >
                Happy hour
              </div>
            )}
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
