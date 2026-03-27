import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import * as db from "./db";
import { TRPCError } from "@trpc/server";

export const lawyerRouter = router({
  /**
   * List all lawyers for the current firm
   */
  list: protectedProcedure
    .query(async ({ ctx }) => {
      return await db.getLawyersByUserId(ctx.user.id);
    }),

  /**
   * Get lawyer by ID
   */
  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const lawyer = await db.getLawyerById(input.id);
      if (!lawyer) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Advogado não encontrado",
        });
      }
      return lawyer;
    }),

  /**
   * Create a new lawyer
   */
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        email: z.string().email(),
        phone: z.string().optional(),
        oabNumber: z.string().optional(),
        oabState: z.string().optional(),
        specialties: z.array(z.string()).optional(),
        bio: z.string().optional(),
        yearsOfExperience: z.number().optional(),
        hourlyRate: z.number().optional(),
        officeLocation: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check if OAB number already exists
      if (input.oabNumber) {
        const existing = await db.getLawyerByOabNumber(input.oabNumber);
        if (existing) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "Número OAB já cadastrado",
          });
        }
      }

      return await db.createLawyer({
        userId: ctx.user.id,
        name: input.name,
        email: input.email,
        phone: input.phone,
        oabNumber: input.oabNumber,
        oabState: input.oabState,
        specialties: input.specialties ? JSON.stringify(input.specialties) : null,
        bio: input.bio,
        yearsOfExperience: input.yearsOfExperience,
        hourlyRate: input.hourlyRate ? (input.hourlyRate as any) : null,
        officeLocation: input.officeLocation,
      });
    }),

  /**
   * Update lawyer information
   */
  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().optional(),
        email: z.string().email().optional(),
        phone: z.string().optional(),
        specialties: z.array(z.string()).optional(),
        bio: z.string().optional(),
        status: z.enum(["active", "inactive", "on_leave", "retired"]).optional(),
        yearsOfExperience: z.number().optional(),
        hourlyRate: z.number().optional(),
        officeLocation: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const lawyer = await db.getLawyerById(input.id);
      if (!lawyer) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Advogado não encontrado",
        });
      }

      const updateData: any = {};
      if (input.name) updateData.name = input.name;
      if (input.email) updateData.email = input.email;
      if (input.phone) updateData.phone = input.phone;
      if (input.specialties) updateData.specialties = JSON.stringify(input.specialties);
      if (input.bio) updateData.bio = input.bio;
      if (input.status) updateData.status = input.status;
      if (input.yearsOfExperience !== undefined) updateData.yearsOfExperience = input.yearsOfExperience;
      if (input.hourlyRate !== undefined) updateData.hourlyRate = input.hourlyRate;
      if (input.officeLocation) updateData.officeLocation = input.officeLocation;

      await db.updateLawyer(input.id, updateData);
      return await db.getLawyerById(input.id);
    }),

  /**
   * Delete lawyer
   */
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const lawyer = await db.getLawyerById(input.id);
      if (!lawyer) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Advogado não encontrado",
        });
      }

      await db.deleteLawyer(input.id);
      return { success: true };
    }),

  /**
   * Search lawyers by name
   */
  search: protectedProcedure
    .input(z.object({ query: z.string() }))
    .query(async ({ ctx, input }) => {
      return await db.searchLawyers(ctx.user.id, input.query);
    }),

  /**
   * Get lawyer with all related data
   */
  getWithDetails: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const lawyer = await db.getLawyerById(input.id);
      if (!lawyer) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Advogado não encontrado",
        });
      }

      const [assignments, availability, performance, skills, workload, permissions] = await Promise.all([
        db.getCaseAssignmentsByLawyerId(input.id),
        db.getLawyerAvailabilityByLawyerId(input.id),
        db.getLawyerPerformanceByLawyerId(input.id),
        db.getLawyerSkillsByLawyerId(input.id),
        db.getLawyerWorkloadByLawyerId(input.id),
        db.getLawyerPermissionsByLawyerId(input.id),
      ]);

      return {
        lawyer,
        assignments,
        availability,
        performance,
        skills,
        workload,
        permissions,
      };
    }),

  /**
   * Assign case to lawyer
   */
  assignCase: protectedProcedure
    .input(
      z.object({
        caseId: z.number(),
        lawyerId: z.number(),
        role: z.enum(["lead", "co_counsel", "junior", "consultant"]).default("lead"),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const lawyer = await db.getLawyerById(input.lawyerId);
      if (!lawyer) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Advogado não encontrado",
        });
      }

      return await db.createCaseAssignment({
        caseId: input.caseId,
        lawyerId: input.lawyerId,
        role: input.role,
        assignedBy: ctx.user.id,
        notes: input.notes,
      });
    }),

  /**
   * Unassign case from lawyer
   */
  unassignCase: protectedProcedure
    .input(z.object({ assignmentId: z.number() }))
    .mutation(async ({ input }) => {
      await db.updateCaseAssignment(input.assignmentId, {
        unassignedAt: new Date(),
      });
      return { success: true };
    }),

  /**
   * Add skill to lawyer
   */
  addSkill: protectedProcedure
    .input(
      z.object({
        lawyerId: z.number(),
        skillName: z.string(),
        proficiencyLevel: z.enum(["beginner", "intermediate", "advanced", "expert"]),
        certificationNumber: z.string().optional(),
        certificationDate: z.date().optional(),
        expiryDate: z.date().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const lawyer = await db.getLawyerById(input.lawyerId);
      if (!lawyer) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Advogado não encontrado",
        });
      }

      return await db.createLawyerSkill({
        lawyerId: input.lawyerId,
        skillName: input.skillName,
        proficiencyLevel: input.proficiencyLevel,
        certificationNumber: input.certificationNumber,
        certificationDate: input.certificationDate,
        expiryDate: input.expiryDate,
        notes: input.notes,
      });
    }),

  /**
   * Get lawyer performance metrics
   */
  getPerformance: protectedProcedure
    .input(z.object({ lawyerId: z.number(), period: z.string().optional() }))
    .query(async ({ input }) => {
      return await db.getLawyerPerformanceByLawyerId(input.lawyerId, input.period);
    }),

  /**
   * Update lawyer workload
   */
  updateWorkload: protectedProcedure
    .input(
      z.object({
        lawyerId: z.number(),
        scheduledHours: z.number().optional(),
        actualHours: z.number().optional(),
        activeCaseCount: z.number().optional(),
        deadlineCount: z.number().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const lawyer = await db.getLawyerById(input.lawyerId);
      if (!lawyer) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Advogado não encontrado",
        });
      }

      // Calculate overload percentage
      const scheduledHours = input.scheduledHours || 40; // Default 40 hours per week
      const actualHours = input.actualHours || 0;
      const overloadPercentage = ((actualHours - scheduledHours) / scheduledHours) * 100;

      return await db.createLawyerWorkload({
        lawyerId: input.lawyerId,
        scheduledHours: scheduledHours as any,
        actualHours: actualHours as any,
        activeCaseCount: input.activeCaseCount || 0,
        deadlineCount: input.deadlineCount || 0,
        overloadPercentage: Math.max(0, overloadPercentage) as any,
      });
    }),

  /**
   * Grant permission to lawyer
   */
  grantPermission: protectedProcedure
    .input(
      z.object({
        lawyerId: z.number(),
        permission: z.string(),
        expiresAt: z.date().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const lawyer = await db.getLawyerById(input.lawyerId);
      if (!lawyer) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Advogado não encontrado",
        });
      }

      return await db.createLawyerPermission({
        lawyerId: input.lawyerId,
        permission: input.permission,
        grantedBy: ctx.user.id,
        expiresAt: input.expiresAt,
      });
    }),

  /**
   * Revoke permission from lawyer
   */
  revokePermission: protectedProcedure
    .input(z.object({ permissionId: z.number() }))
    .mutation(async ({ input }) => {
      await db.deleteLawyerPermission(input.permissionId);
      return { success: true };
    }),

  /**
   * Set lawyer availability
   */
  setAvailability: protectedProcedure
    .input(
      z.object({
        lawyerId: z.number(),
        dayOfWeek: z.number().min(0).max(6),
        startTime: z.string(), // HH:MM format
        endTime: z.string(), // HH:MM format
        isAvailable: z.boolean().default(true),
      })
    )
    .mutation(async ({ input }) => {
      const lawyer = await db.getLawyerById(input.lawyerId);
      if (!lawyer) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Advogado não encontrado",
        });
      }

      return await db.createLawyerAvailability({
        lawyerId: input.lawyerId,
        dayOfWeek: input.dayOfWeek,
        startTime: input.startTime,
        endTime: input.endTime,
        isAvailable: input.isAvailable,
      });
    }),
});
