import { describe, it, expect } from "vitest";
import * as db from "./db";

describe("Lawyer Management", () => {
  describe("Lawyer CRUD Operations", () => {
    it("should create a lawyer successfully", async () => {
      const lawyer = await db.createLawyer({
        userId: 1,
        name: `Dr. Test Lawyer ${Date.now()}`,
        email: `test${Date.now()}@example.com`,
        phone: "(11) 98765-4321",
        oabNumber: `OAB${Date.now()}`,
        oabState: "SP",
        specialties: JSON.stringify(["Civil Law"]),
        bio: "Test lawyer",
        yearsOfExperience: 5,
        hourlyRate: 150.0,
        officeLocation: "São Paulo, SP",
      });

      expect(lawyer).toBeDefined();
      expect(lawyer.id).toBeGreaterThan(0);
      expect(lawyer.name).toContain("Dr. Test Lawyer");
    });

    it("should list lawyers by user ID", async () => {
      const lawyers = await db.getLawyersByUserId(1);
      expect(Array.isArray(lawyers)).toBe(true);
    });

    it("should search lawyers by query", async () => {
      const results = await db.searchLawyers(1, "Test");
      expect(Array.isArray(results)).toBe(true);
    });
  });
});
