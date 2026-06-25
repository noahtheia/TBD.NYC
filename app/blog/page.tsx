import type { Metadata } from "next";
import { getPublishedPosts } from "@/lib/posts";
import SiteHeader from "@/components/site/SiteHeader";
import PostCard from "@/components/blog/PostCard";

export const revalidate = 300;

const TITLE = "The Guide — TBD.NYC";
const DESCRIPTION =
  "Stories, picks, and neighborhood guides to NYC's bars and restaurants from TBD.NYC.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/blog" },
  openGraph: { title: TITLE, description: DESCRIPTION, url: "/blog", type: "website" },
};

export default async function BlogIndex() {
  const posts = await getPublishedPosts();

  return (
    <div className="min-h-dvh bg-white">
      <SiteHeader active="blog" />
      <main className="mx-auto max-w-5xl px-4 py-10 lg:px-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">The Guide</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-zinc-900">Stories &amp; guides</h1>
        <p className="mt-2 max-w-2xl text-zinc-600">
          Where to drink and eat across New York — picks, neighborhood guides, and the occasional
          deep dive.
        </p>

        {posts.length === 0 ? (
          <p className="mt-10 text-zinc-500">No posts yet — check back soon.</p>
        ) : (
          <ul className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((p) => (
              <li key={p.id}>
                <PostCard post={p} />
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
