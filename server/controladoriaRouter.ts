import { router, protectedProcedure, adminProcedure } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { TRPCError } from "@trpc/server";

export const controladoriaRouter = router({
  // ============ CONTROLADORIA CRUD ============
  
  list: protectedProcedure.query(async ({ ctx }) => {
    return await db.getControladoriaByUserId(ctx.user.id);
  }),

  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const item = await db.getControladoriaById(input.id);
      if (!item) throw new TRPCError({ code: "NOT_FOUND" });
      return item;
    }),

  create: adminProcedure
    .input(z.object({
      name: z.string().min(1),
      description: z.string().optional(),
      status: z.enum(["active", "inactive", "archived"]).default("active"),
    }))
    .mutation(async ({ ctx, input }) => {
      return await db.createControladoria({
        userId: ctx.user.id,
        ...input,
      });
    }),

  update: adminProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().optional(),
      description: z.string().optional(),
      status: z.enum(["active", "inactive", "archived"]).optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      return await db.updateControladoria(id, data);
    }),

  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      return await db.deleteControladoria(input.id);
    }),

  // ============ DAILY REPORTS ============

  getDailyReports: protectedProcedure
    .input(z.object({ limit: z.number().default(30) }))
    .query(async ({ ctx, input }) => {
      return await db.getDailyReportsByUserId(ctx.user.id, input.limit);
    }),

  getDailyReportById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const report = await db.getDailyReportById(input.id);
      if (!report) throw new TRPCError({ code: "NOT_FOUND" });
      return report;
    }),

  getDailyReportByDate: protectedProcedure
    .input(z.object({ reportDate: z.date() }))
    .query(async ({ ctx, input }) => {
      return await db.getDailyReportByDate(ctx.user.id, input.reportDate);
    }),

  createDailyReport: adminProcedure
    .input(z.object({
      reportDate: z.date(),
      totalCases: z.number().default(0),
      activeCases: z.number().default(0),
      closedCases: z.number().default(0),
      overduePrazos: z.number().default(0),
      upcomingPrazos: z.number().default(0),
      totalDeadlines: z.number().default(0),
      completedDeadlines: z.number().default(0),
      totalLawyers: z.number().default(0),
      activeLawyers: z.number().default(0),
      totalClients: z.number().default(0),
      newCases: z.number().default(0),
      closedCasesToday: z.number().default(0),
      totalDocuments: z.number().default(0),
      newDocuments: z.number().default(0),
      successRate: z.string().default("0.00"),
      averageResolutionTime: z.number().default(0),
      totalRevenue: z.string().default("0.00"),
      reportContent: z.any().optional(),
      sentAt: z.date().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return await db.createDailyReport({
        userId: ctx.user.id,
        ...input,
      });
    }),

  updateDailyReport: adminProcedure
    .input(z.object({
      id: z.number(),
      reportDate: z.date().optional(),
      totalCases: z.number().optional(),
      activeCases: z.number().optional(),
      closedCases: z.number().optional(),
      overduePrazos: z.number().optional(),
      upcomingPrazos: z.number().optional(),
      totalDeadlines: z.number().optional(),
      completedDeadlines: z.number().optional(),
      totalLawyers: z.number().optional(),
      activeLawyers: z.number().optional(),
      totalClients: z.number().optional(),
      newCases: z.number().optional(),
      closedCasesToday: z.number().optional(),
      totalDocuments: z.number().optional(),
      newDocuments: z.number().optional(),
      successRate: z.string().optional(),
      averageResolutionTime: z.number().optional(),
      totalRevenue: z.string().optional(),
      reportContent: z.any().optional(),
      sentAt: z.date().optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      return await db.updateDailyReport(id, data);
    }),

  // ============ ALERT PREFERENCES ============

  getAlertPreferences: protectedProcedure.query(async ({ ctx }) => {
    return await db.getAlertPreferencesByUserId(ctx.user.id);
  }),

  getAlertPreferenceByType: protectedProcedure
    .input(z.object({ alertType: z.string() }))
    .query(async ({ ctx, input }) => {
      return await db.getAlertPreferenceByUserAndType(ctx.user.id, input.alertType);
    }),

  createAlertPreference: protectedProcedure
    .input(z.object({
      alertType: z.enum(["email", "sms", "push", "in_app"]),
      enabled: z.boolean().default(true),
      frequency: z.enum(["immediate", "hourly", "daily", "weekly"]).default("daily"),
      channels: z.any().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return await db.createAlertPreference({
        userId: ctx.user.id,
        ...input,
      });
    }),

  updateAlertPreference: protectedProcedure
    .input(z.object({
      id: z.number(),
      enabled: z.boolean().optional(),
      frequency: z.enum(["immediate", "hourly", "daily", "weekly"]).optional(),
      channels: z.any().optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      return await db.updateAlertPreference(id, data);
    }),

  // ============ ALERT HISTORY ============

  getAlertHistory: protectedProcedure
    .input(z.object({ limit: z.number().default(50) }))
    .query(async ({ ctx, input }) => {
      return await db.getAlertHistoryByUserId(ctx.user.id, input.limit);
    }),

  createAlertHistory: protectedProcedure
    .input(z.object({
      alertType: z.enum(["deadline", "case_update", "document", "performance", "daily_report"]),
      channel: z.enum(["email", "sms", "push", "in_app"]),
      title: z.string(),
      message: z.string().optional(),
      relatedCaseId: z.number().optional(),
      relatedDeadlineId: z.number().optional(),
      status: z.enum(["sent", "failed", "pending"]).default("pending"),
      sentAt: z.date().optional(),
      failureReason: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return await db.createAlertHistory({
        userId: ctx.user.id,
        ...input,
      });
    }),

  updateAlertHistory: protectedProcedure
    .input(z.object({
      id: z.number(),
      status: z.enum(["sent", "failed", "pending"]).optional(),
      sentAt: z.date().optional(),
      readAt: z.date().optional(),
      failureReason: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      return await db.updateAlertHistory(id, data);
    }),

  // ============ PERFORMANCE METRICS ============

  getPerformanceMetrics: protectedProcedure
    .input(z.object({ limit: z.number().default(30) }))
    .query(async ({ ctx, input }) => {
      return await db.getPerformanceMetricsByUserId(ctx.user.id, input.limit);
    }),

  getPerformanceMetricsByLawyer: protectedProcedure
    .input(z.object({ lawyerId: z.number(), limit: z.number().default(30) }))
    .query(async ({ input }) => {
      return await db.getPerformanceMetricsByLawyerId(input.lawyerId, input.limit);
    }),

  createPerformanceMetric: adminProcedure
    .input(z.object({
      lawyerId: z.number().optional(),
      metricsDate: z.date(),
      casesHandled: z.number().default(0),
      casesClosed: z.number().default(0),
      successRate: z.string().default("0.00"),
      averageResolutionDays: z.number().default(0),
      deadlinesMissed: z.number().default(0),
      clientSatisfaction: z.string().default("0.0"),
      billableHours: z.string().default("0.00"),
      revenue: z.string().default("0.00"),
      casesByType: z.any().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return await db.createPerformanceMetric({
        userId: ctx.user.id,
        ...input,
      });
    }),

  updatePerformanceMetric: adminProcedure
    .input(z.object({
      id: z.number(),
      casesHandled: z.number().optional(),
      casesClosed: z.number().optional(),
      successRate: z.string().optional(),
      averageResolutionDays: z.number().optional(),
      deadlinesMissed: z.number().optional(),
      clientSatisfaction: z.string().optional(),
      billableHours: z.string().optional(),
      revenue: z.string().optional(),
      casesByType: z.any().optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      return await db.updatePerformanceMetric(id, data);
    }),

  // ============ SCHEDULED REPORTS ============

  getScheduledReports: protectedProcedure.query(async ({ ctx }) => {
    return await db.getScheduledReportsByUserId(ctx.user.id);
  }),

  getScheduledReportById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const report = await db.getScheduledReportById(input.id);
      if (!report) throw new TRPCError({ code: "NOT_FOUND" });
      return report;
    }),

  createScheduledReport: adminProcedure
    .input(z.object({
      reportType: z.enum(["daily", "weekly", "monthly", "custom"]),
      name: z.string(),
      description: z.string().optional(),
      schedule: z.string(), // Cron expression
      recipients: z.array(z.string()).optional(),
      includeMetrics: z.array(z.string()).optional(),
      format: z.enum(["pdf", "email", "both"]).default("email"),
      enabled: z.boolean().default(true),
    }))
    .mutation(async ({ ctx, input }) => {
      return await db.createScheduledReport({
        userId: ctx.user.id,
        ...input,
      });
    }),

  updateScheduledReport: adminProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().optional(),
      description: z.string().optional(),
      schedule: z.string().optional(),
      recipients: z.array(z.string()).optional(),
      includeMetrics: z.array(z.string()).optional(),
      format: z.enum(["pdf", "email", "both"]).optional(),
      enabled: z.boolean().optional(),
      lastRunAt: z.date().optional(),
      nextRunAt: z.date().optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      return await db.updateScheduledReport(id, data);
    }),

  deleteScheduledReport: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      return await db.deleteScheduledReport(input.id);
    }),

  // ============ CONTROLADORIA ACCESS ============

  getAccessControl: protectedProcedure.query(async ({ ctx }) => {
    return await db.getControladoriaAccessByUserId(ctx.user.id);
  }),

  getAccessControlByRole: protectedProcedure
    .input(z.object({ role: z.string() }))
    .query(async ({ ctx, input }) => {
      return await db.getControladoriaAccessByUserAndRole(ctx.user.id, input.role);
    }),

  createAccessControl: adminProcedure
    .input(z.object({
      userId: z.number(),
      role: z.enum(["admin", "lawyer", "partner", "manager"]),
      canViewAllCases: z.boolean().default(false),
      canViewAllDeadlines: z.boolean().default(false),
      canViewReports: z.boolean().default(false),
      canManageAlerts: z.boolean().default(false),
      canGenerateReports: z.boolean().default(false),
      canManageUsers: z.boolean().default(false),
      canViewPerformanceMetrics: z.boolean().default(false),
      expiresAt: z.date().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return await db.createControladoriaAccess({
        grantedBy: ctx.user.id,
        ...input,
      });
    }),

  updateAccessControl: adminProcedure
    .input(z.object({
      id: z.number(),
      canViewAllCases: z.boolean().optional(),
      canViewAllDeadlines: z.boolean().optional(),
      canViewReports: z.boolean().optional(),
      canManageAlerts: z.boolean().optional(),
      canGenerateReports: z.boolean().optional(),
      canManageUsers: z.boolean().optional(),
      canViewPerformanceMetrics: z.boolean().optional(),
      expiresAt: z.date().optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      return await db.updateControladoriaAccess(id, data);
    }),

  deleteAccessControl: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      return await db.deleteControladoriaAccess(input.id);
    }),
});
