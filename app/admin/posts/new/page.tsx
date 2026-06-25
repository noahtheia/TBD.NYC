import Link from "next/link";
import { requireAdmin } from "@/lib/admin-auth";
import PostForm from "../../PostForm";
import { createPost } from "../../blog-actions";

export const dynamic = "force-dynamic";

export default async function NewPostPage() {
  await requireAdmin();
  return (
    <main className="mx-auto max-w-2xl px-5 py-8">
      <Link href="/admin/posts" className="text-sm font-medium text-zinc-500 hover:text-zinc-800">
        ← Blog posts
      </Link>
      <h1 className="mt-3 text-2xl font-bold text-zinc-900">New post</h1>
      <p className="mt-1 text-sm text-zinc-500">
        Write in Markdown. Leave “Published” unchecked to save a draft.
      </p>
      <div className="mt-5">
        <PostForm action={createPost} />
      </div>
    </main>
  );
}
