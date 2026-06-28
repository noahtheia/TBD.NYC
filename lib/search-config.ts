import fallbackData from "@/data/search-config.json";
import { getSupabase } from "@/lib/supabase/server";
import {
  rowToSearchKindConfig,
  type DbSearchPriority,
} from "@/lib/supabase/content-map";
import {
  DEFAULT_SEARCH_ORDER,
  isSearchKind,
  type SearchKind,
} from "@/lib/search-kinds";

/** One configurable home-search group: its priority and whether it's searchable. */
export type SearchKindConfig = { kind: SearchKind; position: number; enabled: boolean };

const fallback = fallbackData as unknown as SearchKindConfig[];

/**
 * Merge a (possibly empty/partial/out-of-order) source list with the canonical
 * kinds so all known groups always resolve. Source order wins for kinds that are
 * present; any missing kind is appended (enabled) in its default order. Positions
 * are re-normalized to 0..N.
 */
function mergeWithDefaults(source: SearchKindConfig[]): SearchKindConfig[] {
  const seen = new Map<SearchKind, SearchKindConfig>();
  for (const row of source) {
    if (isSearchKind(row.kind) && !seen.has(row.kind)) {
      seen.set(row.kind, { kind: row.kind, position: 0, enabled: row.enabled !== false });
    }
  }
  for (const kind of DEFAULT_SEARCH_ORDER) {
    if (!seen.has(kind)) seen.set(kind, { kind, position: 0, enabled: true });
  }
  return [...seen.values()].map((c, i) => ({ ...c, position: i }));
}

/** Full ordered config for all 8 groups (Supabase overrides, else JSON defaults). */
export async function getSearchConfig(): Promise<SearchKindConfig[]> {
  const supabase = getSupabase();
  if (!supabase) return mergeWithDefaults(fallback);

  const { data, error } = await supabase
    .from("search_priority")
    .select("kind,position,enabled")
    .order("position", { ascending: true });
  if (error || !data) {
    console.error("Supabase getSearchConfig failed, using fallback:", error?.message);
    return mergeWithDefaults(fallback);
  }
  return mergeWithDefaults((data as DbSearchPriority[]).map(rowToSearchKindConfig));
}

/** Enabled groups in priority order — what the hero dropdown consumes. */
export async function getSearchOrder(): Promise<SearchKind[]> {
  return (await getSearchConfig()).filter((c) => c.enabled).map((c) => c.kind);
}
