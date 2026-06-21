/** Escape a single CSV field per RFC 4180. Arrays join with "; ", objects
 *  serialize to JSON, null/undefined become empty. */
export function csvEscape(value: unknown): string {
  if (value == null) return "";
  let s: string;
  if (Array.isArray(value)) s = value.join("; ");
  else if (typeof value === "object") s = JSON.stringify(value);
  else s = String(value);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** Build a CSV document (CRLF line endings) from rows using ordered columns. */
export function toCsv(rows: Record<string, unknown>[], columns: string[]): string {
  const header = columns.map(csvEscape).join(",");
  const lines = rows.map((r) => columns.map((c) => csvEscape(r[c])).join(","));
  return [header, ...lines].join("\r\n");
}
