import AxeBuilder from "@axe-core/playwright";
import { expect, type Page } from "@playwright/test";

export const PERSONAS = {
  amara: "Continue as Amara Okafor",
  dana: "Continue as Dana Ortiz",
  marcus: "Continue as Marcus Hill",
  renee: "Continue as Renee Carter",
  omar: "Continue as Omar Patel",
  kim: "Continue as Kim Nguyen",
  luis: "Continue as Luis Herrera",
} as const;

export async function signInAs(page: Page, persona: keyof typeof PERSONAS) {
  await page.context().clearCookies();
  await page.goto("/demo");
  await page.getByRole("button", { name: PERSONAS[persona] }).click();
  await page.waitForURL((url) => !url.pathname.startsWith("/demo"));
}

export async function expectNoAxeViolations(page: Page) {
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
  const serious = results.violations.map((v) => `${v.id} (${v.impact}): ${v.nodes.map((n) => n.target.join(" ")).slice(0, 3).join(", ")}`);
  expect(serious, `axe violations on ${page.url()}`).toEqual([]);
}

export async function resetDemo() {
  const { execSync } = await import("node:child_process");
  if (process.env.E2E_BASE_URL) return;
  execSync("pnpm db:seed", {
    env: { ...process.env, DATABASE_URL: process.env.E2E_DATABASE_URL ?? "postgres://postgres@localhost:5433/teaching_city_e2e" },
    stdio: "ignore",
  });
}
