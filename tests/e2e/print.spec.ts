import { expect, test } from "@playwright/test";
import { PDFDocument } from "pdf-lib";
import { signInAs } from "./helpers";

test("P8.6 the printed transcript fits on 2 to 3 letter pages", async ({ page }, info) => {
  await signInAs(page, "amara");
  await page.goto("/s/transcript");
  await page.emulateMedia({ media: "print" });
  const pdf = await page.pdf({ format: "Letter", printBackground: true, margin: { top: "0.5in", bottom: "0.5in", left: "0.5in", right: "0.5in" } });
  await info.attach("transcript.pdf", { body: pdf, contentType: "application/pdf" });
  if (process.env.PRINT_PDF_OUT) (await import("node:fs")).writeFileSync(process.env.PRINT_PDF_OUT, pdf);
  const pages = (await PDFDocument.load(pdf)).getPageCount();
  expect(pages).toBeGreaterThanOrEqual(2);
  expect(pages).toBeLessThanOrEqual(3);
  // Navigation, the tab bar, toasts and sharing controls are left out of print.
  for (const hidden of ["Who Can See This", "Print transcript"]) {
    await expect(page.getByText(hidden).first()).toBeHidden();
  }
});
