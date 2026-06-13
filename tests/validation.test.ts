import { describe, expect, it } from "vitest";
import {
  createTicketSchema,
  listTicketsQuerySchema,
  postMessageSchema,
  updateStatusSchema,
} from "@/lib/validation";

describe("validation schemas", () => {
  it("accepts valid ticket creation", () => {
    const result = createTicketSchema.safeParse({
      title: "Login issue",
      description: "I cannot log in since yesterday morning.",
    });
    expect(result.success).toBe(true);
  });

  it("rejects short ticket titles", () => {
    const result = createTicketSchema.safeParse({
      title: "Hi",
      description: "Some description here for testing.",
    });
    expect(result.success).toBe(false);
  });

  it("accepts valid messages", () => {
    const result = postMessageSchema.safeParse({ body: "Need help please" });
    expect(result.success).toBe(true);
  });

  it("rejects empty messages", () => {
    const result = postMessageSchema.safeParse({ body: "   " });
    expect(result.success).toBe(false);
  });

  it("accepts ticket status updates", () => {
    const result = updateStatusSchema.safeParse({ status: "RESOLVED" });
    expect(result.success).toBe(true);
  });

  it("parses list query defaults", () => {
    const result = listTicketsQuerySchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.limit).toBe(50);
    }
  });
});

describe("SLA helper", () => {
  it("computes minutes since timestamp", async () => {
    const { minutesSince } = await import("@/lib/api-helpers");
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
    expect(minutesSince(thirtyMinutesAgo)).toBeGreaterThanOrEqual(29);
    expect(minutesSince(null)).toBeNull();
  });
});
