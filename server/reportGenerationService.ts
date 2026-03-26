import { getDb } from './db';
import { syncMetrics, performanceReport } from '../drizzle/schema';
import { eq, gte, lte, and } from 'drizzle-orm';

export interface ReportData {
  tribunal: 'tjsp' | 'tjmg' | 'tjms';
  period: 'daily' | 'weekly' | 'monthly';
  startDate: Date;
  endDate: Date;
  totalSyncs: number;
  successfulSyncs: number;
  failedSyncs: number;
  successRate: number;
  averageResponseTime: number;
  minResponseTime: number;
  maxResponseTime: number;
  totalRecordsProcessed: number;
  totalErrors: number;
  errorRate: number;
  uptime: number;
  peakHour: string;
  topErrors: Array<{ error: string; count: number }>;
  dailyMetrics: Array<{
    date: string;
    syncs: number;
    success: number;
    failed: number;
    avgResponseTime: number;
  }>;
  hourlyMetrics: Array<{
    hour: string;
    syncs: number;
    success: number;
    avgResponseTime: number;
  }>;
}

export class ReportGenerationService {
  /**
   * Gera dados de relatório para um tribunal e período específico
   */
  static async generateReportData(
    tribunal: 'tjsp' | 'tjmg' | 'tjms',
    period: 'daily' | 'weekly' | 'monthly',
  ): Promise<ReportData> {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    const now = new Date();
    let startDate: Date;

    switch (period) {
      case 'daily':
        startDate = new Date(now);
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'weekly':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'monthly':
        startDate = new Date(now);
        startDate.setDate(1);
        startDate.setHours(0, 0, 0, 0);
        break;
    }

    // Buscar métricas do período
    const metrics = await db
      .select()
      .from(syncMetrics)
      .where(
        and(
          eq(syncMetrics.tribunal, tribunal),
          gte(syncMetrics.startTime, startDate),
          lte(syncMetrics.startTime, now),
        ),
      );

    // Calcular estatísticas
    const totalSyncs = metrics.length;
    const successfulSyncs = metrics.filter((m) => m.status === 'success').length;
    const failedSyncs = metrics.filter((m) => m.status === 'failed').length;
    const successRate = totalSyncs > 0 ? (successfulSyncs / totalSyncs) * 100 : 0;

    const responseTimes = metrics
      .filter((m) => m.duration !== null)
      .map((m) => m.duration as number);
    const averageResponseTime = responseTimes.length > 0 ? responseTimes.reduce((a, b) => a + b) / responseTimes.length : 0;
    const minResponseTime = responseTimes.length > 0 ? Math.min(...responseTimes) : 0;
    const maxResponseTime = responseTimes.length > 0 ? Math.max(...responseTimes) : 0;

    const totalRecordsProcessed = metrics.reduce((sum, m) => sum + (m.recordsProcessed || 0), 0);
    const totalErrors = metrics.reduce((sum, m) => sum + (m.recordsFailed || 0), 0);
    const errorRate = totalSyncs > 0 ? (failedSyncs / totalSyncs) * 100 : 0;

    // Calcular uptime (percentual de tempo sem erros)
    const uptime = 100 - errorRate;

    // Agrupar por hora para encontrar pico
    const hourlyMap = new Map<string, number>();
    metrics.forEach((m) => {
      const hour = new Date(m.startTime).getHours().toString().padStart(2, '0');
      hourlyMap.set(hour, (hourlyMap.get(hour) || 0) + 1);
    });
    const peakHour = Array.from(hourlyMap.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] || '00';

    // Top errors
    const errorMap = new Map<string, number>();
    metrics.forEach((m) => {
      if (m.errorMessage) {
        errorMap.set(m.errorMessage, (errorMap.get(m.errorMessage) || 0) + 1);
      }
    });
    const topErrors = Array.from(errorMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([error, count]) => ({ error, count }));

    // Métricas diárias
    const dailyMap = new Map<string, { syncs: number; success: number; failed: number; times: number[] }>();
    metrics.forEach((m) => {
      const date = new Date(m.startTime).toISOString().split('T')[0];
      if (!dailyMap.has(date)) {
        dailyMap.set(date, { syncs: 0, success: 0, failed: 0, times: [] });
      }
      const daily = dailyMap.get(date)!;
      daily.syncs++;
      if (m.status === 'success') daily.success++;
      else daily.failed++;
      if (m.duration !== null) daily.times.push(m.duration);
    });

    const dailyMetrics = Array.from(dailyMap.entries()).map(([date, data]) => ({
      date,
      syncs: data.syncs,
      success: data.success,
      failed: data.failed,
      avgResponseTime: data.times.length > 0 ? data.times.reduce((a, b) => a + b) / data.times.length : 0,
    }));

    // Métricas horárias
    const hourlyMap2 = new Map<string, { syncs: number; success: number; times: number[] }>();
    metrics.forEach((m) => {
      const hour = new Date(m.startTime).getHours().toString().padStart(2, '0');
      if (!hourlyMap2.has(hour)) {
        hourlyMap2.set(hour, { syncs: 0, success: 0, times: [] });
      }
      const hourly = hourlyMap2.get(hour)!;
      hourly.syncs++;
      if (m.status === 'success') hourly.success++;
      if (m.duration !== null) hourly.times.push(m.duration);
    });

    const hourlyMetrics = Array.from(hourlyMap2.entries()).map(([hour, data]) => ({
      hour: `${hour}:00`,
      syncs: data.syncs,
      success: data.success,
      avgResponseTime: data.times.length > 0 ? data.times.reduce((a, b) => a + b) / data.times.length : 0,
    }));

    return {
      tribunal,
      period,
      startDate,
      endDate: now,
      totalSyncs,
      successfulSyncs,
      failedSyncs,
      successRate,
      averageResponseTime,
      minResponseTime,
      maxResponseTime,
      totalRecordsProcessed,
      totalErrors,
      errorRate,
      uptime,
      peakHour,
      topErrors,
      dailyMetrics,
      hourlyMetrics,
    };
  }

  /**
   * Salva relatório gerado no banco de dados
   */
  static async saveReport(
    tribunal: 'tjsp' | 'tjmg' | 'tjms',
    period: 'daily' | 'weekly' | 'monthly',
    reportData: ReportData,
  ): Promise<void> {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    await db.insert(performanceReport).values({
      tribunal,
      period,
      reportDate: new Date(),
      totalSyncs: reportData.totalSyncs,
      successfulSyncs: reportData.successfulSyncs,
      failedSyncs: reportData.failedSyncs,
      successRate: reportData.successRate.toString(),
      averageResponseTime: Math.round(reportData.averageResponseTime),
      minResponseTime: Math.round(reportData.minResponseTime),
      maxResponseTime: Math.round(reportData.maxResponseTime),
      totalRecordsProcessed: reportData.totalRecordsProcessed,
      totalErrors: reportData.totalErrors,
      uptime: reportData.uptime.toString(),
      notes: JSON.stringify(reportData),
    });
  }

  /**
   * Obtém relatórios anteriores
   */
  static async getReports(tribunal: 'tjsp' | 'tjmg' | 'tjms', limit: number = 10) {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    return await db
      .select()
      .from(performanceReport)
      .where(eq(performanceReport.tribunal, tribunal))
      .orderBy(performanceReport.reportDate)
      .limit(limit);
  }
}
