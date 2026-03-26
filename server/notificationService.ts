import { wsManager } from "./websocket";
import * as db from "./db";
import { TRPCError } from "@trpc/server";

/**
 * Service for creating and broadcasting notifications
 */
export class NotificationService {
  /**
   * Create a notification and broadcast it via WebSocket
   */
  static async createAndBroadcast(
    userId: number,
    notification: {
      caseId?: number;
      deadlineId?: number;
      title: string;
      message: string;
      type: "deadline_alert" | "case_update" | "new_movement" | "document_uploaded" | "system";
      priority: "low" | "medium" | "high" | "urgent";
      actionUrl?: string;
    }
  ) {
    try {
      // Save to database
      const result = await db.createNotification({
        userId,
        ...notification,
      });

      // Get the created notification ID
      const insertId = (result as any).insertId || 1;

      // Broadcast via WebSocket
      await wsManager.sendNotificationToUser(userId, {
        id: insertId,
        title: notification.title,
        message: notification.message,
        type: notification.type,
        priority: notification.priority,
        actionUrl: notification.actionUrl,
      });

      return { success: true, notificationId: insertId };
    } catch (error) {
      console.error("[NotificationService] Error creating notification:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Erro ao criar notificação",
      });
    }
  }

  /**
   * Create notification for multiple users
   */
  static async createAndBroadcastToUsers(
    userIds: number[],
    notification: {
      caseId?: number;
      deadlineId?: number;
      title: string;
      message: string;
      type: "deadline_alert" | "case_update" | "new_movement" | "document_uploaded" | "system";
      priority: "low" | "medium" | "high" | "urgent";
      actionUrl?: string;
    }
  ) {
    try {
      const results = [];

      for (const userId of userIds) {
        const result = await db.createNotification({
          userId,
          ...notification,
        });

        const insertId = (result as any).insertId || 1;
        results.push(insertId);

        // Broadcast via WebSocket
        await wsManager.sendNotificationToUser(userId, {
          id: insertId,
          title: notification.title,
          message: notification.message,
          type: notification.type,
          priority: notification.priority,
          actionUrl: notification.actionUrl,
        });
      }

      return { success: true, notificationIds: results };
    } catch (error) {
      console.error("[NotificationService] Error creating notifications:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Erro ao criar notificações",
      });
    }
  }

  /**
   * Send deadline alert notification
   */
  static async sendDeadlineAlert(
    userId: number,
    caseId: number,
    deadline: {
      id: number;
      title: string;
      dueDate: Date;
      daysRemaining: number;
    }
  ) {
    const priority = deadline.daysRemaining <= 1 ? "urgent" : deadline.daysRemaining <= 3 ? "high" : "medium";

    return this.createAndBroadcast(userId, {
      caseId,
      deadlineId: deadline.id,
      title: `Prazo: ${deadline.title}`,
      message: `Prazo vence em ${deadline.daysRemaining} dia${deadline.daysRemaining !== 1 ? "s" : ""}`,
      type: "deadline_alert",
      priority,
      actionUrl: `/cases/${caseId}`,
    });
  }

  /**
   * Send case update notification
   */
  static async sendCaseUpdate(
    userId: number,
    caseId: number,
    update: {
      title: string;
      message: string;
    }
  ) {
    return this.createAndBroadcast(userId, {
      caseId,
      title: update.title,
      message: update.message,
      type: "case_update",
      priority: "medium",
      actionUrl: `/cases/${caseId}`,
    });
  }

  /**
   * Send new movement notification
   */
  static async sendNewMovement(
    userId: number,
    caseId: number,
    movement: {
      title: string;
      description?: string;
    }
  ) {
    return this.createAndBroadcast(userId, {
      caseId,
      title: `Nova Movimentação: ${movement.title}`,
      message: movement.description || "Uma nova movimentação foi registrada no processo",
      type: "new_movement",
      priority: "medium",
      actionUrl: `/cases/${caseId}`,
    });
  }

  /**
   * Send document uploaded notification
   */
  static async sendDocumentUploaded(
    userId: number,
    caseId: number,
    document: {
      name: string;
      type?: string;
    }
  ) {
    return this.createAndBroadcast(userId, {
      caseId,
      title: `Documento Enviado: ${document.name}`,
      message: `Um novo documento foi adicionado ao processo${document.type ? ` (${document.type})` : ""}`,
      type: "document_uploaded",
      priority: "low",
      actionUrl: `/cases/${caseId}`,
    });
  }

  /**
   * Send system notification
   */
  static async sendSystemNotification(
    userId: number,
    notification: {
      title: string;
      message: string;
      priority?: "low" | "medium" | "high" | "urgent";
    }
  ) {
    return this.createAndBroadcast(userId, {
      title: notification.title,
      message: notification.message,
      type: "system",
      priority: notification.priority || "medium",
    });
  }

  /**
   * Check for upcoming deadlines and send alerts
   */
  static async checkAndSendDeadlineAlerts(userId: number, daysAhead: number = 3) {
    try {
      const upcomingDeadlines = await db.getUpcomingDeadlinesByUserId(userId, daysAhead);

      for (const item of upcomingDeadlines) {
        const deadline = (item as any).deadlines;
        const daysRemaining = Math.ceil(
          (new Date(deadline.dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        );

        // Only send if not already sent
        if (!deadline.alertSent && daysRemaining <= daysAhead) {
          await this.sendDeadlineAlert(userId, (item as any).cases.id, {
            id: deadline.id,
            title: deadline.title,
            dueDate: deadline.dueDate,
            daysRemaining,
          });

          // Mark as sent
          await db.updateDeadline(deadline.id, { alertSent: true, alertSentAt: new Date() });
        }
      }

      return { success: true };
    } catch (error) {
      console.error("[NotificationService] Error checking deadlines:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Erro ao verificar prazos",
      });
    }
  }

  /**
   * Get WebSocket connection status for user
   */
  static isUserConnected(userId: number): boolean {
    return wsManager.isUserConnected(userId);
  }

  /**
   * Get connected users count
   */
  static getConnectedUsersCount(): number {
    return wsManager.getConnectedUsersCount();
  }
}
