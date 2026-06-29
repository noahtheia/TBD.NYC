import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublishedPosts, getPostBySlug } from "@/lib/posts";
import { getVenues } from "@/lib/venues";
import { articleJsonLd } from "@/lib/jsonld";
import SiteHeader from "@/components/site/SiteHeader";
import VenuePhoto from "@/components/ui/VenuePhoto";
import VenueResults from "@/components/landing/VenueResults";
import Markdown from "@/components/blog/Markdown";

export const revalidate = 300;

type Params = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return (await getPublishedPosts()).map((p) => ({ slug: p.id }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post || !post.published) return { title: "Not found — TBD.NYC" };
  const title = `${post.title} — TBD.NYC`;
  const description = post.excerpt || `${post.title} — from the TBD.NYC Guide.`;
  return {
    title,
    description,
    alternates: { canonical: `/blog/${post.id}` },
    openGraph: { title, description, type: "article", url: `/blog/${post.id}` },
    twitter: { card: "summary_large_image", title: post.title, description },
  };
}

export default async function PostPage({ params }: Params) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post || !post.published) notFound();

  const related = post.relatedVenueIds.length
    ? (await getVenues()).filter((v) => post.relatedVenueIds.includes(v.id))
    : [];
  const date = post.publishedAt
    ? new Date(post.publishedAt).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : null;

  return (
    <div className="min-h-dvh bg-newsprint">
      <SiteHeader active="blog" />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd(post)) }}
      />

      <article className="mx-auto max-w-2xl px-5 py-10">
        <Link href="/blog" className="text-sm font-medium text-zinc-500 transition hover:text-zinc-800">
          ← The Guide
        </Link>
        {post.tags.length > 0 && (
          <p className="mt-6 font-mono text-xs font-bold uppercase tracking-[0.14em] text-blaze">
            {post.tags.join(" · ")}
          </p>
        )}
        <h1 className="mt-2 font-display text-3xl font-black tracking-tight text-ink sm:text-4xl">
          {post.title}
        </h1>
        {(post.author || date) && (
          <p className="mt-3 text-sm text-zinc-500">
            {[post.author, date].filter(Boolean).join(" · ")}
          </p>
        )}
        {post.coverImageUrl && (
          <VenuePhoto
            name={post.title}
            photoUrl={post.coverImageUrl}
            className="mt-6 aspect-[16/9] w-full"
            rounded="rounded-2xl"
            eager
            sizes="(max-width: 768px) 100vw, 672px"
          />
        )}

        <div className="mt-8">
          <Markdown>{post.body}</Markdown>
        </div>

        {related.length > 0 && (
          <section className="mt-12 border-t border-zinc-200 pt-8">
            <h2 className="font-display text-lg font-black tracking-tight text-ink">Featured spots</h2>
            <div className="mt-4">
              <VenueResults venues={related} />
            </div>
          </section>
        )}
      </article>
    </div>
  );
}
