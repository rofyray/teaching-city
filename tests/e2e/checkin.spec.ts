import { expect, test } from "@playwright/test";
import { resetDemo, signInAs } from "./helpers";

test.beforeAll(resetDemo);
test.afterAll(resetDemo);

test("P6.4 + P11.2 Dana rates week 6 with a drafted note and Amara reaches 5 of 5", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await signInAs(page, "dana");
  await expect(page.getByRole("heading", { name: "Ratings Due" })).toBeVisible();
  await page.goto("/m/rate/enr_fall_amara-okafor/6");
  await expect(page.getByRole("heading", { name: "Rate Amara's Week 6" })).toBeVisible();

  await page.getByRole("button", { name: "Submit week 6 rating" }).click();
  await expect(page.getByRole("alert").getByText("Fix These Before You Continue")).toBeVisible();

  const skills = [
    ["Analyzes financial data accurately", "Above standard"],
    ["Writes clearly for non-experts", "Meets standard"],
    ["Meets deadlines and follows through", "Above standard"],
    ["Works well with colleagues", "Meets standard"],
    ["Uses spreadsheet and budget tools", "Above standard"],
  ];
  for (const [skill, level] of skills) {
    await page.getByRole("radiogroup", { name: new RegExp(skill) }).getByRole("radio", { name: level }).click();
  }
  await expect(page.getByRole("status").getByText("5 of 5")).toBeVisible();

  await page.getByLabel("Note for Amara").fill("reconciled overtime, on time, paired with a colleague on parks numbers");
  await page.getByRole("button", { name: "Draft from my notes" }).click();
  await page.getByRole("button", { name: "Use this draft" }).click();
  await expect(page.getByLabel("Note for Amara")).toHaveValue(/Next week/);
  await expect(page.getByText("Signed Dana Ortiz")).toBeVisible();
  await page.getByRole("button", { name: "Submit week 6 rating" }).click();
  await expect(page.getByRole("status").getByText("Week 6 rating sent to Amara's transcript.").first()).toBeVisible();

  await signInAs(page, "amara");
  await expect(page.getByText("5 of 5 skills at the bar so far")).toBeVisible();
  await page.goto("/s/transcript");
  await expect(page.getByRole("table", { name: "Observed Skills" }).getByRole("columnheader", { name: "Week 6" })).toBeVisible();
});
