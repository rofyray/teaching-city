import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const { visibleStudentIds } = await import("@/server/queries/vendor");

describe("vendor visibility (BR-10)", () => {
  const candidates = [
    { studentId: "peter", enrollmentStatus: "completed", shareVendorBridge: true },
    { studentId: "hana", enrollmentStatus: "completed", shareVendorBridge: false },
    { studentId: "amara", enrollmentStatus: "active", shareVendorBridge: true },
    { studentId: "jacob", enrollmentStatus: "withdrawn", shareVendorBridge: true },
  ];

  it("shows completers who turned on Vendor Bridge sharing", () => {
    expect(visibleStudentIds(candidates, true)).toEqual(["peter"]);
  });

  it("shows nobody when the firm's pledge has ended", () => {
    expect(visibleStudentIds(candidates, false)).toEqual([]);
  });

  it("drops a student on the next load after sharing is turned off", () => {
    const off = candidates.map((c) => (c.studentId === "peter" ? { ...c, shareVendorBridge: false } : c));
    expect(visibleStudentIds(off, true)).toEqual([]);
  });

  it("lists a student once even with two completed enrollments", () => {
    expect(visibleStudentIds([candidates[0], { ...candidates[0] }], true)).toEqual(["peter"]);
  });
});
