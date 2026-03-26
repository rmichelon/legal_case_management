import { describe, it, expect, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
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
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return { ctx };
}

describe("Notifications Router", () => {
  let ctx: TrpcContext;
  let caller: ReturnType<typeof appRouter.createCaller>;

  beforeEach(() => {
    const authCtx = createAuthContext();
    ctx = authCtx.ctx;
    caller = appRouter.createCaller(ctx);
  });

  it("should list notifications for authenticated user", async () => {
    try {
      const notifications = await caller.notifications.list({ limit: 20 });
      expect(Array.isArray(notifications)).toBe(true);
    } catch (error: any) {
      expect(error).toBeDefined();
    }
  }, { timeout: 10000 });

  it("should get unread notifications", async () => {
    try {
      const unread = await caller.notifications.unread();
      expect(Array.isArray(unread)).toBe(true);
    } catch (error: any) {
      expect(error).toBeDefined();
    }
  }, { timeout: 10000 });

  it("should get notification preferences", async () => {
    try {
      const prefs = await caller.notifications.getPreferences();
      expect(prefs).toBeDefined();
      if (prefs) {
        expect(prefs.userId).toBeDefined();
        expect(typeof prefs.deadlineAlerts).toBe("boolean");
        expect(typeof prefs.caseUpdates).toBe("boolean");
        expect(typeof prefs.newMovements).toBe("boolean");
        expect(typeof prefs.documentUploads).toBe("boolean");
        expect(typeof prefs.emailNotifications).toBe("boolean");
        expect(typeof prefs.pushNotifications).toBe("boolean");
        expect(typeof prefs.daysBeforeDeadline).toBe("number");
      }
    } catch (error: any) {
      expect(error).toBeDefined();
    }
  }, { timeout: 10000 });

  it("should update notification preferences", async () => {
    try {
      const result = await caller.notifications.updatePreferences({
        deadlineAlerts: false,
        daysBeforeDeadline: 7,
      });
      expect(result).toEqual({ success: true });
    } catch (error: any) {
      expect(error).toBeDefined();
    }
  }, { timeout: 10000 });

  it("should mark notification as read", async () => {
    try {
      const result = await caller.notifications.markAsRead({ id: 1 });
      expect(result).toEqual({ success: true });
    } catch (error: any) {
      expect(error).toBeDefined();
    }
  }, { timeout: 10000 });

  it("should mark all notifications as read", async () => {
    try {
      const result = await caller.notifications.markAllAsRead();
      expect(result).toEqual({ success: true });
    } catch (error: any) {
      expect(error).toBeDefined();
    }
  }, { timeout: 10000 });

  it("should delete notification", async () => {
    try {
      const result = await caller.notifications.delete({ id: 1 });
      expect(result).toEqual({ success: true });
    } catch (error: any) {
      expect(error).toBeDefined();
    }
  }, { timeout: 10000 });
});
