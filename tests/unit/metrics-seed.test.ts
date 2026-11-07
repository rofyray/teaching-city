import { beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const TEST_URL = process.env.TEST_DATABASE_URL ?? "postgres://postgres@localhost:5433/teaching_city_test";
process.env.DATABASE_URL = TEST_URL;

type Metrics = Awaited<ReturnType<typeof import("@/server/queries/metrics").cohortMetrics>>["metrics"];
let spring: Metrics;
let fall: Metrics;
let springWsu: Metrics;

beforeAll(async () => {
  const { drizzle } = await import("drizzle-orm/node-postgres");
  const { migrate } = await import("drizzle-orm/node-postgres/migrator");
  const { Pool } = await import("pg");
  const pool = new Pool({ connectionString: TEST_URL });
  await migrate(drizzle({ client: pool }), { migrationsFolder: "./drizzle" });
  await pool.end();

  const { db } = await import("@/server/db");
  const { seed } = await import("@/server/seed");
  await seed(db);
  const { cohortMetrics } = await import("@/server/queries/metrics");
  spring = (await cohortMetrics("Spring 2026")).metrics;
  fall = (await cohortMetrics("Fall 2026")).metrics;
  springWsu = (await cohortMetrics("Spring 2026", "org_wsu")).metrics;
});

const get = (m: Metrics, key: string) => m.find((x) => x.key === key)!;

describe("success metrics on a fresh seed (Content Pack 13.4.11)", () => {
  it("Spring 2026 matches the expected values", () => {
    expect(get(spring, "completion")).toMatchObject({ value: 90, numerator: 18, denominator: 20, status: "on_target" });
    expect(get(spring, "reach")).toMatchObject({ value: 65, numerator: 13, denominator: 20, status: "on_target" });
    expect(get(spring, "references")).toMatchObject({ value: 100, numerator: 18, denominator: 18, status: "on_target" });
    expect(get(spring, "offers")).toMatchObject({ value: 38.9, numerator: 7, denominator: 18, status: "on_target" });
    expect(get(spring, "offerDays")).toMatchObject({ value: 24, status: "on_target" });
    expect(get(spring, "vendor")).toMatchObject({ value: 58.3, numerator: 7, denominator: 12, status: "on_target" });
    expect(get(spring, "underemployment").status).toBe("not_measured");
  });

  it("Fall 2026 shows reach and in-progress metrics", () => {
    expect(get(fall, "reach")).toMatchObject({ value: 63.3, numerator: 19, denominator: 30 });
    for (const key of ["completion", "references", "offers", "offerDays", "vendor"]) {
      expect(get(fall, key).status).toBe("in_progress");
    }
    expect(get(fall, "underemployment").status).toBe("not_measured");
  });

  it("filters to one college", () => {
    const completion = get(springWsu, "completion");
    expect(completion.denominator).toBeLessThan(20);
    expect(completion.denominator).toBeGreaterThan(0);
  });
});
