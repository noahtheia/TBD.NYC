import { NextResponse } from "next/server";
import { getVenueById } from "@/lib/venues";

// Full venue record for the drawer (the home page only ships the lite catalog).
// Served dynamically; cached at the edge via Cache-Control below.
export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const venue = await getVenueById(id);
  if (!venue) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(venue, {
    headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=86400" },
  });
}
