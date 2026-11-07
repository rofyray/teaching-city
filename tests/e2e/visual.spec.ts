import { test, type Page } from "@playwright/test";
import { resetDemo, signInAs } from "./helpers";

/**
 * P14.3 baselines: screenshots of F1, F2 and F3 at 390px and 1280px, saved to tests/visual and
 * compared with the design PNGs by eye. Run with VISUAL=1; skipped otherwise because font
 * rendering differs between machines.
 */
test.skip(!process.env.VISUAL, "Set VISUAL=1 to refresh the visual baselines");
test.beforeAll(resetDemo);

const shots: { name: string; persona: "amara" | "dana"; path: string }[] = [
  { name: "F1-student-home", persona: "amara", path: "/s" },
  { name: "F2-preceptor-checkin", persona: "dana", path: "/m/rate/enr_fall_amara-okafor/6" },
  { name: "F3-civic-transcript", persona: "amara", path: "/s/transcript" },
];

async function hideToasts(page: Page) {
  await page.addStyleTag({ content: "ol[aria-label='Notifications'] { display: none !important; } nextjs-portal { display: none !important; }" });
}

for (const width of [390, 1280]) {
  for (const shot of shots) {
    test(`${shot.name} at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: width === 390 ? 844 : 900 });
      await signInAs(page, shot.persona);
      await page.goto(shot.path);
      await page.waitForLoadState("networkidle");
      await hideToasts(page);
      await page.screenshot({ path: `tests/visual/${shot.name}-${width}.png`, fullPage: true });
    });
  }
}
