import { describe, expect, it } from "vitest";
import { BUDGET_DEFAULTS, computeMetrics, median, pilotBudget, type MetricStudent } from "@/domain/metrics";

const base: MetricStudent = {
  status: "completed",
  demographicConsent: true,
  firstGen: false,
  pell: false,
  confirmedRefs: 3,
  offerDays: null,
  hiredByCity: false,
  vendorInterview: false,
  underemployed12: null,
  peer: false,
};

describe("pilot budget", () => {
  it("reproduces the brief with default assumptions", () => {
    expect(pilotBudget(BUDGET_DEFAULTS)).toEqual({ perStudent: 2805, wages: 84150, total: 135150 });
  });
});

describe("metrics", () => {
  it("takes the middle value", () => {
    expect(median([12, 18, 21, 24, 27, 33, 40])).toBe(24);
    expect(median([])).toBeNull();
  });
  it("reports in progress for an active cohort and suppresses small reach groups", () => {
    const m = computeMetrics([{ ...base, status: "active" }], false);
    expect(m.find((x) => x.key === "completion")?.status).toBe("in_progress");
    expect(m.find((x) => x.key === "reach")?.status).toBe("fewer_than_5");
    expect(m.find((x) => x.key === "underemployment")?.status).toBe("not_measured");
  });
});
