/**
 * P0.9: fails when any file in src/, messages/, docs/ or scripts/ contains an em dash (U+2014),
 * or when any message value contains "→" or is all caps longer than 3 characters.
 * Usage: tsx scripts/check-copy.ts [extra paths...]
 */
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const EM_DASH = String.fromCharCode(0x2014);
const ARROW = String.fromCharCode(0x2192);
const DEFAULT_ROOTS = ["src", "messages", "docs", "scripts", "content", "tests"];
const SKIP_DIRS = new Set(["node_modules", ".next", "fixtures"]);
const TEXT = /\.(ts|tsx|js|mjs|json|md|css|txt|yml|yaml)$/;

export type Problem = { file: string; line?: number; message: string };

function walk(path: string, out: string[]) {
  if (!existsSync(path)) return;
  const stat = statSync(path);
  if (stat.isFile()) {
    if (TEXT.test(path)) out.push(path);
    return;
  }
  for (const entry of readdirSync(path)) {
    if (SKIP_DIRS.has(entry)) continue;
    walk(join(path, entry), out);
  }
}

function flatten(value: unknown, prefix = ""): [string, string][] {
  if (typeof value === "string") return [[prefix, value]];
  if (value && typeof value === "object") {
    return Object.entries(value).flatMap(([k, v]) => flatten(v, prefix ? `${prefix}.${k}` : k));
  }
  return [];
}

export function checkFiles(paths: string[]): Problem[] {
  const files: string[] = [];
  for (const p of paths) walk(p, files);
  const problems: Problem[] = [];
  for (const file of files) {
    const text = readFileSync(file, "utf8");
    text.split("\n").forEach((line, i) => {
      if (line.includes(EM_DASH)) problems.push({ file, line: i + 1, message: "em dash" });
    });
    if (/(^|\/)messages\/[^/]+\.json$/.test(file)) {
      for (const [key, value] of flatten(JSON.parse(text))) {
        if (value.includes(ARROW)) problems.push({ file, message: `${key} contains an arrow` });
        const letters = value.replace(/\{[^}]*\}/g, "").replace(/[^\p{L}]/gu, "");
        if (letters.length > 3 && letters === letters.toUpperCase() && letters !== letters.toLowerCase()) {
          problems.push({ file, message: `${key} is all caps` });
        }
      }
    }
  }
  return problems;
}

if (process.argv[1]?.endsWith("check-copy.ts")) {
  const args = process.argv.slice(2);
  const problems = checkFiles(args.length ? args : DEFAULT_ROOTS);
  for (const p of problems) console.error(`${p.file}${p.line ? `:${p.line}` : ""}: ${p.message}`);
  if (problems.length) {
    console.error(`Copy check failed with ${problems.length} problem(s).`);
    process.exit(1);
  }
  console.log("Copy check passed.");
}
