import { expect, test } from "@playwright/test";

const SECTIONS = [
  "Project Title",
  "Team Information",
  "Problem Statement",
  "Target Users",
  "Solution Description",
  "Equity Statement",
  "Pilot Plan",
  "Success Metrics",
  "Demonstration",
  "AI-Use Disclosure",
  "Sources and Credits",
];

test("submission page has every required element and expands", async ({ page }) => {
  await page.goto("/submission");
  for (const name of SECTIONS) await expect(page.getByRole("heading", { name, exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Expand All" }).click();
  for (const h of ["1. Pilot Host", "3. Timeline", "5. Estimated Cost", "7. Risks and Mitigation", "8. Scale-Up Path"]) {
    await expect(page.getByRole("heading", { name: h })).toBeVisible();
  }
  await expect(page.getByText(/500 to 750 words · \d+ words/).first()).toBeVisible();
  await expect(page.getByRole("link", { name: "Our AI Use" }).first()).toBeVisible();
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
});

test("old research and pilot pages redirect to the submission", async ({ page }) => {
  for (const path of ["/why", "/pilot"]) {
    await page.goto(path);
    await expect(page).toHaveURL(/\/submission$/);
  }
});

test("landing leads with the tagline and a Demo action", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(/Nursing has clinicals\.\s*Now every major does\./);
  await page.getByRole("main").getByRole("link", { name: "Demo" }).first().click();
  await expect(page).toHaveURL(/\/demo$/);
});
