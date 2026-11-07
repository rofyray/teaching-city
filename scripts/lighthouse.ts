/**
 * P14.2: Lighthouse mobile runs (simulated Slow 4G with 4x CPU slowdown) on the student and
 * preceptor routes, signed in as demo personas. Checks the Section 9.7 budget: LCP under 2.5s
 * and initial JavaScript under 170 KB gzipped.
 * Usage: BASE_URL=https://teaching-city-app.vercel.app pnpm lighthouse
 */
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { chromium } from "@playwright/test";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const OUT = process.env.LIGHTHOUSE_OUT ?? "lighthouse-reports";
const PAGES = [
  { persona: "Continue as Amara Okafor", path: "/s", name: "student-home" },
  { persona: "Continue as Amara Okafor", path: "/s/transcript", name: "transcript" },
  { persona: "Continue as Dana Ortiz", path: "/m/rate/enr_fall_amara-okafor/6", name: "checkin" },
];
const LCP_BUDGET_MS = 2500;
const JS_BUDGET_BYTES = 170 * 1024;

async function sessionCookie(persona: string) {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto(`${BASE}/demo`);
  await page.getByRole("button", { name: persona }).click();
  await page.waitForURL((url) => !url.pathname.startsWith("/demo"));
  const cookies = await page.context().cookies();
  await browser.close();
  return cookies.map((c) => `${c.name}=${c.value}`).join("; ");
}

type Audit = { numericValue?: number; details?: { items?: { resourceType?: string; transferSize?: number }[] } };

async function main() {
  mkdirSync(OUT, { recursive: true });
  const rows: string[] = [];
  let failed = false;
  for (const p of PAGES) {
    const headers = `${OUT}/${p.name}-headers.json`;
    writeFileSync(headers, JSON.stringify({ Cookie: await sessionCookie(p.persona) }));
    const report = `${OUT}/${p.name}.json`;
    execFileSync(
      "pnpm",
      [
        "exec",
        "lighthouse",
        `${BASE}${p.path}`,
        "--quiet",
        "--form-factor=mobile",
        "--throttling-method=simulate",
        "--only-categories=performance,accessibility,best-practices",
        `--extra-headers=${headers}`,
        "--output=json",
        "--output=html",
        `--output-path=${OUT}/${p.name}`,
        "--chrome-flags=--headless=new",
      ],
      { stdio: "inherit", env: { ...process.env, CHROME_PATH: chromium.executablePath() } },
    );
    const lhr = JSON.parse(readFileSync(report.replace(".json", ".report.json"), "utf8"));
    const audits = lhr.audits as Record<string, Audit>;
    const lcp = audits["largest-contentful-paint"].numericValue ?? 0;
    const js = (audits["network-requests"].details?.items ?? [])
      .filter((i) => i.resourceType === "Script")
      .reduce((sum, i) => sum + (i.transferSize ?? 0), 0);
    const score = (k: string) => Math.round((lhr.categories[k]?.score ?? 0) * 100);
    const ok = lcp < LCP_BUDGET_MS && js < JS_BUDGET_BYTES;
    failed ||= !ok;
    rows.push(
      `${ok ? "PASS" : "FAIL"}  ${p.path}  performance ${score("performance")}, accessibility ${score("accessibility")}, best practices ${score("best-practices")}, LCP ${(lcp / 1000).toFixed(2)}s, JS ${(js / 1024).toFixed(0)} KB`,
    );
  }
  console.log(rows.join("\n"));
  process.exit(failed ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
