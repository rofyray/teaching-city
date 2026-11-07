import { expect, test } from "@playwright/test";
import { resetDemo, signInAs } from "./helpers";

test.beforeAll(resetDemo);

test("P5.1 F1 rotation home shows seeded values", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await signInAs(page, "amara");
  await expect(page.getByRole("heading", { name: "Budget Office" })).toBeVisible();
  const week = page.getByRole("region", { name: "This week" });
  await expect(week.getByText("Dana rates your week")).toBeVisible();
  await expect(week.getByText("Due Friday")).toBeVisible();
  await expect(week.getByText("11 of 12")).toBeVisible();
  await expect(week.getByText("$1,122")).toBeVisible();
  await expect(page.getByText("Week 6 of 15")).toBeVisible();
  await expect(page.getByText("4 of 5 skills at the bar so far")).toBeVisible();
  await expect(page.getByText("2 of 3")).toBeVisible();
});

test("P5.3 hours validation errors", async ({ page }) => {
  await signInAs(page, "amara");
  await page.goto("/s/hours");
  const first = page.getByRole("region", { name: "Week 6" });
  const input = first.getByLabel("Hours worked");
  await input.fill("13");
  await first.getByRole("button", { name: "Save hours" }).click();
  await expect(first.getByText("Enter 12 hours or fewer for one week.")).toBeVisible();
  await input.fill("ten");
  await first.getByRole("button", { name: "Save hours" }).click();
  await expect(first.getByText("Enter hours as a number, like 11 or 10.5.")).toBeVisible();
});

test("P8.1 transcript shows the observed skills grid and sharing defaults", async ({ page }) => {
  await signInAs(page, "amara");
  await page.goto("/s/transcript");
  await expect(page.getByRole("heading", { name: "Amara Okafor" })).toBeVisible();
  const table = page.getByRole("table", { name: "Observed skills" });
  await expect(table.getByRole("rowheader", { name: "Works well with colleagues" })).toBeVisible();
  await expect(table.getByRole("columnheader", { name: "Week 5" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Who vouches for Amara" })).toBeVisible();
  await expect(page.getByRole("switch", { name: "City HR" })).toHaveAttribute("aria-checked", "true");
  await expect(page.getByRole("switch", { name: "Vendor Bridge employers" })).toHaveAttribute("aria-checked", "false");
  await expect(page.getByRole("switch", { name: "Anyone with a link" })).toHaveAttribute("aria-checked", "false");
});

test("P8.3 turning City HR off asks for confirmation", async ({ page }) => {
  await signInAs(page, "amara");
  await page.goto("/s/transcript");
  await page.getByRole("switch", { name: "City HR" }).click();
  await expect(page.getByRole("dialog", { name: "Stop sharing with City HR?" })).toBeVisible();
  await page.getByRole("button", { name: "Cancel" }).click();
  await expect(page.getByRole("switch", { name: "City HR" })).toHaveAttribute("aria-checked", "true");
});
