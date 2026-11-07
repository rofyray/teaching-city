import { expect, test } from "@playwright/test";
import { expectNoAxeViolations, signInAs, type PERSONAS } from "./helpers";

const PUBLIC = ["/", "/why", "/how-it-works", "/pilot", "/about/ai", "/demo", "/sign-in"];
const BY_PERSONA: [keyof typeof PERSONAS, string[]][] = [
  ["amara", ["/s", "/s/hours", "/s/work", "/s/transcript", "/s/people", "/s/openings", "/s/settings", "/s/onboarding", "/notifications"]],
  ["dana", ["/m", "/m/rate/enr_fall_amara-okafor/6", "/m/students/enr_fall_amara-okafor", "/m/references"]],
  ["marcus", ["/m", "/m/meetings", "/m/references"]],
  ["renee", ["/city", "/city/units", "/city/matching", "/city/classifications", "/city/pool", "/city/openings", "/city/vendors", "/city/outcomes", "/city/pilot"]],
  ["omar", ["/college", "/college/outcomes"]],
  ["kim", ["/vendor", "/vendor/students/sp_peter-novak", "/vendor/interviews"]],
  ["luis", ["/s/openings"]],
];

for (const width of [390, 1280]) {
  test.describe(`axe at ${width}px`, () => {
    test.use({ viewport: { width, height: 900 } });

    test("public pages", async ({ page }) => {
      for (const path of PUBLIC) {
        await page.goto(path);
        await expectNoAxeViolations(page);
        const scroll = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
        expect(scroll, `horizontal scroll on ${path}`).toBeLessThanOrEqual(0);
      }
    });

    for (const [persona, paths] of BY_PERSONA) {
      test(`${persona} pages`, async ({ page }) => {
        await signInAs(page, persona);
        for (const path of paths) {
          const response = await page.goto(path);
          expect(response?.status(), path).toBe(200);
          await expectNoAxeViolations(page);
          const scroll = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
          expect(scroll, `horizontal scroll on ${path}`).toBeLessThanOrEqual(0);
        }
      });
    }
  });
}

test("every page has a unique title", async ({ page }) => {
  const titles = new Map<string, string>();
  for (const path of PUBLIC) {
    await page.goto(path);
    titles.set(path, await page.title());
  }
  expect(new Set(titles.values()).size).toBe(titles.size);
});
