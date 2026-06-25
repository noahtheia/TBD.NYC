import type { Venue } from "./venue";

/** A curated editor's pick — references a venue with an editorial headline + blurb. */
export interface EditorPick {
  id: string;
  venueId: string;
  headline?: string;
  blurb?: string;
  position: number;
  visible: boolean;
}

/** A pick joined to its venue, ready to render. */
export interface ResolvedPick extends EditorPick {
  venue: Venue;
}
