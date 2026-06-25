import fallbackData from "@/data/posts.json";
import type { Post } from "@/types/post";
import { getSupabase } from "@/lib/supabase/server";
import { rowToPost, type DbPost } from "@/lib/supabase/content-map";

const fallback = fallbackData as unknown as Post[];

function byNewest(a: Post, b: Post): number {
  const ad = a.publishedAt || a.createdAt || "";
  const bd = b.publishedAt || b.createdAt || "";
  return bd.localeCompare(ad);
}

/** All published posts, newest first. Supabase (public RLS) or the JSON fallback. */
export async function getPublishedPosts(): Promise<Post[]> {
  const supabase = getSupabase();
  if (!supabase) return fallback.filter((p) => p.published).sort(byNewest);

  const { data, error } = await supabase.from("posts").select("*");
  if (error || !data) {
    console.error("Supabase getPublishedPosts failed, using fallback:", error?.message);
    return fallback.filter((p) => p.published).sort(byNewest);
  }
  // RLS already limits anon reads to published rows.
  return (data as unknown as DbPost[]).map(rowToPost).sort(byNewest);
}

export async function getPostBySlug(slug: string): Promise<Post | undefined> {
  const supabase = getSupabase();
  if (!supabase) return fallback.find((p) => p.id === slug && p.published);

  const { data, error } = await supabase.from("posts").select("*").eq("id", slug).maybeSingle();
  if (error) {
    console.error("Supabase getPostBySlug failed, using fallback:", error.message);
    return fallback.find((p) => p.id === slug && p.published);
  }
  return data ? rowToPost(data as unknown as DbPost) : undefined;
}
