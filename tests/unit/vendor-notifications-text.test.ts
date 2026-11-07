import { describe, expect, it } from "vitest";
import { notificationText, safeHref } from "@/server/notifications-text";

describe("notification text", () => {
  it("renders each type from the messages with payload params", () => {
    expect(notificationText("en", "vendorRequest", { vendor: "Brightline Engineering", href: "/s/openings" })).toBe(
      "Brightline Engineering would like to interview you.",
    );
    expect(notificationText("en", "ratingDue", { firstName: "Amara", week: 6 })).toBe("Amara's week 6 rating is due Friday.");
    expect(notificationText("es", "hoursReminder", { week: 6 })).toBe("Registra tus horas de la semana 6.");
  });

  it("skips unknown types", () => {
    expect(notificationText("en", "nope", {})).toBeNull();
  });

  it("only follows same-site paths", () => {
    expect(safeHref("/s/openings")).toBe("/s/openings");
    expect(safeHref("https://example.com")).toBe("/notifications");
    expect(safeHref("//example.com")).toBe("/notifications");
    expect(safeHref(undefined)).toBe("/notifications");
  });
});
