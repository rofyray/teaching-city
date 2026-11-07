import { expect, test } from "@playwright/test";
import { resetDemo, signInAs } from "./helpers";

test.beforeAll(resetDemo);
test.afterAll(resetDemo);

const HIDDEN = ["Observed Skills", "Hours logged", "Steady week. Next week, take the lead on one task.", "Who Can See This", "Pell", "first in my family"];

test("P8.4 vendor view shows only BR-10 fields", async ({ page }) => {
  await signInAs(page, "kim");
  await expect(page.getByRole("heading", { name: "Peter Novak" })).toBeVisible();
  await page.goto("/vendor/students/sp_peter-novak");
  await expect(page.getByRole("heading", { name: "Peter Novak" })).toBeVisible();
  const text = await page.locator("main, body").first().innerText();
  for (const hidden of HIDDEN) expect(text).not.toContain(hidden);
});

test("P8.5 public link shows the shared view, then 404 once turned off", async ({ page, request }) => {
  await signInAs(page, "amara");
  await page.goto("/s/transcript");
  await page.getByRole("switch", { name: "Anyone with a link" }).click();
  const link = await page.getByText(/\/t\//).innerText();
  const url = new URL(link.trim());
  const publicPage = await page.context().browser()!.newPage();
  await publicPage.goto(url.pathname);
  await expect(publicPage.getByText("Shared by Amara. This is a read-only copy.")).toBeVisible();
  const text = await publicPage.locator("body").innerText();
  for (const hidden of HIDDEN) expect(text).not.toContain(hidden);
  await page.getByRole("button", { name: "Turn off" }).click();
  await expect(page.getByRole("switch", { name: "Anyone with a link" })).toHaveAttribute("aria-checked", "false");
  const gone = await request.get(url.pathname);
  expect(gone.status()).toBe(404);
  await publicPage.close();
});

test("P5.4 files are served only through the permission-checked proxy", async ({ page, request }) => {
  const anonymous = await request.get("/api/files/ws_enr_fall_amara-okafor_3");
  expect(anonymous.status()).toBe(404);
  await signInAs(page, "amara");
  const own = await page.request.get("/api/files/ws_enr_fall_amara-okafor_3");
  expect(own.status()).toBe(200);
  expect(own.headers()["content-type"]).toBe("application/pdf");
});
