import * as db from "../db";
import { notifyOwner } from "./notification";
import { invokeLLM } from "./llm";

export interface AlertConfig {
  userId: number;
  alertType: "deadline" | "case_update" | "document" | "performance" | "daily_report";
  channel: "email" | "sms" | "push" | "in_app";
  title: string;
  message: string;
  relatedCaseId?: number;
  relatedDeadlineId?: number;
}

/**
 * Send alert through multiple channels
 */
export async function sendAlert(config: AlertConfig): Promise<boolean> {
  try {
    // Create alert history record
    const alertRecord = await db.createAlertHistory({
      userId: config.userId,
      alertType: config.alertType,
      channel: config.channel,
      title: config.title,
      message: config.message,
      relatedCaseId: config.relatedCaseId,
      relatedDeadlineId: config.relatedDeadlineId,
      status: "pending",
    });

    // Send through appropriate channel
    let success = false;
    switch (config.channel) {
      case "email":
        success = await sendEmailAlert(config);
        break;
      case "sms":
        success = await sendSmsAlert(config);
        break;
      case "push":
        success = await sendPushAlert(config);
        break;
      case "in_app":
        success = await sendInAppAlert(config);
        break;
    }

    // Update alert status
    if (alertRecord && typeof alertRecord === "object" && "id" in alertRecord) {
      await db.updateAlertHistory((alertRecord as any).id, {
        status: success ? "sent" : "failed",
        sentAt: new Date(),
        failureReason: success ? undefined : "Channel delivery failed",
      });
    }

    return success;
  } catch (error) {
    console.error("[AlertService] Failed to send alert:", error);
    return false;
  }
}

/**
 * Send email alert
 */
async function sendEmailAlert(config: AlertConfig): Promise<boolean> {
  try {
    // Get user preferences
    const prefs = await db.getAlertPreferenceByUserAndType(config.userId, "email");
    if (!prefs?.enabled) return false;

    // Send email via notification system
    const success = await notifyOwner({
      title: config.title,
      content: config.message,
    });

    return success;
  } catch (error) {
    console.error("[AlertService] Email alert failed:", error);
    return false;
  }
}

/**
 * Send SMS alert (placeholder - requires SMS service integration)
 */
async function sendSmsAlert(config: AlertConfig): Promise<boolean> {
  try {
    // Get user preferences
    const prefs = await db.getAlertPreferenceByUserAndType(config.userId, "sms");
    if (!prefs?.enabled) return false;

    // TODO: Integrate with SMS service (Twilio, AWS SNS, etc.)
    console.log("[AlertService] SMS alert (not yet implemented):", config.title);
    
    return false;
  } catch (error) {
    console.error("[AlertService] SMS alert failed:", error);
    return false;
  }
}

/**
 * Send push notification alert
 */
async function sendPushAlert(config: AlertConfig): Promise<boolean> {
  try {
    // Get user preferences
    const prefs = await db.getAlertPreferenceByUserAndType(config.userId, "push");
    if (!prefs?.enabled) return false;

    // TODO: Integrate with push notification service (Firebase, OneSignal, etc.)
    console.log("[AlertService] Push alert (not yet implemented):", config.title);
    
    return false;
  } catch (error) {
    console.error("[AlertService] Push alert failed:", error);
    return false;
  }
}

/**
 * Send in-app alert (notification in system)
 */
async function sendInAppAlert(config: AlertConfig): Promise<boolean> {
  try {
    // Get user preferences
    const prefs = await db.getAlertPreferenceByUserAndType(config.userId, "in_app");
    if (!prefs?.enabled) return false;

    // Create in-app notification
    // This is handled by the notification system already
    return true;
  } catch (error) {
    console.error("[AlertService] In-app alert failed:", error);
    return false;
  }
}

/**
 * Check for overdue deadlines and send alerts
 */
export async function checkOverdueDeadlines(): Promise<void> {
  try {
    const now = new Date();
    
    // Get all active cases with deadlines
    const cases = await db.getCasesByUserId(1); // TODO: Get all users
    
    for (const caseItem of cases) {
      // Get deadlines for this case
      const deadlines = await db.getDeadlinesByCaseId(caseItem.id);
      
      for (const deadline of deadlines) {
        if (deadline.dueDate < now && deadline.status !== "completed") {
          // Send overdue alert
          await sendAlert({
            userId: caseItem.userId,
            alertType: "deadline",
            channel: "email",
            title: `Prazo Vencido: ${caseItem.caseNumber}`,
            message: `O prazo "${deadline.description}" venceu em ${deadline.dueDate.toLocaleDateString("pt-BR")}`,
            relatedCaseId: caseItem.id,
            relatedDeadlineId: deadline.id,
          });
        }
      }
    }
  } catch (error) {
    console.error("[AlertService] Failed to check overdue deadlines:", error);
  }
}

/**
 * Check for upcoming deadlines and send alerts
 */
export async function checkUpcomingDeadlines(daysAhead: number = 7): Promise<void> {
  try {
    const now = new Date();
    const futureDate = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000);
    
    // Get all active cases with deadlines
    const cases = await db.getCasesByUserId(1); // TODO: Get all users
    
    for (const caseItem of cases) {
      // Get deadlines for this case
      const deadlines = await db.getDeadlinesByCaseId(caseItem.id);
      
      for (const deadline of deadlines) {
        if (deadline.dueDate >= now && deadline.dueDate <= futureDate && deadline.status !== "completed") {
          const daysUntil = Math.ceil((deadline.dueDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
          
          // Send upcoming alert
          await sendAlert({
            userId: caseItem.userId,
            alertType: "deadline",
            channel: "email",
            title: `Prazo Próximo: ${caseItem.caseNumber}`,
            message: `O prazo "${deadline.description}" vence em ${daysUntil} dia(s) (${deadline.dueDate.toLocaleDateString("pt-BR")})`,
            relatedCaseId: caseItem.id,
            relatedDeadlineId: deadline.id,
          });
        }
      }
    }
  } catch (error) {
    console.error("[AlertService] Failed to check upcoming deadlines:", error);
  }
}

/**
 * Generate and send daily report
 */
export async function generateDailyReport(userId: number): Promise<void> {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check if report already exists for today
    const existingReport = await db.getDailyReportByDate(userId, today);
    if (existingReport) {
      console.log("[AlertService] Daily report already exists for today");
      return;
    }

    // Get statistics
    const userCases = await db.getCasesByUserId(userId);
    const activeCases = userCases.filter((c) => c.status === "open").length;
    const closedCases = userCases.filter((c) => c.status === "closed").length;

    // Get deadlines
    let overduePrazos = 0;
    let upcomingPrazos = 0;
    for (const caseItem of userCases) {
      const deadlines = await db.getDeadlinesByCaseId(caseItem.id);
      for (const deadline of deadlines) {
        if (deadline.dueDate < today && deadline.status !== "completed") {
          overduePrazos++;
        } else if (deadline.dueDate >= today && deadline.dueDate <= new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000)) {
          upcomingPrazos++;
        }
      }
    }

    // Get lawyers
    const lawyers = await db.getLawyersByUserId(userId);
    const activeLawyers = lawyers.filter((l) => l.status === "active").length;

    // Get clients
    const clients = await db.getClientsByUserId(userId);

    // Get documents (placeholder - would need to aggregate from all cases)
    const documents: any[] = [];
    for (const caseItem of userCases) {
      const caseDocs = await db.getDocumentsByCaseId(caseItem.id);
      documents.push(...caseDocs);
    }

    // Create report
    const report = await db.createDailyReport({
      userId,
      reportDate: today,
      totalCases: userCases.length,
      activeCases,
      closedCases,
      overduePrazos,
      upcomingPrazos,
      totalDeadlines: 0,
      completedDeadlines: 0,
      totalLawyers: lawyers.length,
      activeLawyers,
      totalClients: clients.length,
      newCases: userCases.filter((c) => {
        const caseDate = new Date(c.createdAt);
        return caseDate.toDateString() === today.toDateString();
      }).length,
      closedCasesToday: userCases.filter((c) => {
        return c.status === "closed";
      }).length,
      totalDocuments: documents.length,
      newDocuments: documents.filter((d: any) => {
        const docDate = new Date(d.createdAt);
        return docDate.toDateString() === today.toDateString();
      }).length,
      successRate: "0.00",
      averageResolutionTime: 0,
      totalRevenue: "0.00",
      reportContent: {
        summary: `Relatório diário de ${today.toLocaleDateString("pt-BR")}`,
        timestamp: new Date().toISOString(),
      },
    });

    // Send report alert
    if (report && typeof report === "object" && "id" in report) {
      const reportSummary = `
        Relatório Diário - ${today.toLocaleDateString("pt-BR")}
        
        Processos: ${activeCases} ativos, ${closedCases} fechados
        Prazos: ${overduePrazos} vencidos, ${upcomingPrazos} próximos
        Advogados: ${activeLawyers} ativos
        Clientes: ${clients.length}
        Documentos: ${documents.length}
      `;

      await sendAlert({
        userId,
        alertType: "daily_report",
        channel: "email",
        title: `Relatório Diário - ${today.toLocaleDateString("pt-BR")}`,
        message: reportSummary,
      });
    }
  } catch (error) {
    console.error("[AlertService] Failed to generate daily report:", error);
  }
}

/**
 * Send batch alerts based on user preferences
 */
export async function sendBatchAlerts(): Promise<void> {
  try {
    console.log("[AlertService] Starting batch alert processing...");
    
    // Check for overdue deadlines
    await checkOverdueDeadlines();
    
    // Check for upcoming deadlines
    await checkUpcomingDeadlines(7);
    
    console.log("[AlertService] Batch alert processing completed");
  } catch (error) {
    console.error("[AlertService] Failed to process batch alerts:", error);
  }
}
