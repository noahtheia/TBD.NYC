"use client";

import { useState } from "react";
import type { Post } from "@/types/post";
import { slugify } from "@/lib/slug";
import { cn } from "@/lib/cn";

const input = "w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-500";
const label = "block text-sm font-medium text-zinc-700";

export default function PostForm({
  post,
  action,
}: {
  post?: Post;
  action: (formData: FormData) => Promise<void>;
}) {
  const isEdit = Boolean(post);
  const [title, setTitle] = useState(post?.title ?? "");
  const [slug, setSlug] = useState(post?.id ?? "");
  const [slugTouched, setSlugTouched] = useState(isEdit);
  const computedSlug = slugTouched ? slug : slugify(title);

  return (
    <form action={action} className="space-y-4">
      {post && <input type="hidden" name="id" value={post.id} />}
      {post?.publishedAt && <input type="hidden" name="publishedAt" value={post.publishedAt} />}

      <div>
        <label className={label}>Title</label>
        <input
          name="title"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className={input}
        />
      </div>

      <div>
        <label className={label}>Slug</label>
        {isEdit ? (
          <input value={post!.id} readOnly className={cn(input, "bg-zinc-50 text-zinc-500")} />
        ) : (
          <input
            name="slug"
            value={computedSlug}
            onChange={(e) => {
              setSlug(e.target.value);
              setSlugTouched(true);
            }}
            className={input}
          />
        )}
        <p className="mt-1 text-xs text-zinc-400">
          {isEdit ? "The slug can't be changed after creation." : `URL: /blog/${computedSlug || "…"}`}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={label}>Author</label>
          <input name="author" defaultValue={post?.author ?? ""} className={input} />
        </div>
        <div>
          <label className={label}>Tags (comma-separated)</label>
          <input name="tags" defaultValue={post?.tags.join(", ") ?? ""} className={input} />
        </div>
      </div>

      <div>
        <label className={label}>Cover image URL</label>
        <input
          name="coverImageUrl"
          type="url"
          defaultValue={post?.coverImageUrl ?? ""}
          placeholder="https://…"
          className={input}
        />
      </div>

      <div>
        <label className={label}>Excerpt</label>
        <textarea name="excerpt" rows={2} defaultValue={post?.excerpt ?? ""} className={input} />
      </div>

      <div>
        <label className={label}>Related venue ids (comma-separated)</label>
        <input
          name="relatedVenueIds"
          defaultValue={post?.relatedVenueIds.join(", ") ?? ""}
          placeholder="bathtub-gin, attaboy"
          className={input}
        />
      </div>

      <div>
        <label className={label}>Body (Markdown)</label>
        <textarea
          name="body"
          required
          rows={18}
          defaultValue={post?.body ?? ""}
          placeholder={"## Heading\n\nWrite in **Markdown** — links, lists, quotes all work."}
          className={cn(input, "font-mono text-[13px] leading-6")}
        />
      </div>

      <label className="flex items-center gap-2 text-sm text-zinc-700">
        <input type="checkbox" name="published" defaultChecked={post?.published ?? false} />
        Published
      </label>

      <div className="flex items-center gap-4 pt-2">
        <button
          type="submit"
          className="rounded-full bg-rose-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-rose-700"
        >
          Save post
        </button>
        {isEdit && post?.published && (
          <a
            href={`/blog/${post.id}`}
            target="_blank"
            rel="noreferrer"
            className="text-sm font-medium text-zinc-500 hover:text-zinc-800"
          >
            View ↗
          </a>
        )}
      </div>
    </form>
  );
}
