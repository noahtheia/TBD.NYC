import Link from "next/link";
import type { Post } from "@/types/post";
import { cn } from "@/lib/cn";
import VenuePhoto from "@/components/ui/VenuePhoto";

/** Blog post card ("The Guide"): cover image + tag eyebrow + title + excerpt. */
export default function PostCard({ post, className }: { post: Post; className?: string }) {
  const date = post.publishedAt
    ? new Date(post.publishedAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : null;

  return (
    <Link
      href={`/blog/${post.id}`}
      className={cn(
        "group flex h-full w-full flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white transition hover:shadow-md",
        className
      )}
    >
      <VenuePhoto
        name={post.title}
        photoUrl={post.coverImageUrl}
        className="aspect-[16/9] w-full"
        rounded="rounded-none"
        sizes="(max-width: 640px) 100vw, 360px"
      />
      <div className="flex flex-1 flex-col p-4">
        {post.tags[0] && (
          <p className="font-mono text-xs font-bold uppercase tracking-[0.12em] text-blaze">
            {post.tags[0]}
          </p>
        )}
        <h3 className="mt-1 font-display text-lg font-black leading-snug tracking-tight text-ink group-hover:text-ember">
          {post.title}
        </h3>
        {post.excerpt && (
          <p className="mt-1 line-clamp-2 text-sm text-zinc-600">{post.excerpt}</p>
        )}
        {(post.author || date) && (
          <p className="mt-3 text-xs text-zinc-500">
            {[post.author, date].filter(Boolean).join(" · ")}
          </p>
        )}
      </div>
    </Link>
  );
}
