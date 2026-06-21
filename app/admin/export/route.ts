import { isAdmin } from "@/lib/admin-auth";
import { getSupabaseAdmin, hasSupabaseAdmin } from "@/lib/supabase/admin";
import { toCsv } from "@/lib/csv";

export const dynamic = "force-dynamic";

const COLUMNS = [
  "id", "name", "category", "types", "cuisines", "neighborhood", "rating",
  "price_level", "happy_hour", "reservation_policy", "amenities", "featured",
  "unverified", "source", "website", "instagram", "address", "lat", "lng",
  "updated_at",
];

type LocRow = { address: string | null; lat: number | null; lng: number | null; position: number | null };
type VenueExportRow = Record<string, unknown> & { locations: LocRow[] | null };

export async function GET() {
  if (!(await isAdmin())) return new Response("Unauthorized", { status: 401 });
  if (!hasSupabaseAdmin) return new Response("Supabase not configured", { status: 500 });

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("venues")
    .select(
      "id,name,category,types,cuisines,neighborhood,rating,price_level,happy_hour," +
        "reservation_policy,amenities,featured,unverified,source,website,instagram," +
        "updated_at, locations:venue_locations(address,lat,lng,position)"
    )
    .order("name");
  if (error) return new Response(`Export failed: ${error.message}`, { status: 500 });

  const rows = ((data ?? []) as unknown as VenueExportRow[]).map((v) => {
    const primary = (v.locations ?? [])
      .slice()
      .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))[0];
    return {
      ...v,
      types: v.types ?? [],
      cuisines: v.cuisines ?? [],
      amenities: v.amenities ?? [],
      address: primary?.address ?? "",
      lat: primary?.lat ?? "",
      lng: primary?.lng ?? "",
    } as Record<string, unknown>;
  });

  const csv = toCsv(rows, COLUMNS);
  const filename = `tbd-venues-${new Date().toISOString().slice(0, 10)}.csv`;
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
