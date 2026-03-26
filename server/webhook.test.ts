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

describe("webhook router", () => {
  it("should get conflicts", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.webhook.getConflicts();
    expect(Array.isArray(result)).toBe(true);
  });

  it("should throw error when getting sync history for non-existent integration", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    try {
      await caller.webhook.getSyncHistory({
        integrationId: 99999,
        limit: 50,
      });
      expect.fail("Should have thrown error");
    } catch (error: any) {
      expect(error.code).toBe("FORBIDDEN");
    }
  });

  it("should throw error when getting sync stats for non-existent integration", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    try {
      await caller.webhook.getSyncStats({
        integrationId: 99999,
      });
      expect.fail("Should have thrown error");
    } catch (error: any) {
      expect(error.code).toBe("FORBIDDEN");
    }
  });
});
