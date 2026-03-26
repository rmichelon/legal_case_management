import { router, protectedProcedure } from './_core/trpc';
import { z } from 'zod';
import { getMonitoringService } from './monitoringService';
import { getDb } from './db';
import { syncMetrics, integrationAlerts, tribunalHealthCheck, performanceReport } from '../drizzle/schema';
import { eq } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';

export const monitoringRouter = router({
  /**
   * Get health status for all tribunals
   */
  getHealthStatus: protectedProcedure.query(async () => {
    const monitoringService = getMonitoringService();
    return monitoringService.getHealthStatus();
  }),

  /**
   * Get health status for a specific tribunal
   */
  getTribunalHealth: protectedProcedure
    .input(z.object({
      tribunal: z.enum(['tjsp', 'tjmg', 'tjms']),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;

      const health = await db
        .select()
        .from(tribunalHealthCheck)
        .where(eq(tribunalHealthCheck.tribunal, input.tribunal))
        .limit(1);

      return health.length > 0 ? health[0] : null;
    }),

  /**
   * Get sync metrics for a case
   */
  getSyncMetrics: protectedProcedure
    .input(z.object({
      caseId: z.number(),
      limit: z.number().default(50),
    }))
    .query(async ({ input }) => {
      const monitoringService = getMonitoringService();
      return monitoringService.getSyncMetrics(input.caseId, input.limit);
    }),

  /**
   * Get active alerts
   */
  getActiveAlerts: protectedProcedure
    .input(z.object({
      tribunal: z.enum(['tjsp', 'tjmg', 'tjms']).optional(),
    }))
    .query(async ({ input }) => {
      const monitoringService = getMonitoringService();
      return monitoringService.getActiveAlerts(input.tribunal);
    }),

  /**
   * Acknowledge an alert
   */
  acknowledgeAlert: protectedProcedure
    .input(z.object({
      alertId: z.number(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');

      await db
        .update(integrationAlerts)
        .set({
          acknowledged: true,
          acknowledgedBy: ctx.user.id,
          acknowledgedAt: new Date(),
        })
        .where(eq(integrationAlerts.id, input.alertId));

      return { success: true };
    }),

  /**
   * Resolve an alert
   */
  resolveAlert: protectedProcedure
    .input(z.object({
      alertId: z.number(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');

      await db
        .update(integrationAlerts)
        .set({
          resolvedAt: new Date(),
        })
        .where(eq(integrationAlerts.id, input.alertId));

      return { success: true };
    }),

  /**
   * Get performance report for a tribunal
   */
  getPerformanceReport: protectedProcedure
    .input(z.object({
      tribunal: z.enum(['tjsp', 'tjmg', 'tjms']),
      period: z.enum(['daily', 'weekly', 'monthly']),
    }))
    .query(async ({ input }) => {
      const monitoringService = getMonitoringService();
      return monitoringService.getPerformanceReport(input.tribunal, input.period);
    }),

  /**
   * Get all performance reports
   */
  getAllPerformanceReports: protectedProcedure
    .input(z.object({
      tribunal: z.enum(['tjsp', 'tjmg', 'tjms']).optional(),
      period: z.enum(['daily', 'weekly', 'monthly']).optional(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      if (input.tribunal) {
        return db.select().from(performanceReport).where(eq(performanceReport.tribunal, input.tribunal));
      }

      return db.select().from(performanceReport);
    }),

  /**
   * Start health checks
   */
  startHealthChecks: protectedProcedure.mutation(async ({ ctx }) => {
    // Only admins can start health checks
    if (ctx.user.role !== 'admin') {
      throw new Error('Only admins can start health checks');
    }

    const monitoringService = getMonitoringService();
    await monitoringService.startHealthChecks();

    return { success: true, message: 'Health checks started' };
  }),

  /**
   * Stop health checks
   */
  stopHealthChecks: protectedProcedure.mutation(async ({ ctx }) => {
    // Only admins can stop health checks
    if (ctx.user.role !== 'admin') {
      throw new Error('Only admins can stop health checks');
    }

    const monitoringService = getMonitoringService();
    monitoringService.stopHealthChecks();

    return { success: true, message: 'Health checks stopped' };
  }),

  /**
   * Get monitoring dashboard data
   */
  getDashboardData: protectedProcedure.query(async () => {
    const monitoringService = getMonitoringService();
    const db = await getDb();
    if (!db) return null;

    const healthStatus = await monitoringService.getHealthStatus();
    const activeAlerts = await monitoringService.getActiveAlerts();

    // Get recent sync metrics
    const recentSyncs = await db.select().from(syncMetrics).limit(10);

    // Calculate summary statistics
    const totalSyncs = recentSyncs.length;
    const successfulSyncs = recentSyncs.filter((s) => s.status === 'success').length;
    const failedSyncs = recentSyncs.filter((s) => s.status === 'failed').length;
    const successRate = totalSyncs > 0 ? (successfulSyncs / totalSyncs) * 100 : 0;

    const avgResponseTime = recentSyncs
      .filter((s) => s.duration)
      .reduce((sum, s) => sum + (s.duration || 0), 0) / (recentSyncs.filter((s) => s.duration).length || 1);

    return {
      healthStatus,
      activeAlerts,
      recentSyncs,
      summary: {
        totalSyncs,
        successfulSyncs,
        failedSyncs,
        successRate: Math.round(successRate * 100) / 100,
        avgResponseTime: Math.round(avgResponseTime),
      },
    };
  }),
});
