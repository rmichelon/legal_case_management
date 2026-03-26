import axios from 'axios';
import { getDb } from './db';
import {
  tribunalHealthCheck,
  syncMetrics,
  apiErrorLog,
  integrationAlerts,
  integrationConfig,
} from '../drizzle/schema';
import { eq, and, isNull } from 'drizzle-orm';

export type Tribunal = 'tjsp' | 'tjmg' | 'tjms';
export type HealthStatus = 'healthy' | 'degraded' | 'down';
export type AlertType = 'health_check_failed' | 'sync_failed' | 'rate_limit_exceeded' | 'auth_failed' | 'timeout' | 'high_error_rate';

export class MonitoringService {
  private healthCheckIntervals: Map<Tribunal, NodeJS.Timeout> = new Map();

  /**
   * Start health checks for all active tribunals
   */
  async startHealthChecks() {
    const db = await getDb();
    if (!db) return;

    const configs = await db.select().from(integrationConfig).where(eq(integrationConfig.enableHealthCheck, true));

    for (const config of configs) {
      const tribunal = config.tribunal as Tribunal;
      
      // Clear existing interval if any
      if (this.healthCheckIntervals.has(tribunal)) {
        clearInterval(this.healthCheckIntervals.get(tribunal)!);
      }

      // Start new health check interval
      const interval = setInterval(
        () => this.performHealthCheck(tribunal, config.id),
        (config.healthCheckInterval || 300) * 1000
      );

      this.healthCheckIntervals.set(tribunal, interval);
      
      // Perform initial check
      await this.performHealthCheck(tribunal, config.id);
    }
  }

  /**
   * Stop all health checks
   */
  stopHealthChecks() {
    this.healthCheckIntervals.forEach((interval) => {
      clearInterval(interval);
    });
    this.healthCheckIntervals.clear();
  }

  /**
   * Perform health check for a specific tribunal
   */
  async performHealthCheck(tribunal: Tribunal, configId: number) {
    const db = await getDb();
    if (!db) return;

    try {
      const config = await db.select().from(integrationConfig).where(eq(integrationConfig.id, configId)).limit(1);
      if (!config.length) return;

      const startTime = Date.now();
      let status: HealthStatus = 'healthy';
      let errorMessage: string | null = null;

      try {
        // Perform test request to tribunal API
        await axios.get(`${config[0].apiUrl}/health`, {
          timeout: 10000,
          headers: this.getHeaders(config[0]),
        });
      } catch (error: any) {
        status = 'down';
        errorMessage = error.message || 'Health check failed' || undefined;

        // Log API error
        await db.insert(apiErrorLog).values({
          tribunal,
          endpoint: `${config[0].apiUrl}/health`,
          method: 'GET',
        statusCode: error.response?.status,
        errorType: this.getErrorType(error),
        errorMessage: errorMessage || undefined,
        severity: 'high',
        });
      }

      const responseTime = Date.now() - startTime;

      // Update health check record
      const existingCheck = await db
        .select()
        .from(tribunalHealthCheck)
        .where(eq(tribunalHealthCheck.tribunal, tribunal))
        .limit(1);

      if (existingCheck.length) {
        const prevStatus = existingCheck[0].status;
        const failureCount = status === 'down' ? (existingCheck[0].failureCount || 0) + 1 : 0;
        const successCount = status === 'healthy' ? (existingCheck[0].successCount || 0) + 1 : 0;

        await db
          .update(tribunalHealthCheck)
          .set({
            status,
            responseTime,
            lastCheckAt: new Date(),
            lastSuccessAt: status === 'healthy' ? new Date() : existingCheck[0].lastSuccessAt,
            lastFailureAt: status === 'down' ? new Date() : existingCheck[0].lastFailureAt,
            failureCount,
            successCount,
            errorMessage: errorMessage === null ? undefined : errorMessage,
          })
          .where(eq(tribunalHealthCheck.tribunal, tribunal));

        // Create alert if status changed to down
        if (prevStatus !== 'down' && status === 'down') {
          await this.createAlert(tribunal, 'health_check_failed', 'critical', `${tribunal.toUpperCase()} API is down`, errorMessage || undefined);
        }

        // Create alert if status changed to healthy from down
        if (prevStatus === 'down' && status === 'healthy') {
          await this.resolveAlert(tribunal, 'health_check_failed');
        }
      } else {
      await db.insert(tribunalHealthCheck).values({
            tribunal,
            status,
            responseTime,
            lastCheckAt: new Date(),
            lastSuccessAt: status === 'healthy' ? new Date() : null,
            lastFailureAt: status === 'down' ? new Date() : null,
            failureCount: status === 'down' ? 1 : 0,
            successCount: status === 'healthy' ? 1 : 0,
            errorMessage: errorMessage || undefined,
          });
      }
    } catch (error) {
      console.error(`Health check error for ${tribunal}:`, error);
    }
  }

  /**
   * Record sync metrics
   */
  async recordSyncMetrics(
    caseId: number,
    userId: number,
    tribunal: Tribunal,
    syncType: 'full' | 'incremental' | 'manual',
    status: 'pending' | 'in_progress' | 'success' | 'failed',
    duration?: number,
    recordsProcessed?: number,
    recordsUpdated?: number,
    recordsCreated?: number,
    recordsFailed?: number,
    errorMessage?: string
  ) {
    const db = await getDb();
    if (!db) return;

    const startTime = new Date();

    await db.insert(syncMetrics).values({
      caseId,
      userId,
      tribunal,
      syncType,
      status,
      startTime,
      endTime: duration ? new Date(startTime.getTime() + duration) : undefined,
      duration,
      recordsProcessed: recordsProcessed || 0,
      recordsUpdated: recordsUpdated || 0,
      recordsCreated: recordsCreated || 0,
      recordsFailed: recordsFailed || 0,
        errorMessage: errorMessage || undefined,
      retryCount: 0,
    });

    // Create alert if sync failed
    if (status === 'failed') {
      await this.createAlert(
        tribunal,
        'sync_failed',
        'error',
        `Sync failed for case ${caseId}`,
        errorMessage
      );
    }
  }

  /**
   * Record API error
   */
  async recordApiError(
    tribunal: Tribunal,
    endpoint: string,
    method: string,
    statusCode?: number,
    errorType?: string,
    errorMessage?: string,
    userId?: number,
    caseId?: number,
    severity: 'low' | 'medium' | 'high' | 'critical' = 'medium'
  ) {
    const db = await getDb();
    if (!db) return;

    await db.insert(apiErrorLog).values({
      tribunal,
      endpoint,
      method,
      statusCode,
      errorType: errorType || 'UNKNOWN',
      errorMessage,
      userId,
      caseId,
      severity,
    });

    // Check if we should create an alert for high error rate
    const recentErrors = await db
      .select()
      .from(apiErrorLog)
      .where(
        and(
          eq(apiErrorLog.tribunal, tribunal),
          eq(apiErrorLog.severity, 'high'),
          // Last hour
        )
      );

    if (recentErrors.length > 10) {
      await this.createAlert(
        tribunal,
        'high_error_rate',
        'warning',
        `High error rate detected for ${tribunal.toUpperCase()}`,
        `${recentErrors.length} errors in the last hour`
      );
    }
  }

  /**
   * Create integration alert
   */
  async createAlert(
    tribunal: Tribunal,
    alertType: AlertType,
    severity: 'warning' | 'error' | 'critical',
    title: string,
    description?: string,
    affectedCases?: number
  ) {
    const db = await getDb();
    if (!db) return;

    // Check if alert already exists and not resolved
    const existingAlert = await db
      .select()
      .from(integrationAlerts)
      .where(
        and(
          eq(integrationAlerts.tribunal, tribunal),
          eq(integrationAlerts.alertType, alertType),
          isNull(integrationAlerts.resolvedAt)
        )
      )
      .limit(1);

    if (!existingAlert.length) {
      await db.insert(integrationAlerts).values({
        tribunal,
        alertType,
        severity,
        title,
        description,
        affectedCases: affectedCases || 0,
        triggeredAt: new Date(),
      });
    }
  }

  /**
   * Resolve alert
   */
  async resolveAlert(tribunal: Tribunal, alertType: AlertType) {
    const db = await getDb();
    if (!db) return;

    const alerts = await db
      .select()
      .from(integrationAlerts)
      .where(
        and(
          eq(integrationAlerts.tribunal, tribunal),
          eq(integrationAlerts.alertType, alertType),
          isNull(integrationAlerts.resolvedAt)
        )
      );

    for (const alert of alerts) {
      await db
        .update(integrationAlerts)
        .set({ resolvedAt: new Date() })
        .where(eq(integrationAlerts.id, alert.id));
    }
  }

  /**
   * Get health status for all tribunals
   */
  async getHealthStatus() {
    const db = await getDb();
    if (!db) return [];

    return db.select().from(tribunalHealthCheck);
  }

  /**
   * Get sync metrics for a case
   */
  async getSyncMetrics(caseId: number, limit: number = 50) {
    const db = await getDb();
    if (!db) return [];

    return db
      .select()
      .from(syncMetrics)
      .where(eq(syncMetrics.caseId, caseId))
      .limit(limit);
  }

  /**
   * Get active alerts
   */
  async getActiveAlerts(tribunal?: Tribunal) {
    const db = await getDb();
    if (!db) return [];

    if (tribunal) {
    return db
      .select()
      .from(integrationAlerts)
      .where(eq(integrationAlerts.tribunal, tribunal));
    }

    return db.select().from(integrationAlerts);
  }

  /**
   * Get performance report
   */
  async getPerformanceReport(tribunal: Tribunal, period: 'daily' | 'weekly' | 'monthly') {
    const db = await getDb();
    if (!db) return null;

    // Calculate date range
    const now = new Date();
    let startDate = new Date();

    if (period === 'daily') {
      startDate.setDate(now.getDate() - 1);
    } else if (period === 'weekly') {
      startDate.setDate(now.getDate() - 7);
    } else {
      startDate.setMonth(now.getMonth() - 1);
    }

    // Get sync metrics for the period
    const metrics = await db
      .select()
      .from(syncMetrics)
      .where(
        and(
          eq(syncMetrics.tribunal, tribunal),
          // Add date filter here
        )
      );

    const totalSyncs = metrics.length;
    const successfulSyncs = metrics.filter((m) => m.status === 'success').length;
    const failedSyncs = metrics.filter((m) => m.status === 'failed').length;
    const successRate = totalSyncs > 0 ? (successfulSyncs / totalSyncs) * 100 : 0;

    const durations = metrics
      .filter((m) => m.duration)
      .map((m) => m.duration as number);
    const averageResponseTime = durations.length > 0 ? Math.round(durations.reduce((a, b) => a + b) / durations.length) : 0;
    const minResponseTime = durations.length > 0 ? Math.min(...durations) : 0;
    const maxResponseTime = durations.length > 0 ? Math.max(...durations) : 0;

    const totalRecordsProcessed = metrics.reduce((sum, m) => sum + (m.recordsProcessed || 0), 0);
    const totalErrors = metrics.reduce((sum, m) => sum + (m.recordsFailed || 0), 0);

    return {
      tribunal,
      period,
      totalSyncs,
      successfulSyncs,
      failedSyncs,
      successRate: Math.round(successRate * 100) / 100,
      averageResponseTime,
      minResponseTime,
      maxResponseTime,
      totalRecordsProcessed,
      totalErrors,
      uptime: 100, // Calculate based on health checks
    };
  }

  /**
   * Helper: Get authorization headers based on auth type
   */
  private getHeaders(config: any): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    if (config.authType === 'api_key' && config.apiKey) {
      headers['Authorization'] = `Bearer ${config.apiKey}`;
    } else if (config.authType === 'basic_auth' && config.credentials) {
      headers['Authorization'] = `Basic ${config.credentials}`;
    }

    return headers;
  }

  /**
   * Helper: Determine error type from axios error
   */
  private getErrorType(error: any): string {
    if (error.code === 'ECONNABORTED') return 'TIMEOUT';
    if (error.code === 'ECONNREFUSED') return 'CONNECTION_REFUSED';
    if (error.response?.status === 401) return 'AUTH_FAILED';
    if (error.response?.status === 403) return 'FORBIDDEN';
    if (error.response?.status === 429) return 'RATE_LIMIT';
    if (error.response?.status === 500) return 'SERVER_ERROR';
    return 'UNKNOWN';
  }
}

// Singleton instance
let monitoringService: MonitoringService | null = null;

export function getMonitoringService(): MonitoringService {
  if (!monitoringService) {
    monitoringService = new MonitoringService();
  }
  return monitoringService;
}
