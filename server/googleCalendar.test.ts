import { describe, expect, it, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "sample-user",
    email: "sample@example.com",
    name: "Sample User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };

  return { ctx };
}

describe("googleCalendar router", () => {
  it("should get auth URL", async () => {
    const caller = appRouter.createCaller({} as any);
    const result = await caller.googleCalendar.getAuthUrl();

    expect(result).toHaveProperty("authUrl");
    expect(typeof result.authUrl).toBe("string");
    expect(result.authUrl.length).toBeGreaterThan(0);
  });

  it("should get integration status (null when not connected)", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.googleCalendar.getIntegration();
    expect(result).toBeNull();
  });

  it("should update integration preferences", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.googleCalendar.updateIntegration({
      syncDeadlines: false,
      syncMovements: true,
    });

    expect(result).toEqual({ success: true });
  });

  it("should handle disconnect calendar", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.googleCalendar.disconnectCalendar();
    expect(result).toEqual({ success: true });
  });

  it("should get case events (empty when no integration)", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.googleCalendar.getCaseEvents({ caseId: 1 });
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(0);
  });

  it("should get upcoming events (empty when no integration)", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.googleCalendar.getUpcomingEvents();
    expect(Array.isArray(result)).toBe(true);
  });
});
