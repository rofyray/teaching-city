import { expect, test, type Page } from "@playwright/test";
import { Client } from "pg";
import { resetDemo, signInAs } from "./helpers";

// These flows change data, so they run against the local e2e database only.
test.skip(!!process.env.E2E_BASE_URL, "Mutating flows run against the local e2e database only");
test.describe.configure({ mode: "serial" });
test.beforeAll(resetDemo);
test.afterAll(resetDemo);

const E2E_DB = process.env.E2E_DATABASE_URL ?? "postgres://postgres@localhost:5433/teaching_city_e2e";

async function db<T>(run: (c: Client) => Promise<T>) {
  const client = new Client({ connectionString: E2E_DB });
  await client.connect();
  try {
    return await run(client);
  } finally {
    await client.end();
  }
}

const toast = (page: Page, text: string | RegExp) => page.getByRole("status").filter({ hasText: text }).first();

test("P4.3 and P4.4: an accounting student sees Budget Office first and the match is confirmed", async ({ page }) => {
  // A synthetic test-only student who finished onboarding with both consents and no match.
  await db(async (c) => {
    await c.query(`delete from "user" where id = 'u_e2e-unmatched'`);
    await c.query(`insert into "user" (id, name, email, email_verified) values ('u_e2e-unmatched', 'Avery Lane', 'avery.lane@wsu.example.edu', true)`);
    await c.query(`insert into memberships (id, user_id, organization_id, role) values ('m_e2e_unmatched', 'u_e2e-unmatched', 'org_wsu', 'student')`);
    await c.query(
      `insert into student_profiles (id, user_id, college_org_id, major, major_category, class_year, availability, onboarded_at)
       values ('sp_e2e-unmatched', 'u_e2e-unmatched', 'org_wsu', 'Accounting', 'accounting_finance', 'junior', $1, now())`,
      [JSON.stringify([1, 2, 3, 4, 5].map((day) => ({ day, start: "09:00", end: "12:00" })))],
    );
    for (const type of ["program_participation", "share_city_hr"]) {
      await c.query(`insert into consents (id, student_id, type, granted, version, granted_at) values ($2, 'sp_e2e-unmatched', $1, true, '2026-11-v1', now())`, [type, `con_e2e_${type}`]);
    }
  });
  await signInAs(page, "renee");
  await page.goto("/city/matching");
  const card = page.getByRole("article").filter({ hasText: "Avery Lane" }).or(page.locator("section, li").filter({ hasText: "Avery Lane" })).first();
  await expect(card).toBeVisible();
  await expect(card.getByText("Budget Office").first()).toBeVisible();
  await expect(card.getByText("15 of 15 free hours overlap").first()).toBeVisible();
  await card.getByRole("button", { name: "Confirm match" }).click();
  await expect(toast(page, /Match confirmed\. Avery and .* have been notified\./)).toBeVisible();
  const status = await db((c) => c.query(`select status, match_reason from enrollments where student_id = 'sp_e2e-unmatched'`));
  expect(status.rows[0].status).toBe("active");
  expect(status.rows[0].match_reason).toContain("Accounting maps to the Budget Office.");
  const audit = await db((c) => c.query(`select count(*)::int as n from audit_log where entity = 'enrollments' and entity_id in (select id from enrollments where student_id = 'sp_e2e-unmatched')`));
  expect(audit.rows[0].n).toBeGreaterThan(0);
});

test("P9.4: record an offer for Luis, then mark it accepted", async ({ page }) => {
  await signInAs(page, "renee");
  await page.goto("/city/openings");
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "America/Chicago" });
  await page.getByLabel(/Offer date.*Luis Herrera/).fill(today);
  await page.getByRole("button", { name: /Save.*Offer date, Luis Herrera/ }).click();
  await expect(toast(page, "Saved")).toBeVisible();
  await expect(page.getByText(/\d+ days to offer/).first()).toBeVisible();
  await page.getByRole("button", { name: "Accepted" }).first().click();
  await expect(toast(page, "Saved")).toBeVisible();
  await page.goto("/city/pool");
  const row = page.getByRole("row").filter({ hasText: "Luis Herrera" });
  await expect(row.getByText("Hired")).toBeVisible();
});

test("P9.4: create an opening and invite from the hiring lane", async ({ page }) => {
  await signInAs(page, "renee");
  await page.goto("/city/openings");
  await page.getByRole("button", { name: "New opening" }).click();
  await page.getByLabel("Title").fill("Engineering Technician I, Drainage");
  await page.getByRole("button", { name: "Save" }).first().click();
  await expect(toast(page, "Saved")).toBeVisible();
  const opening = page.getByRole("listitem").filter({ has: page.getByRole("heading", { name: "Engineering Technician I, Drainage" }) });
  await expect(opening).toBeVisible();
  await opening.getByRole("checkbox").first().check();
  await opening.getByRole("button", { name: "Invite from the hiring lane" }).click();
  await expect(toast(page, "Invited")).toBeVisible();
});

test("P11.3: approve a plain-language version and students see it", async ({ page }) => {
  await signInAs(page, "renee");
  await page.goto("/city/classifications");
  const editor = page.getByRole("listitem").filter({ has: page.getByRole("heading", { name: "Engineering Technician I (ET1)" }) });
  await editor.getByLabel("Summary").fill("You help keep streets, water and drainage working by measuring, checking plans and writing field reports.");
  await editor.getByLabel("Day to Day").fill("Take field measurements\nCheck plans for missing details\nWrite field reports");
  await editor.getByLabel("What You Need").fill("An associate degree in engineering technology, or equivalent experience from a Teaching City rotation\nA valid driver's license");
  await editor.getByRole("button", { name: "Approve for students" }).click();
  await expect(toast(page, "Approved. Students now see this version.")).toBeVisible();
  await signInAs(page, "luis");
  await page.goto("/s/openings");
  await expect(page.getByText("Reviewed by city staff")).toBeVisible();
  await expect(page.getByText("Write field reports")).toBeVisible();
});

test("P10.1: ending a pledge hides its students from that vendor", async ({ page }) => {
  await signInAs(page, "kim");
  await expect(page.getByRole("heading", { name: "Peter Novak" })).toBeVisible();
  await signInAs(page, "renee");
  await page.goto("/city/vendors");
  await page.getByRole("button", { name: /End pledge.*Brightline Engineering/ }).click();
  await expect(toast(page, "Saved")).toBeVisible();
  await signInAs(page, "kim");
  await expect(page.getByRole("heading", { name: "No Completers Are Sharing Right Now" })).toBeVisible();
});

test("P10.1: add a vendor pledge", async ({ page }) => {
  await signInAs(page, "renee");
  await page.goto("/city/vendors");
  await page.getByRole("button", { name: "Add a pledge" }).click();
  await page.getByLabel("Firm").fill("Riverbend Survey Co");
  await page.getByLabel("Contact").fill("Jo Park");
  await page.getByLabel("Roles offered").fill("Survey technician");
  await page.getByRole("button", { name: "Save" }).click();
  await expect(toast(page, "Saved")).toBeVisible();
  await expect(page.getByRole("cell", { name: "Riverbend Survey Co" })).toBeVisible();
});

test("P9.2: completing a rotation early needs a reason and is audit logged", async ({ page }) => {
  await signInAs(page, "renee");
  await page.goto("/city");
  await page.getByRole("button", { name: /Mark rotation complete.*Jordan Ellis/ }).click();
  const form = page.locator("form").filter({ hasText: "Reason" }).first();
  await form.getByRole("button", { name: "Mark rotation complete" }).click();
  await expect(form.getByText("Completing before week 15 needs a reason.").last()).toBeVisible();
  await form.getByLabel("Reason").fill("Hired early by the Finance Department");
  await form.getByRole("button", { name: "Mark rotation complete" }).click();
  await expect(toast(page, "Rotation marked complete.")).toBeVisible();
  const rows = await db((c) =>
    c.query(`select e.status, (select count(*)::int from audit_log a where a.entity_id = e.id) as audits from enrollments e where e.id = 'enr_fall_jordan-ellis'`),
  );
  expect(rows.rows[0].status).toBe("completed");
  expect(rows.rows[0].audits).toBeGreaterThan(0);
});
