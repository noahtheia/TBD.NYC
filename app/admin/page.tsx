import Link from "next/link";
import { requireAdmin } from "@/lib/admin-auth";
import { getSupabaseAdmin, hasSupabaseAdmin } from "@/lib/supabase/admin";
import AdminList from "./AdminList";

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
    .select("id,name,category,neighborhood,source")
    .order("name");

  return (
    <main className="mx-auto max-w-3xl px-5 py-8">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Venues</h1>
          <p className="mt-1 text-sm text-zinc-500">{data?.length ?? 0} venues</p>
        </div>
        <Link
          href="/admin/new"
          className="rounded-full bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 sm:hidden"
        >
          + Add
        </Link>
      </div>
      <div className="mt-5">
        <AdminList venues={data ?? []} />
      </div>
    </main>
  );
}
