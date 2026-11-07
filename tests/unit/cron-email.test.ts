import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const send = vi.fn(async () => ({ data: { id: "x" }, error: null }));
vi.mock("resend", () => ({
  Resend: class {
    emails = { send };
  },
}));

const select = vi.fn();
vi.mock("@/server/db", () => ({ db: { select } }));

const { emailEnabled, sendNotificationEmail } = await import("@/server/email");

describe("notification email (P13.3)", () => {
  const env = { ...process.env };
  beforeEach(() => {
    send.mockClear();
    select.mockClear();
  });
  afterEach(() => {
    process.env = { ...env };
  });

  it("never sends in demo mode, even with a Resend key", async () => {
    process.env.RESEND_API_KEY = "re_test";
    process.env.DEMO_MODE = "true";
    expect(emailEnabled()).toBe(false);
    await expect(sendNotificationEmail("u1", "ratingDue", { firstName: "Amara", week: 6 })).resolves.toEqual({ sent: false });
    expect(send).not.toHaveBeenCalled();
    expect(select).not.toHaveBeenCalled();
  });

  it("does not send without a Resend key", async () => {
    delete process.env.RESEND_API_KEY;
    process.env.DEMO_MODE = "false";
    await expect(sendNotificationEmail("u1", "ratingDue", { firstName: "Amara", week: 6 })).resolves.toEqual({ sent: false });
    expect(send).not.toHaveBeenCalled();
  });

  it("is enabled only with a key and demo mode off", () => {
    process.env.RESEND_API_KEY = "re_test";
    process.env.DEMO_MODE = "false";
    expect(emailEnabled()).toBe(true);
  });
});
