import { expect, test } from "@playwright/test";

test("P14.8 the app meets Chrome's install criteria", async ({ page }) => {
  await page.goto("/");
  const manifest = await page.evaluate(async () => {
    const link = document.querySelector<HTMLLinkElement>('link[rel="manifest"]');
    return link ? (await fetch(link.href)).json() : null;
  });
  expect(manifest).toMatchObject({ name: "Teaching City", display: "standalone", start_url: "/s" });
  const cdp = await page.context().newCDPSession(page);
  const { installabilityErrors } = await cdp.send("Page.getInstallabilityErrors");
  expect(installabilityErrors).toEqual([]);
});
