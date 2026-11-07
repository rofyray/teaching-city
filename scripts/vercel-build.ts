/**
 * Vercel build: apply migrations, seed an empty database, then build. Preview databases are
 * reseeded only with SEED_PREVIEW_DB=true, so a preview that shares the production database
 * never resets it. Production data is never reseeded once it exists (P14.9).
 */
import "./env";
import { execSync } from "node:child_process";
import { sql } from "drizzle-orm";
import { db } from "../src/server/db";

function run(command: string) {
  execSync(command, { stdio: "inherit", env: process.env });
}

async function main() {
  if (process.env.DATABASE_URL) {
    run("pnpm db:migrate");
    const env = process.env.VERCEL_ENV;
    const result = await db.execute(sql`select count(*)::int as n from programs`);
    const empty = Number((result.rows[0] as { n: number }).n) === 0;
    const previewOptIn = env === "preview" && process.env.SEED_PREVIEW_DB === "true";
    if (empty || previewOptIn) run("pnpm db:seed");
  } else {
    console.warn("DATABASE_URL is not set; skipping migrations and seed");
  }
  run("next build");
  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
