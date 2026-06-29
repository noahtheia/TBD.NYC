import Link from "next/link";
import { requireAdmin } from "@/lib/admin-auth";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { rowToPost, type DbPost } from "@/lib/supabase/content-map";
import { cn } from "@/lib/cn";
import type { Post } from "@/types/post";
import SetupNotice from "../SetupNotice";

export const dynamic = "force-dynamic";

export default async function AdminPostsPage() {
  await requireAdmin();

  let posts: Post[] | null = null;
  let error: string | null = null;
  try {
    const supabase = getSupabaseAdmin();
    const { data, error: e } = await supabase
      .from("posts")
      .select("*")
      .order("updated_at", { ascending: false });
    if (e) throw new Error(e.message);
    posts = (data ?? []).map((r) => rowToPost(r as DbPost));
  } catch (e) {
    error = (e as Error).message;
  }

  return (
    <main className="mx-auto max-w-3xl px-5 py-8">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-zinc-900">Blog posts</h1>
        <Link
          href="/admin/posts/new"
          className="rounded-full bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-700"
        >
          New post
        </Link>
      </div>

      {error ? (
        <SetupNotice
          feature="Posts"
          migration="supabase/migrations/0002_posts_picks.sql"
          error={error}
          fallback="Until then the blog shows the built-in defaults from data/posts.json."
        />
      ) : posts && posts.length === 0 ? (
        <p className="mt-6 text-sm text-zinc-500">No posts yet — create your first one.</p>
      ) : (
        <ul className="mt-6 divide-y divide-zinc-100 rounded-xl border border-zinc-200">
          {posts!.map((p) => (
            <li key={p.id} className="flex items-center gap-3 p-3">
              <div className="min-w-0 flex-1">
                <Link
                  href={`/admin/posts/${p.id}`}
                  className="font-medium text-zinc-900 transition hover:text-rose-700"
                >
                  {p.title}
                </Link>
                <p className="truncate text-xs text-zinc-500">
                  /blog/{p.id}
                  {p.author ? ` · ${p.author}` : ""}
                </p>
              </div>
              <span
                className={cn(
                  "shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold",
                  p.published
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-zinc-100 text-zinc-600"
                )}
              >
                {p.published ? "Published" : "Draft"}
              </span>
              <Link
                href={`/admin/posts/${p.id}`}
                className="shrink-0 text-sm font-medium text-zinc-500 transition hover:text-zinc-800"
              >
                Edit
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
