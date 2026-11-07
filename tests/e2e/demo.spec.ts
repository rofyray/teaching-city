import { expect, test } from "@playwright/test";
import { PERSONAS } from "./helpers";

const HOMES: Record<keyof typeof PERSONAS, RegExp> = {
  amara: /\/s$/,
  dana: /\/m$/,
  marcus: /\/m$/,
  renee: /\/city$/,
  omar: /\/college$/,
  kim: /\/vendor$/,
  luis: /\/s\/openings$/,
};

test.describe("P1.5 demo personas", () => {
  for (const persona of Object.keys(PERSONAS) as (keyof typeof PERSONAS)[]) {
    test(`${persona} lands on the right home quickly`, async ({ page }) => {
      await page.goto("/demo");
      await page.getByRole("button", { name: PERSONAS[persona] }).click();
      const started = Date.now();
      await page.waitForURL(HOMES[persona], { timeout: 10_000 });
      expect(Date.now() - started).toBeLessThan(3_000);
      await expect(page.getByText("Sample data. Every person and number here is fictional.")).toBeVisible();
      await page.context().clearCookies();
    });
  }
});

test("P1.6 invalid email shows the inline error", async ({ page }) => {
  await page.goto("/sign-in");
  await page.getByLabel("Email").fill("not-an-email");
  await page.getByRole("button", { name: "Email me a sign-in link" }).click();
  await expect(page.getByText("Enter an email address like name@example.edu.")).toBeVisible();
});

test("P0.7 switching locale changes the banner text", async ({ page }) => {
  await page.goto("/sign-in");
  await page.getByRole("button", { name: "Español" }).click();
  await expect(page.getByText("Datos de ejemplo. Todas las personas y cifras son ficticias.")).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("lang", "es");
  await page.getByRole("button", { name: "English" }).click();
  await expect(page.getByText("Sample data. Every person and number here is fictional.")).toBeVisible();
});
