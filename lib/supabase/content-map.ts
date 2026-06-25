import type { Post } from "@/types/post";
import type { EditorPick } from "@/types/pick";

const undef = <T>(v: T | null | undefined): T | undefined => v ?? undefined;

// --- posts -----------------------------------------------------------------
export interface DbPost {
  id: string;
  title: string;
  excerpt: string | null;
  body: string;
  cover_image_url: string | null;
  tags: string[] | null;
  author: string | null;
  published: boolean | null;
  published_at: string | null;
  related_venue_ids: string[] | null;
  created_at: string | null;
  updated_at: string | null;
}

export function rowToPost(row: DbPost): Post {
  return {
    id: row.id,
    title: row.title,
    excerpt: undef(row.excerpt),
    body: row.body,
    coverImageUrl: undef(row.cover_image_url),
    tags: row.tags ?? [],
    author: undef(row.author),
    published: row.published ?? false,
    publishedAt: undef(row.published_at),
    relatedVenueIds: row.related_venue_ids ?? [],
    createdAt: undef(row.created_at),
    updatedAt: undef(row.updated_at),
  };
}

// --- editor picks ----------------------------------------------------------
export interface DbPick {
  id: string;
  venue_id: string;
  headline: string | null;
  blurb: string | null;
  position: number | null;
  visible: boolean | null;
}

export function rowToPick(row: DbPick): EditorPick {
  return {
    id: row.id,
    venueId: row.venue_id,
    headline: undef(row.headline),
    blurb: undef(row.blurb),
    position: row.position ?? 0,
    visible: row.visible ?? true,
  };
}
