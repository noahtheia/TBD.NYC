import { requireAdmin } from "@/lib/admin-auth";
import { hasSupabaseAdmin } from "@/lib/supabase/admin";
import { getSearchConfig } from "@/lib/search-config";
import { SEARCH_KINDS, type SearchKind } from "@/lib/search-kinds";
import { moveSearchKind, setSearchKindEnabled } from "../search-actions";

export const dynamic = "force-dynamic";

const META = new Map(SEARCH_KINDS.map((k) => [k.kind, k]));
function meta(kind: SearchKind) {
  return META.get(kind) ?? { kind, label: kind, description: "" };
}

export default async function SearchPriorityPage() {
  await requireAdmin();

  const config = await getSearchConfig();
  const configured = hasSupabaseAdmin;

  return (
    <main className="mx-auto max-w-2xl px-5 py-8">
      <h1 className="text-2xl font-bold text-zinc-900">Search priority</h1>
      <p className="mt-1 text-sm text-zinc-500">
        Choose which groups appear in the homepage search dropdown and the order they rank.
        The closest text match always wins first (a name <em>starting</em> with the query
        beats one that merely contains it); this order only breaks ties between equally-good
        matches. Disabled groups are hidden from search entirely.
      </p>

      {!configured && (
        <p className="mt-6 rounded-md bg-amber-50 p-3 text-sm text-amber-800">
          Saving requires Supabase (NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY) with
          the <code>0005_search_priority.sql</code> migration applied. Until then the homepage
          uses the built-in defaults from <code>data/search-config.json</code> and the controls
          below are read-only.
        </p>
      )}

      <div className="mt-6 space-y-3">
        {config.map((c, i) => {
          const m = meta(c.kind);
          const first = i === 0;
          const last = i === config.length - 1;
          return (
            <div
              key={c.kind}
              className="flex items-center gap-3 rounded-xl border border-zinc-200 p-4"
            >
              <span className="w-6 text-xs font-semibold text-zinc-400">#{i + 1}</span>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-zinc-900">{m.label}</span>
                  {!c.enabled && (
                    <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-500">
                      Hidden
                    </span>
                  )}
                </div>
                <p className="text-xs text-zinc-500">{m.description}</p>
              </div>

              <div className="ml-auto flex items-center gap-1">
                <form action={setSearchKindEnabled}>
                  <input type="hidden" name="kind" value={c.kind} />
                  {/* Submit the inverse of the current state to toggle. */}
                  <input type="hidden" name="enabled" value={c.enabled ? "" : "on"} />
                  <button
                    disabled={!configured}
                    className="rounded-full border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 transition hover:border-zinc-400 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {c.enabled ? "Disable" : "Enable"}
                  </button>
                </form>
                <form action={moveSearchKind}>
                  <input type="hidden" name="kind" value={c.kind} />
                  <input type="hidden" name="dir" value="up" />
                  <button
                    disabled={!configured || first}
                    aria-label={`Move ${m.label} up`}
                    className="rounded px-2 py-1 text-sm text-zinc-500 transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    ▲
                  </button>
                </form>
                <form action={moveSearchKind}>
                  <input type="hidden" name="kind" value={c.kind} />
                  <input type="hidden" name="dir" value="down" />
                  <button
                    disabled={!configured || last}
                    aria-label={`Move ${m.label} down`}
                    className="rounded px-2 py-1 text-sm text-zinc-500 transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    ▼
                  </button>
                </form>
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}
