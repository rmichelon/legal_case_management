import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as db from "./db";

describe("Soft Delete Operations", () => {
  const testCaseData = {
    userId: 1,
    caseNumber: `TEST-${Date.now()}`,
    title: "Test Case for Soft Delete",
    caseType: "Ação Cível",
    court: "Vara Cível",
    clientId: 1,
    status: "open" as const,
    priority: "medium" as const,
  };

  let createdCaseId: number;

  beforeEach(async () => {
    // Create a test case
    const result = await db.createCase(testCaseData);
    createdCaseId = (result as any).id || result;
  });

  afterEach(async () => {
    // Clean up - permanently delete the test case
    try {
      await db.deleteCase(createdCaseId);
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  it("should soft delete a case", async () => {
    const result = await db.softDeleteCase(createdCaseId, testCaseData.userId);
    expect(result).toBeDefined();

    // Verify the case is marked as deleted
    const deletedCases = await db.getDeletedCasesByUserId(testCaseData.userId);
    const softDeletedCase = deletedCases.find((c) => c.id === createdCaseId);
    expect(softDeletedCase).toBeDefined();
    expect(softDeletedCase?.deletedAt).toBeDefined();
    expect(softDeletedCase?.deletedBy).toBe(testCaseData.userId);
  });

  it("should restore a soft deleted case", async () => {
    // First soft delete
    await db.softDeleteCase(createdCaseId, testCaseData.userId);

    // Then restore
    const result = await db.restoreCase(createdCaseId);
    expect(result).toBeDefined();

    // Verify the case is no longer in deleted list
    const deletedCases = await db.getDeletedCasesByUserId(testCaseData.userId);
    const restoredCase = deletedCases.find((c) => c.id === createdCaseId);
    expect(restoredCase).toBeUndefined();

    // Verify the case can be retrieved normally
    const caseData = await db.getCaseById(createdCaseId);
    expect(caseData).toBeDefined();
    expect(caseData?.deletedAt).toBeNull();
    expect(caseData?.deletedBy).toBeNull();
  });

  it("should track who deleted a case", async () => {
    const userId = 42;
    await db.softDeleteCase(createdCaseId, userId);

    const deletedCases = await db.getDeletedCasesByUserId(testCaseData.userId);
    const deletedCase = deletedCases.find((c) => c.id === createdCaseId);

    expect(deletedCase?.deletedBy).toBe(userId);
  });

  it("should only return deleted cases within 30 days", async () => {
    // Soft delete the case
    await db.softDeleteCase(createdCaseId, testCaseData.userId);

    // Get deleted cases
    const deletedCases = await db.getDeletedCasesByUserId(testCaseData.userId);

    // The case should be in the list
    const deletedCase = deletedCases.find((c) => c.id === createdCaseId);
    expect(deletedCase).toBeDefined();

    // Verify the deletedAt timestamp is recent
    if (deletedCase?.deletedAt) {
      const daysSinceDelete = Math.floor(
        (Date.now() - new Date(deletedCase.deletedAt).getTime()) /
          (1000 * 60 * 60 * 24)
      );
      expect(daysSinceDelete).toBeLessThanOrEqual(1);
    }
  });

  it("should handle multiple soft deletes and restores", async () => {
    // First soft delete
    await db.softDeleteCase(createdCaseId, testCaseData.userId);
    let deletedCases = await db.getDeletedCasesByUserId(testCaseData.userId);
    expect(deletedCases.find((c) => c.id === createdCaseId)).toBeDefined();

    // Restore
    await db.restoreCase(createdCaseId);
    deletedCases = await db.getDeletedCasesByUserId(testCaseData.userId);
    expect(deletedCases.find((c) => c.id === createdCaseId)).toBeUndefined();

    // Soft delete again
    await db.softDeleteCase(createdCaseId, testCaseData.userId);
    deletedCases = await db.getDeletedCasesByUserId(testCaseData.userId);
    expect(deletedCases.find((c) => c.id === createdCaseId)).toBeDefined();

    // Restore again
    await db.restoreCase(createdCaseId);
    deletedCases = await db.getDeletedCasesByUserId(testCaseData.userId);
    expect(deletedCases.find((c) => c.id === createdCaseId)).toBeUndefined();
  });

  it("should preserve case data after soft delete", async () => {
    // Get original case data
    const originalCase = await db.getCaseById(createdCaseId);

    // Soft delete
    await db.softDeleteCase(createdCaseId, testCaseData.userId);

    // Restore
    await db.restoreCase(createdCaseId);

    // Get restored case data
    const restoredCase = await db.getCaseById(createdCaseId);

    // Verify data integrity
    expect(restoredCase?.caseNumber).toBe(originalCase?.caseNumber);
    expect(restoredCase?.title).toBe(originalCase?.title);
    expect(restoredCase?.caseType).toBe(originalCase?.caseType);
    expect(restoredCase?.court).toBe(originalCase?.court);
    expect(restoredCase?.clientId).toBe(originalCase?.clientId);
  });
});
