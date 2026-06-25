import fallbackData from "@/data/picks.json";
import type { EditorPick, ResolvedPick } from "@/types/pick";
import { getSupabase } from "@/lib/supabase/server";
import { rowToPick, type DbPick } from "@/lib/supabase/content-map";
import { getVenues } from "@/lib/venues";

const fallback = fallbackData as unknown as EditorPick[];

async function getRawPicks(): Promise<EditorPick[]> {
  const supabase = getSupabase();
  if (!supabase) return [...fallback];

  const { data, error } = await supabase
    .from("editor_picks")
    .select("*")
    .order("position", { ascending: true });
  if (error || !data) {
    console.error("Supabase getPicks failed, using fallback:", error?.message);
    return [...fallback];
  }
  return (data as unknown as DbPick[]).map(rowToPick);
}

/** Curated picks (visible, ordered) joined to their venue; drops dangling picks. */
export async function getResolvedPicks(): Promise<ResolvedPick[]> {
  const picks = (await getRawPicks())
    .filter((p) => p.visible)
    .sort((a, b) => a.position - b.position);
  if (!picks.length) return [];

  const byId = new Map((await getVenues()).map((v) => [v.id, v]));
  return picks
    .map((p) => {
      const venue = byId.get(p.venueId);
      return venue ? { ...p, venue } : null;
    })
    .filter((p): p is ResolvedPick => p !== null);
}
