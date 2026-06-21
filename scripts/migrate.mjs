// Apply SQL migrations in supabase/migrations/*.sql (idempotent) to the database.
// Run: node --env-file=.env.local scripts/migrate.mjs
// Requires SUPABASE_DB_URL (Supabase → Project Settings → Database connection string).

import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import pg from "pg";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIR = join(__dirname, "..", "supabase", "migrations");

const connectionString = process.env.SUPABASE_DB_URL;
if (!connectionString) {
  console.error("Missing SUPABASE_DB_URL.");
  process.exit(1);
}

const client = new pg.Client({
  connectionString,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 15000,
});

try {
  await client.connect();
} catch (e) {
  console.error("Could not connect to the database:", e.message);
  console.error("(The direct :5432 connection may be blocked/IPv6-only here — run the SQL in the Supabase SQL editor instead.)");
  process.exit(2);
}

const files = readdirSync(DIR).filter((f) => f.endsWith(".sql")).sort();
for (const f of files) {
  process.stdout.write(`applying ${f} … `);
  try {
    await client.query(readFileSync(join(DIR, f), "utf8"));
    console.log("ok");
  } catch (e) {
    console.log("FAILED");
    console.error(`  ${e.message}`);
    await client.end();
    process.exit(1);
  }
}
await client.end();
console.log("All migrations applied.");
