import { execSync } from "node:child_process";

/** Fresh migrated and seeded database for the e2e run (skipped against a deployed URL). */
export default function globalSetup() {
  if (process.env.E2E_BASE_URL) return;
  const env = { ...process.env, DATABASE_URL: process.env.E2E_DATABASE_URL ?? "postgres://postgres@localhost:5433/teaching_city_e2e" };
  execSync("pnpm db:migrate && pnpm db:seed", { env, stdio: "inherit" });
}
