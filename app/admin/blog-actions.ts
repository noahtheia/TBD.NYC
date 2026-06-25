"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/admin-auth";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { str, arr, bool, slugify } from "@/lib/form";

async function assertAdmin() {
  if (!(await isAdmin())) throw new Error("Unauthorized");
}

// --- posts -----------------------------------------------------------------
function buildPostRow(form: FormData, id: string, publishedAt: string | null) {
  return {
    id,
    title: String(form.get("title") ?? "").trim(),
    excerpt: str(form.get("excerpt")),
    body: String(form.get("body") ?? ""),
    cover_image_url: str(form.get("coverImageUrl")),
    tags: arr(form.get("tags")),
    author: str(form.get("author")),
    published: bool(form.get("published")),
    published_at: publishedAt,
    related_venue_ids: arr(form.get("relatedVenueIds")),
  };
}

async function savePost(form: FormData, mode: "create" | "update") {
  await assertAdmin();
  const title = String(form.get("title") ?? "").trim();
  if (!title) throw new Error("Title is required.");
  if (!String(form.get("body") ?? "").trim()) throw new Error("Body is required.");

  const supabase = getSupabaseAdmin();
  let id = str(form.get("id"));
  if (mode === "create") {
    const base = slugify(str(form.get("slug")) ?? title) || "post";
    id = base;
    for (let i = 2; ; i++) {
      const { data } = await supabase.from("posts").select("id").eq("id", id).maybeSingle();
      if (!data) break;
      id = `${base}-${i}`;
    }
  }
  if (!id) throw new Error("Missing post id.");

  const published = bool(form.get("published"));
  // Stamp published_at the first time a post is published; otherwise keep existing.
  let publishedAt = str(form.get("publishedAt"));
  if (published && !publishedAt) publishedAt = new Date().toISOString();

  const { error } = await supabase.from("posts").upsert(buildPostRow(form, id, publishedAt));
  if (error) throw new Error(`Save failed: ${error.message}`);

  revalidatePath("/");
  revalidatePath("/blog");
  revalidatePath(`/blog/${id}`);
  redirect(`/admin/posts?saved=${id}`);
}

export async function createPost(formData: FormData) {
  await savePost(formData, "create");
}
export async function updatePost(formData: FormData) {
  await savePost(formData, "update");
}

export async function deletePost(formData: FormData) {
  await assertAdmin();
  const id = str(formData.get("id"));
  if (!id) throw new Error("Missing id.");
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from("posts").delete().eq("id", id);
  if (error) throw new Error(`Delete failed: ${error.message}`);
  revalidatePath("/");
  revalidatePath("/blog");
  revalidatePath(`/blog/${id}`);
  redirect("/admin/posts?deleted=1");
}

// --- editor picks ----------------------------------------------------------
export async function addPick(formData: FormData) {
  await assertAdmin();
  const venueId = str(formData.get("venueId"));
  if (!venueId) throw new Error("Choose a venue.");
  const supabase = getSupabaseAdmin();

  const { data: top } = await supabase
    .from("editor_picks")
    .select("position")
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();
  const position = (top?.position ?? 0) + 1;

  let id = `pick-${venueId}`;
  for (let i = 2; ; i++) {
    const { data } = await supabase.from("editor_picks").select("id").eq("id", id).maybeSingle();
    if (!data) break;
    id = `pick-${venueId}-${i}`;
  }

  const { error } = await supabase.from("editor_picks").insert({
    id,
    venue_id: venueId,
    headline: str(formData.get("headline")),
    blurb: str(formData.get("blurb")),
    position,
    visible: true,
  });
  if (error) throw new Error(`Add failed: ${error.message}`);
  revalidatePath("/");
  revalidatePath("/admin/picks");
  redirect("/admin/picks?added=1");
}

export async function updatePick(formData: FormData) {
  await assertAdmin();
  const id = str(formData.get("id"));
  if (!id) throw new Error("Missing id.");
  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("editor_picks")
    .update({
      headline: str(formData.get("headline")),
      blurb: str(formData.get("blurb")),
      visible: bool(formData.get("visible")),
    })
    .eq("id", id);
  if (error) throw new Error(`Save failed: ${error.message}`);
  revalidatePath("/");
  revalidatePath("/admin/picks");
  redirect("/admin/picks?saved=1");
}

export async function removePick(formData: FormData) {
  await assertAdmin();
  const id = str(formData.get("id"));
  if (!id) throw new Error("Missing id.");
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from("editor_picks").delete().eq("id", id);
  if (error) throw new Error(`Delete failed: ${error.message}`);
  revalidatePath("/");
  revalidatePath("/admin/picks");
  redirect("/admin/picks?removed=1");
}

export async function movePick(formData: FormData) {
  await assertAdmin();
  const id = str(formData.get("id"));
  const dir = str(formData.get("dir"));
  if (!id || !dir) throw new Error("Missing args.");
  const supabase = getSupabaseAdmin();

  const { data: rows } = await supabase
    .from("editor_picks")
    .select("id,position")
    .order("position", { ascending: true });
  if (!rows) throw new Error("Load failed.");

  const idx = rows.findIndex((r) => r.id === id);
  const swapIdx = dir === "up" ? idx - 1 : idx + 1;
  if (idx === -1 || swapIdx < 0 || swapIdx >= rows.length) {
    redirect("/admin/picks");
  }
  const a = rows[idx];
  const b = rows[swapIdx];
  await supabase.from("editor_picks").update({ position: b.position }).eq("id", a.id);
  await supabase.from("editor_picks").update({ position: a.position }).eq("id", b.id);
  revalidatePath("/");
  revalidatePath("/admin/picks");
  redirect("/admin/picks");
}
