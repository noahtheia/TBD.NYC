import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin-auth";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { rowToPost, type DbPost } from "@/lib/supabase/content-map";
import PostForm from "../../PostForm";
import { updatePost, deletePost } from "../../blog-actions";

export const dynamic = "force-dynamic";

export default async function EditPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;

  const supabase = getSupabaseAdmin();
  const { data } = await supabase.from("posts").select("*").eq("id", id).maybeSingle();
  if (!data) notFound();
  const post = rowToPost(data as DbPost);

  return (
    <main className="mx-auto max-w-2xl px-5 py-8">
      <Link href="/admin/posts" className="text-sm font-medium text-zinc-500 hover:text-zinc-800">
        ← Blog posts
      </Link>
      <h1 className="mt-3 font-display text-2xl font-black tracking-tight text-ink">Edit post</h1>
      <div className="mt-5">
        <PostForm post={post} action={updatePost} />
      </div>
      <form action={deletePost} className="mt-8 border-t border-zinc-100 pt-4">
        <input type="hidden" name="id" value={post.id} />
        <button className="text-sm font-medium text-ember transition hover:text-blaze">
          Delete post
        </button>
      </form>
    </main>
  );
}
