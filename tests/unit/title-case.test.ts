import { describe, expect, it } from "vitest";
import { titleCase } from "@/lib/title-case";

describe("titleCase", () => {
  it("capitalizes major words and keeps minor ones lower case", () => {
    expect(titleCase("Where the money can come from")).toBe("Where the Money Can Come From");
    expect(titleCase("Hiring lane or Vendor Bridge")).toBe("Hiring Lane or Vendor Bridge");
    expect(titleCase("A paid rotation in city government, for credit")).toBe("A Paid Rotation in City Government, for Credit");
  });
  it("leaves placeholders, names and acronyms alone", () => {
    expect(titleCase("Rate {firstName}'s week {week}")).toBe("Rate {firstName}'s Week {week}");
    expect(titleCase("Stop sharing with City HR?")).toBe("Stop Sharing with City HR?");
    expect(titleCase("Senior references, {count} of {total}")).toBe("Senior References, {count} of {total}");
  });
  it("handles hyphens and colons", () => {
    expect(titleCase("Exemplar idea: the plain-language view")).toBe("Exemplar Idea: The Plain-Language View");
  });
});
