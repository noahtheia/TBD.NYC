/** An admin-authored blog post (Markdown body). */
export interface Post {
  /** Slug — the /blog/[slug] route param and primary key. */
  id: string;
  title: string;
  excerpt?: string;
  /** Markdown body. */
  body: string;
  coverImageUrl?: string;
  tags: string[];
  author?: string;
  published: boolean;
  /** ISO timestamp; set when first published. */
  publishedAt?: string;
  /** Venue ids this post is about (rendered as related links). */
  relatedVenueIds: string[];
  createdAt?: string;
  updatedAt?: string;
}
