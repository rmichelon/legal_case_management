import { Request, Response } from "express";
import * as db from "./db";
import { googleCalendarService } from "./googleCalendarService";
import { NotificationService } from "./notificationService";
import crypto from "crypto";

/**
 * Webhook handler for Google Calendar push notifications
 * Receives notifications when calendar events change
 */
export class WebhookHandler {
  /**
   * Handle incoming webhook notification from Google Calendar
   */
  static async handleCalendarNotification(req: Request, res: Response) {
    try {
      // Google Calendar sends notifications via X-Goog-Channel-* headers
      const channelId = req.headers["x-goog-channel-id"] as string;
      const resourceId = req.headers["x-goog-resource-id"] as string;
      const resourceState = req.headers["x-goog-resource-state"] as string;
      const messageNumber = req.headers["x-goog-message-number"] as string;

      console.log(
        `[Webhook] Received notification: channelId=${channelId}, resourceId=${resourceId}, state=${resourceState}`
      );

      // Find the webhook subscription
      const subscription = await db.getWebhookSubscriptionByChannelId(channelId);
      if (!subscription) {
        console.warn(`[Webhook] Subscription not found for channelId: ${channelId}`);
        return res.status(404).json({ error: "Subscription not found" });
      }

      // Get the integration
      const integration = await db.getGoogleCalendarIntegrationById(subscription.integrationId);
      if (!integration || !integration.isActive) {
        console.warn(`[Webhook] Integration not active for subscriptionId: ${subscription.id}`);
        return res.status(400).json({ error: "Integration not active" });
      }

      // Update last notification time
      await db.updateWebhookSubscription(subscription.id, {
        lastNotificationAt: new Date(),
      });

      // Handle the notification based on resource state
      if (resourceState === "exists") {
        // Calendar was updated - sync changes
        await WebhookHandler.syncCalendarChanges(
          integration.id,
          subscription.userId,
          integration.accessToken,
          subscription.calendarId
        );
      } else if (resourceState === "notExists") {
        // Calendar was deleted or access revoked
        console.log(`[Webhook] Calendar no longer exists: ${subscription.calendarId}`);
        await db.updateWebhookSubscription(subscription.id, {
          isActive: false,
        });
      }

      // Acknowledge receipt of notification
      res.status(200).json({ success: true });
    } catch (error) {
      console.error("[Webhook] Error handling notification:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  /**
   * Sync calendar changes from Google Calendar to system
   */
  private static async syncCalendarChanges(
    integrationId: number,
    userId: number,
    accessToken: string,
    calendarId: string
  ) {
    try {
      // Get events from Google Calendar that were modified recently
      const events = await googleCalendarService.listRecentlyModifiedEvents(
        accessToken,
        calendarId,
        10 // Last 10 modified events
      );

      for (const googleEvent of events) {
        await WebhookHandler.syncSingleEvent(
          integrationId,
          userId,
          googleEvent,
          accessToken,
          calendarId
        );
      }
    } catch (error) {
      console.error("[Webhook] Error syncing calendar changes:", error);
    }
  }

  /**
   * Sync a single event from Google Calendar
   */
  private static async syncSingleEvent(
    integrationId: number,
    userId: number,
    googleEvent: any,
    accessToken: string,
    calendarId: string
  ) {
    try {
      // Check if event already exists in system
      const existingEvent = await db.getCalendarEventByGoogleId(googleEvent.id);

      if (googleEvent.status === "cancelled") {
        // Event was deleted in Google Calendar
        if (existingEvent) {
          await db.deleteCalendarEvent(googleEvent.id);
          await db.createSyncHistory({
            integrationId,
            userId,
            eventType: "deleted",
            sourceSystem: "google_calendar",
            googleEventId: googleEvent.id,
            status: "success",
            conflictType: "none",
          });
        }
        return;
      }

      // Parse event details
      const eventData = {
        title: googleEvent.summary || "Sem título",
        description: googleEvent.description || "",
        startTime: new Date(googleEvent.start.dateTime || googleEvent.start.date),
        endTime: googleEvent.end ? new Date(googleEvent.end.dateTime || googleEvent.end.date) : undefined,
        location: googleEvent.location || "",
        isAllDay: !googleEvent.start.dateTime,
      };

      if (existingEvent) {
        // Check for conflicts
        const hasConflict = WebhookHandler.detectConflict(existingEvent, googleEvent);

        if (hasConflict) {
          // Create conflict record for manual review
          await db.createSyncConflict({
            integrationId,
            userId,
            googleEventId: googleEvent.id,
            caseId: existingEvent.caseId,
            deadlineId: existingEvent.deadlineId,
            conflictType: "modified_both",
            googleData: JSON.stringify(googleEvent),
            systemData: JSON.stringify(existingEvent),
            status: "unresolved",
          });

          await db.createSyncHistory({
            integrationId,
            userId,
            eventType: "updated",
            sourceSystem: "google_calendar",
            googleEventId: googleEvent.id,
            caseId: existingEvent.caseId,
            deadlineId: existingEvent.deadlineId,
            status: "conflict",
            conflictType: "modified_both",
          });

          // Notify user of conflict
          await NotificationService.createAndBroadcast(userId, {
            title: "Conflito de Sincronização",
            message: `Conflito detectado ao sincronizar evento "${eventData.title}". Revisão manual necessária.`,
            type: "system",
            priority: "high",
          });
        } else {
          // Update event
          await db.updateCalendarEvent(googleEvent.id, {
            ...eventData,
            lastModifiedAt: new Date(),
          });

          await db.createSyncHistory({
            integrationId,
            userId,
            eventType: "updated",
            sourceSystem: "google_calendar",
            googleEventId: googleEvent.id,
            caseId: existingEvent.caseId,
            deadlineId: existingEvent.deadlineId,
            status: "success",
            conflictType: "none",
          });
        }
      } else {
        // Create new event (if it's related to a case in our system)
        // Try to match by description or title
        const relatedCase = await WebhookHandler.findRelatedCase(userId, googleEvent);

        if (relatedCase) {
          await db.createCalendarEvent({
            integrationId,
            caseId: relatedCase.id,
            googleEventId: googleEvent.id,
            eventType: "other",
            ...eventData,
          });

          await db.createSyncHistory({
            integrationId,
            userId,
            eventType: "created",
            sourceSystem: "google_calendar",
            googleEventId: googleEvent.id,
            caseId: relatedCase.id,
            status: "success",
            conflictType: "none",
          });
        } else {
          // Event not related to any case - skip
          await db.createSyncHistory({
            integrationId,
            userId,
            eventType: "created",
            sourceSystem: "google_calendar",
            googleEventId: googleEvent.id,
            status: "skipped",
            conflictType: "none",
          });
        }
      }
    } catch (error) {
      console.error("[Webhook] Error syncing single event:", error);
      await db.createSyncHistory({
        integrationId,
        userId,
        eventType: "updated",
        sourceSystem: "google_calendar",
        googleEventId: googleEvent.id,
        status: "failed",
        conflictType: "none",
        errorMessage: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Detect conflicts between Google Calendar event and system event
   */
  private static detectConflict(systemEvent: any, googleEvent: any): boolean {
    // Check if both were modified recently (within last hour)
    const oneHourAgo = new Date(Date.now() - 3600000);
    const systemModified = new Date(systemEvent.updatedAt) > oneHourAgo;
    const googleModified = googleEvent.updated ? new Date(googleEvent.updated) > oneHourAgo : false;

    // Conflict if both were modified
    if (systemModified && googleModified) {
      // Check if the modifications are different
      const systemTitle = systemEvent.title;
      const googleTitle = googleEvent.summary;
      const systemTime = new Date(systemEvent.startTime).getTime();
      const googleTime = new Date(googleEvent.start.dateTime || googleEvent.start.date).getTime();

      return systemTitle !== googleTitle || Math.abs(systemTime - googleTime) > 60000; // 1 minute tolerance
    }

    return false;
  }

  /**
   * Find related case for a Google Calendar event
   */
  private static async findRelatedCase(userId: number, googleEvent: any) {
    // Try to match by case number in description or title
    const searchText = `${googleEvent.summary} ${googleEvent.description || ""}`.toLowerCase();

    // Get user's cases
    const cases = await db.getCasesByUserId(userId);

    for (const caseItem of cases) {
      if (
        searchText.includes(caseItem.caseNumber.toLowerCase()) ||
        searchText.includes(caseItem.title.toLowerCase())
      ) {
        return caseItem;
      }
    }

    return null;
  }
}

/**
 * Setup webhook subscription for a calendar
 */
export async function setupWebhookSubscription(
  integrationId: number,
  userId: number,
  accessToken: string,
  calendarId: string,
  webhookUrl: string
) {
  try {
    // Create watch subscription with Google Calendar API
    const channelId = crypto.randomUUID();
    const resourceId = crypto.randomUUID();

    const response = await googleCalendarService.watchCalendar(
      accessToken,
      calendarId,
      {
        id: channelId,
        type: "web_hook",
        address: webhookUrl,
      }
    );

    // Save subscription to database
    await db.createWebhookSubscription({
      integrationId,
      userId,
      calendarId,
      resourceId: response.resourceId,
      channelId,
      expiration: new Date(parseInt(response.expiration)),
      isActive: true,
    });

    console.log(`[Webhook] Subscription created: channelId=${channelId}`);
    return { success: true, channelId };
  } catch (error) {
    console.error("[Webhook] Error setting up subscription:", error);
    throw error;
  }
}

/**
 * Renew webhook subscription before expiration
 */
export async function renewWebhookSubscription(subscriptionId: number) {
  try {
    const subscription = await db.getWebhookSubscriptionById(subscriptionId);
    if (!subscription) {
      throw new Error("Subscription not found");
    }

    const integration = await db.getGoogleCalendarIntegrationById(subscription.integrationId);
    if (!integration) {
      throw new Error("Integration not found");
    }

    // Create new watch subscription
    const channelId = crypto.randomUUID();
    const response = await googleCalendarService.watchCalendar(
      integration.accessToken,
      subscription.calendarId,
      {
        id: channelId,
        type: "web_hook",
        address: `${process.env.WEBHOOK_URL || "https://your-domain.com"}/api/webhooks/calendar`,
      }
    );

    // Update subscription
    await db.updateWebhookSubscription(subscriptionId, {
      channelId,
      resourceId: response.resourceId,
      expiration: new Date(parseInt(response.expiration)),
    });

    console.log(`[Webhook] Subscription renewed: channelId=${channelId}`);
  } catch (error) {
    console.error("[Webhook] Error renewing subscription:", error);
    throw error;
  }
}
