import { requireAdmin } from "@/lib/admin-auth";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { getVenues } from "@/lib/venues";
import { rowToPick, type DbPick } from "@/lib/supabase/content-map";
import type { EditorPick } from "@/types/pick";
import { addPick, updatePick, removePick, movePick } from "../blog-actions";

export const dynamic = "force-dynamic";

const input = "w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-500";

export default async function PicksPage() {
  await requireAdmin();

  const venues = await getVenues();
  const sortedVenues = [...venues].sort((a, b) => a.name.localeCompare(b.name));
  const byId = new Map(venues.map((v) => [v.id, v]));

  let picks: EditorPick[] | null = null;
  let error: string | null = null;
  try {
    const supabase = getSupabaseAdmin();
    const { data, error: e } = await supabase
      .from("editor_picks")
      .select("*")
      .order("position", { ascending: true });
    if (e) throw new Error(e.message);
    picks = (data ?? []).map((r) => rowToPick(r as DbPick));
  } catch (e) {
    error = (e as Error).message;
  }

  return (
    <main className="mx-auto max-w-2xl px-5 py-8">
      <h1 className="text-2xl font-bold text-zinc-900">Editor&apos;s picks</h1>
      <p className="mt-1 text-sm text-zinc-500">
        Curated, ordered venue highlights shown on the homepage.
      </p>

      {error ? (
        <p className="mt-6 rounded-md bg-amber-50 p-3 text-sm text-amber-800">
          Editor&apos;s picks require Supabase (NEXT_PUBLIC_SUPABASE_URL +
          SUPABASE_SERVICE_ROLE_KEY). Until then the homepage shows the built-in defaults from{" "}
          <code>data/picks.json</code>. {error}
        </p>
      ) : (
        <>
          <form
            action={addPick}
            className="mt-6 space-y-3 rounded-xl border border-zinc-200 p-4"
          >
            <h2 className="text-sm font-semibold text-zinc-900">Add a pick</h2>
            <select name="venueId" required defaultValue="" className={input}>
              <option value="" disabled>
                Choose a venue…
              </option>
              {sortedVenues.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                  {v.neighborhood ? ` — ${v.neighborhood}` : ""}
                </option>
              ))}
            </select>
            <input name="headline" placeholder="Headline (optional)" className={input} />
            <textarea name="blurb" rows={2} placeholder="Blurb (optional)" className={input} />
            <button className="rounded-full bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-700">
              Add pick
            </button>
          </form>

          <div className="mt-6 space-y-3">
            {(picks ?? []).length === 0 && (
              <p className="text-sm text-zinc-500">No picks yet — add one above.</p>
            )}
            {(picks ?? []).map((p, i) => {
              const v = byId.get(p.venueId);
              return (
                <div key={p.id} className="rounded-xl border border-zinc-200 p-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-zinc-400">#{i + 1}</span>
                    <span className="font-medium text-zinc-900">{v ? v.name : p.venueId}</span>
                    {!v && <span className="text-xs text-amber-700">(venue not found)</span>}
                    <div className="ml-auto flex items-center gap-1">
                      <form action={movePick}>
                        <input type="hidden" name="id" value={p.id} />
                        <input type="hidden" name="dir" value="up" />
                        <button
                          className="rounded px-2 py-1 text-sm text-zinc-500 transition hover:bg-zinc-100"
                          aria-label="Move up"
                        >
                          ▲
                        </button>
                      </form>
                      <form action={movePick}>
                        <input type="hidden" name="id" value={p.id} />
                        <input type="hidden" name="dir" value="down" />
                        <button
                          className="rounded px-2 py-1 text-sm text-zinc-500 transition hover:bg-zinc-100"
                          aria-label="Move down"
                        >
                          ▼
                        </button>
                      </form>
                      <form action={removePick}>
                        <input type="hidden" name="id" value={p.id} />
                        <button className="rounded px-2 py-1 text-sm text-rose-600 transition hover:bg-rose-50">
                          Remove
                        </button>
                      </form>
                    </div>
                  </div>
                  <form action={updatePick} className="mt-3 space-y-2">
                    <input type="hidden" name="id" value={p.id} />
                    <input
                      name="headline"
                      defaultValue={p.headline ?? ""}
                      placeholder="Headline"
                      className={input}
                    />
                    <textarea
                      name="blurb"
                      rows={2}
                      defaultValue={p.blurb ?? ""}
                      placeholder="Blurb"
                      className={input}
                    />
                    <label className="flex items-center gap-2 text-sm text-zinc-700">
                      <input type="checkbox" name="visible" defaultChecked={p.visible} /> Visible
                    </label>
                    <button className="rounded-full border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 transition hover:border-zinc-400">
                      Save
                    </button>
                  </form>
                </div>
              );
            })}
          </div>
        </>
      )}
    </main>
  );
}
