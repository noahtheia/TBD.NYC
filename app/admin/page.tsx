import Link from "next/link";
import { requireAdmin } from "@/lib/admin-auth";
import { getSupabaseAdmin, hasSupabaseAdmin } from "@/lib/supabase/admin";
import AdminList, { type AdminRow } from "./AdminList";
import StatsBar from "./StatsBar";

export const dynamic = "force-dynamic";

export default async function AdminHome() {
  await requireAdmin();

  if (!hasSupabaseAdmin) {
    return (
      <main className="mx-auto max-w-lg px-6 py-16">
        <h1 className="text-lg font-bold text-zinc-900">Supabase not configured</h1>
        <p className="mt-2 text-sm text-zinc-600">
          Set <code>NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
          <code>SUPABASE_SERVICE_ROLE_KEY</code> in this server’s environment to
          use the admin.
        </p>
      </main>
    );
  }

  const supabase = getSupabaseAdmin();
  const { data } = await supabase
    .from("venues")
    .select("id,name,category,neighborhood,source,unverified,featured,happy_hour,rating,photo_url,updated_at")
    .order("name");

  const rows: AdminRow[] = (data ?? []).map((v) => ({
    id: v.id,
    name: v.name,
    category: v.category,
    neighborhood: v.neighborhood,
    source: v.source,
    unverified: v.unverified,
    featured: v.featured,
    happyHour: v.happy_hour,
    rating: v.rating,
    photoUrl: v.photo_url,
    updatedAt: v.updated_at,
  }));

  return (
    <main className="mx-auto max-w-3xl px-5 py-8">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-black tracking-tight text-ink">Venues</h1>
          <p className="mt-1 text-sm text-zinc-500">{rows.length} venues</p>
        </div>
        <Link
          href="/admin/new"
          className="rounded-full bg-blaze px-4 py-2 text-sm font-semibold text-white hover:bg-ember sm:hidden"
        >
          + Add
        </Link>
      </div>
      <div className="mt-5">
        <StatsBar venues={rows} />
      </div>
      <div className="mt-6">
        <AdminList venues={rows} />
      </div>
    </main>
  );
}
