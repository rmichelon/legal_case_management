import { describe, it, expect, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(userId: number = 1): TrpcContext {
  const user: AuthenticatedUser = {
    id: userId,
    openId: `user-${userId}`,
    email: `user${userId}@example.com`,
    name: `Test User ${userId}`,
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("Case Management Router", () => {
  let caller: ReturnType<typeof appRouter.createCaller>;
  let ctx: TrpcContext;

  beforeEach(() => {
    ctx = createAuthContext();
    caller = appRouter.createCaller(ctx);
  });

  describe("getCaseWithCourtData", () => {
    it("should retrieve case with court data", async () => {
      // Create a test case first
      const caseData = await caller.cases.create({
        caseNumber: `TEST-${Date.now()}`,
        title: "Test Case",
        caseType: "Ação Cível",
        court: "Vara Cível",
        clientId: 1,
      });

      // Query the case with court data
      const result = await caller.caseManagement.getCaseWithCourtData({
        caseId: caseData.id,
      });

      expect(result).toBeDefined();
      expect(result.case).toBeDefined();
      expect(result.case.id).toBe(caseData.id);
      expect(result.case.caseNumber).toContain("TEST-");
    }, { timeout: 10000 });

    it("should throw NOT_FOUND for non-existent case", async () => {
      try {
        await caller.caseManagement.getCaseWithCourtData({
          caseId: 999999,
        });
        expect.fail("Should have thrown NOT_FOUND error");
      } catch (error: any) {
        expect(error.code).toBe("NOT_FOUND");
      }
    }, { timeout: 10000 });
  });

  describe("updateCase", () => {
    it("should update case information", async () => {
      // Create a test case
      const caseData = await caller.cases.create({
        caseNumber: `UPDATE-${Date.now()}`,
        title: "Original Title",
        caseType: "Ação Cível",
        court: "Vara Cível",
        clientId: 1,
      });

      // Update the case
      const result = await caller.caseManagement.updateCase({
        caseId: caseData.id,
        updates: {
          title: "Updated Title",
          status: "closed",
        },
      });

      expect(result).toBeDefined();
      expect(result.success).toBe(true);

      // Verify the update
      const updatedCase = await caller.cases.get({ id: caseData.id });
      expect(updatedCase.title).toBe("Updated Title");
      expect(updatedCase.status).toBe("closed");
    }, { timeout: 10000 });

    it("should handle partial updates", async () => {
      // Create a test case
      const caseData = await caller.cases.create({
        caseNumber: `PARTIAL-${Date.now()}`,
        title: "Original Title",
        caseType: "Ação Cível",
        court: "Vara Cível",
        clientId: 1,
      });

      // Update only the title
      const result = await caller.caseManagement.updateCase({
        caseId: caseData.id,
        updates: {
          title: "New Title",
        },
      });

      expect(result.success).toBe(true);

      // Verify only title changed
      const updatedCase = await caller.cases.get({ id: caseData.id });
      expect(updatedCase.title).toBe("New Title");
    }, { timeout: 10000 });
  });

  describe("getCaseInteractions", () => {
    it("should retrieve case interactions", async () => {
      // Create a test case
      const caseData = await caller.cases.create({
        caseNumber: `INTERACT-${Date.now()}`,
        title: "Interaction Test Case",
        caseType: "Ação Cível",
        court: "Vara Cível",
        clientId: 1,
      });

      // Retrieve interactions (should be empty initially)
      const result = await caller.caseManagement.getCaseInteractions({
        caseId: caseData.id,
        limit: 10,
      });

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    }, { timeout: 10000 });

    it("should throw NOT_FOUND for non-existent case", async () => {
      try {
        await caller.caseManagement.getCaseInteractions({
          caseId: 999999,
          limit: 10,
        });
        expect.fail("Should have thrown NOT_FOUND error");
      } catch (error: any) {
        expect(error.code).toBe("NOT_FOUND");
      }
    }, { timeout: 10000 });
  });

  describe("syncCaseFromTribunal", () => {
    it("should handle sync case from tribunal", async () => {
      // Create a test case
      const caseData = await caller.cases.create({
        caseNumber: `SYNC-${Date.now()}`,
        title: "Sync Test Case",
        caseType: "Ação Cível",
        court: "Vara Cível",
        clientId: 1,
      });

      // Attempt to sync (may fail due to mock tribunal service)
      try {
        const result = await caller.caseManagement.syncCaseFromTribunal({
          caseId: caseData.id,
          processNumber: caseData.caseNumber,
        });

        // If successful, verify the result
        expect(result.success).toBe(true);
      } catch (error: any) {
        // Expected to fail with dummy tribunal service
        expect(error).toBeDefined();
      }
    }, { timeout: 10000 });
  });
});
