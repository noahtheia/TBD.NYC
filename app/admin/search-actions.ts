"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/admin-auth";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { str, bool } from "@/lib/form";
import { getSearchConfig, type SearchKindConfig } from "@/lib/search-config";
import { isSearchKind } from "@/lib/search-kinds";

async function assertAdmin() {
  if (!(await isAdmin())) throw new Error("Unauthorized");
}

/** Persist the full normalized config (8 rows) in one upsert — robust to an
 *  empty or partial table, so there are no per-row swap edge cases. */
async function saveConfig(config: SearchKindConfig[]) {
  const supabase = getSupabaseAdmin();
  const rows = config.map((c, i) => ({ kind: c.kind, position: i, enabled: c.enabled }));
  const { error } = await supabase.from("search_priority").upsert(rows);
  if (error) throw new Error(`Save failed: ${error.message}`);
  revalidatePath("/");
  revalidatePath("/admin/search");
}

export async function moveSearchKind(formData: FormData) {
  await assertAdmin();
  const kind = str(formData.get("kind"));
  const dir = str(formData.get("dir"));
  if (!kind || !isSearchKind(kind) || (dir !== "up" && dir !== "down")) {
    throw new Error("Missing or invalid args.");
  }

  const config = await getSearchConfig();
  const idx = config.findIndex((c) => c.kind === kind);
  const swapIdx = dir === "up" ? idx - 1 : idx + 1;
  if (idx === -1 || swapIdx < 0 || swapIdx >= config.length) {
    redirect("/admin/search");
  }
  [config[idx], config[swapIdx]] = [config[swapIdx], config[idx]];

  await saveConfig(config);
  redirect("/admin/search");
}

export async function setSearchKindEnabled(formData: FormData) {
  await assertAdmin();
  const kind = str(formData.get("kind"));
  if (!kind || !isSearchKind(kind)) throw new Error("Missing or invalid kind.");
  const enabled = bool(formData.get("enabled"));

  const config = await getSearchConfig();
  const target = config.find((c) => c.kind === kind);
  if (target) target.enabled = enabled;

  await saveConfig(config);
  redirect("/admin/search");
}
