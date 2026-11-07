import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { checkFiles } from "../../scripts/check-copy";

// Fixtures are written at runtime so the repository itself never contains an em dash.
const dir = mkdtempSync(join(tmpdir(), "copy-check-"));
const emDashFile = join(dir, "em-dash.txt");
writeFileSync(emDashFile, `This line has an em dash ${String.fromCharCode(0x2014)} in it.\n`);
mkdirSync(join(dir, "messages"));
const messagesFile = join(dir, "messages", "en.json");
writeFileSync(messagesFile, JSON.stringify({ a: { loud: "STOP THIS", arrow: `Next ${String.fromCharCode(0x2192)}`, ok: "OK", fine: "Fine" } }));

describe("P0.9 copy check", () => {
  it("fails on an em dash fixture", () => {
    expect(checkFiles([emDashFile]).map((p) => p.message)).toEqual(["em dash"]);
  });
  it("flags arrows and all caps in message values, allowing short caps", () => {
    expect(checkFiles([messagesFile]).map((p) => p.message).sort()).toEqual(["a.arrow contains an arrow", "a.loud is all caps"]);
  });
  it("passes on the real source tree", () => {
    expect(checkFiles(["src", "messages", "scripts", "content"])).toEqual([]);
  });
});
