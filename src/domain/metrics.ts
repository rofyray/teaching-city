import { MIN_GROUP } from "./rules";

export type MetricStudent = {
  status: "proposed" | "active" | "completed" | "withdrawn";
  demographicConsent: boolean;
  firstGen: boolean | null;
  pell: boolean | null;
  confirmedRefs: number;
  /** Days from joining the hiring lane to the first city offer, when one was made. */
  offerDays: number | null;
  hiredByCity: boolean;
  vendorInterview: boolean;
  /** 12-month survey: true when in a job that does not need a degree. Null when no reading. */
  underemployed12: boolean | null;
  peer: boolean;
};

export type MetricKey = "completion" | "reach" | "references" | "offers" | "offerDays" | "vendor" | "underemployment";

export type MetricStatus = "on_target" | "below_target" | "in_progress" | "not_measured" | "fewer_than_5";

export type MetricResult = {
  key: MetricKey;
  status: MetricStatus;
  /** Percent (0 to 100, one decimal) or days for offerDays. */
  value: number | null;
  numerator: number | null;
  denominator: number | null;
  unit: "percent" | "days" | "comparison";
};

export const METRIC_ORDER: MetricKey[] = [
  "completion",
  "reach",
  "references",
  "offers",
  "offerDays",
  "vendor",
  "underemployment",
];

export const TARGETS = {
  completion: 85,
  reach: 60,
  references: 100,
  offers: 30,
  offerDays: 30,
  vendor: 50,
} as const;

export function percent(numerator: number, denominator: number): number {
  if (denominator === 0) return 0;
  return Math.round((numerator / denominator) * 1000) / 10;
}

export function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : Math.round((sorted[mid - 1] + sorted[mid]) / 2);
}

function rate(
  key: MetricKey,
  numerator: number,
  denominator: number,
  target: number,
  inProgress: boolean,
): MetricResult {
  if (inProgress) return { key, status: "in_progress", value: null, numerator: null, denominator: null, unit: "percent" };
  if (denominator === 0)
    return { key, status: "not_measured", value: null, numerator: 0, denominator: 0, unit: "percent" };
  const value = percent(numerator, denominator);
  return {
    key,
    status: value >= target ? "on_target" : "below_target",
    value,
    numerator,
    denominator,
    unit: "percent",
  };
}

/** The five success metrics (Content Pack 13.5) for one cohort. */
export function computeMetrics(students: MetricStudent[], cohortCompleted: boolean): MetricResult[] {
  const participants = students.filter((s) => !s.peer);
  const enrolled = participants.filter((s) => s.status !== "proposed");
  const completers = enrolled.filter((s) => s.status === "completed");
  const inProgress = !cohortCompleted;

  const consented = enrolled.filter((s) => s.demographicConsent);
  const reached = consented.filter((s) => s.firstGen || s.pell).length;
  const reach: MetricResult =
    consented.length < MIN_GROUP
      ? { key: "reach", status: "fewer_than_5", value: null, numerator: null, denominator: consented.length, unit: "percent" }
      : rate("reach", reached, consented.length, TARGETS.reach, false);

  const offerDays = completers.map((s) => s.offerDays).filter((d): d is number => d !== null);
  const medianDays = median(offerDays);
  const offerDaysMetric: MetricResult = inProgress
    ? { key: "offerDays", status: "in_progress", value: null, numerator: null, denominator: null, unit: "days" }
    : medianDays === null
      ? { key: "offerDays", status: "not_measured", value: null, numerator: 0, denominator: 0, unit: "days" }
      : {
          key: "offerDays",
          status: medianDays <= TARGETS.offerDays ? "on_target" : "below_target",
          value: medianDays,
          numerator: null,
          denominator: offerDays.length,
          unit: "days",
        };

  const notHired = completers.filter((s) => !s.hiredByCity);

  const surveyed = completers.filter((s) => s.underemployed12 !== null);
  const peers = students.filter((s) => s.peer && s.underemployed12 !== null);
  let underemployment: MetricResult = {
    key: "underemployment",
    status: "not_measured",
    value: null,
    numerator: null,
    denominator: null,
    unit: "comparison",
  };
  if (surveyed.length > 0 && peers.length > 0) {
    const completerRate = percent(surveyed.filter((s) => s.underemployed12).length, surveyed.length);
    const peerRate = percent(peers.filter((s) => s.underemployed12).length, peers.length);
    underemployment = {
      key: "underemployment",
      status: completerRate < peerRate ? "on_target" : "below_target",
      value: completerRate,
      numerator: peerRate,
      denominator: surveyed.length,
      unit: "comparison",
    };
  }

  return [
    rate("completion", completers.length, enrolled.length, TARGETS.completion, inProgress),
    reach,
    rate("references", completers.filter((s) => s.confirmedRefs >= 3).length, completers.length, TARGETS.references, inProgress),
    rate("offers", completers.filter((s) => s.offerDays !== null).length, completers.length, TARGETS.offers, inProgress),
    offerDaysMetric,
    rate("vendor", notHired.filter((s) => s.vendorInterview).length, notHired.length, TARGETS.vendor, inProgress),
    underemployment,
  ];
}

export type BudgetInput = {
  students: number;
  weeks: number;
  hours: number;
  rateDollars: number;
  coordinator: number;
  platform: number;
};

export const BUDGET_DEFAULTS: BudgetInput = {
  students: 30,
  weeks: 15,
  hours: 11,
  rateDollars: 17,
  coordinator: 45_000,
  platform: 6_000,
};

export function pilotBudget(input: BudgetInput) {
  const perStudent = input.weeks * input.hours * input.rateDollars;
  const wages = perStudent * input.students;
  return { perStudent, wages, total: wages + input.coordinator + input.platform };
}
