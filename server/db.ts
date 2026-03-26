import { eq, and, desc, like, gte, lte } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, cases, clients, deadlines, documents, movements, chatHistory, emailAlerts, notifications, notificationPreferences, googleCalendarIntegrations, calendarEvents, webhookSubscriptions, syncHistory, syncConflicts, courtData, tribunalSyncConfig, caseInteractions, auditLog, InsertGoogleCalendarIntegration, InsertCalendarEvent, InsertWebhookSubscription, InsertSyncHistory, InsertSyncConflict, InsertCourtData, InsertTribunalSyncConfig, InsertCaseInteraction, InsertAuditLog } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ============ CLIENTS QUERIES ============

export async function getClientsByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(clients).where(eq(clients.userId, userId));
}

export async function getClientById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(clients).where(eq(clients.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createClient(data: typeof clients.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(clients).values(data);
  return result;
}

export async function updateClient(id: number, data: Partial<typeof clients.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.update(clients).set(data).where(eq(clients.id, id));
}

export async function deleteClient(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.delete(clients).where(eq(clients.id, id));
}

// ============ CASES QUERIES ============

export async function getCasesByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(cases).where(eq(cases.userId, userId)).orderBy(desc(cases.createdAt));
}

export async function getCaseById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(cases).where(eq(cases.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getCaseByCaseNumber(caseNumber: string) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(cases).where(eq(cases.caseNumber, caseNumber)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createCase(data: typeof cases.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.insert(cases).values(data);
}

export async function updateCase(id: number, data: Partial<typeof cases.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.update(cases).set(data).where(eq(cases.id, id));
}

export async function deleteCase(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.delete(cases).where(eq(cases.id, id));
}

export async function searchCases(userId: number, query: string) {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(cases).where(
    and(
      eq(cases.userId, userId),
      like(cases.title, `%${query}%`)
    )
  );
}

// ============ DEADLINES QUERIES ============

export async function getDeadlinesByCaseId(caseId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(deadlines).where(eq(deadlines.caseId, caseId)).orderBy(deadlines.dueDate);
}

export async function getUpcomingDeadlinesByUserId(userId: number, daysAhead: number = 30) {
  const db = await getDb();
  if (!db) return [];

  const now = new Date();
  const futureDate = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000);

  return await db.select().from(deadlines)
    .innerJoin(cases, eq(deadlines.caseId, cases.id))
    .where(
      and(
        eq(cases.userId, userId),
        eq(deadlines.status, 'pending'),
        gte(deadlines.dueDate, now),
        lte(deadlines.dueDate, futureDate)
      )
    )
    .orderBy(deadlines.dueDate);
}

export async function getDeadlineById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(deadlines).where(eq(deadlines.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createDeadline(data: typeof deadlines.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.insert(deadlines).values(data);
}

export async function updateDeadline(id: number, data: Partial<typeof deadlines.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.update(deadlines).set(data).where(eq(deadlines.id, id));
}

// ============ DOCUMENTS QUERIES ============

export async function getDocumentsByCaseId(caseId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(documents).where(eq(documents.caseId, caseId)).orderBy(desc(documents.createdAt));
}

export async function getDocumentById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(documents).where(eq(documents.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createDocument(data: typeof documents.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.insert(documents).values(data);
}

export async function deleteDocument(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.delete(documents).where(eq(documents.id, id));
}

// ============ MOVEMENTS QUERIES ============

export async function getMovementsByCaseId(caseId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(movements).where(eq(movements.caseId, caseId)).orderBy(desc(movements.date));
}

export async function createMovement(data: typeof movements.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.insert(movements).values(data);
}

// ============ CHAT HISTORY QUERIES ============

export async function getChatHistoryByUserId(userId: number, limit: number = 10) {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(chatHistory).where(eq(chatHistory.userId, userId)).orderBy(desc(chatHistory.createdAt)).limit(limit);
}

export async function createChatHistory(data: typeof chatHistory.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.insert(chatHistory).values(data);
}

export async function updateChatHistory(id: number, data: Partial<typeof chatHistory.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.update(chatHistory).set(data).where(eq(chatHistory.id, id));
}

// ============ EMAIL ALERTS QUERIES ============

export async function createEmailAlert(data: typeof emailAlerts.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.insert(emailAlerts).values(data);
}

export async function getEmailAlertsByDeadlineId(deadlineId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(emailAlerts).where(eq(emailAlerts.deadlineId, deadlineId));
}

// ============ NOTIFICATIONS QUERIES ============

export async function getNotificationsByUserId(userId: number, limit: number = 20) {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(notifications).where(eq(notifications.userId, userId)).orderBy(desc(notifications.createdAt)).limit(limit);
}

export async function getUnreadNotificationsByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(notifications).where(
    and(
      eq(notifications.userId, userId),
      eq(notifications.read, false)
    )
  ).orderBy(desc(notifications.createdAt));
}

export async function createNotification(data: typeof notifications.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.insert(notifications).values(data);
}

export async function markNotificationAsRead(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.update(notifications).set({ read: true, readAt: new Date() }).where(eq(notifications.id, id));
}

export async function markAllNotificationsAsRead(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.update(notifications).set({ read: true, readAt: new Date() }).where(
    and(
      eq(notifications.userId, userId),
      eq(notifications.read, false)
    )
  );
}

export async function deleteNotification(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.delete(notifications).where(eq(notifications.id, id));
}

// ============ NOTIFICATION PREFERENCES QUERIES ============

export async function getNotificationPreferencesByUserId(userId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(notificationPreferences).where(eq(notificationPreferences.userId, userId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createNotificationPreferences(data: typeof notificationPreferences.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.insert(notificationPreferences).values(data);
}

export async function updateNotificationPreferences(userId: number, data: Partial<typeof notificationPreferences.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.update(notificationPreferences).set(data).where(eq(notificationPreferences.userId, userId));
}


// ============ GOOGLE CALENDAR INTEGRATION QUERIES ============

export async function getGoogleCalendarIntegration(userId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(googleCalendarIntegrations)
    .where(eq(googleCalendarIntegrations.userId, userId))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function createGoogleCalendarIntegration(
  data: InsertGoogleCalendarIntegration
): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot create integration: database not available");
    return;
  }

  try {
    await db.insert(googleCalendarIntegrations).values(data);
  } catch (error) {
    console.error("[Database] Failed to create integration:", error);
    throw error;
  }
}

export async function updateGoogleCalendarIntegration(
  userId: number,
  data: Partial<InsertGoogleCalendarIntegration>
): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot update integration: database not available");
    return;
  }

  try {
    await db
      .update(googleCalendarIntegrations)
      .set(data)
      .where(eq(googleCalendarIntegrations.userId, userId));
  } catch (error) {
    console.error("[Database] Failed to update integration:", error);
    throw error;
  }
}

export async function createCalendarEvent(data: InsertCalendarEvent): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot create calendar event: database not available");
    return;
  }

  try {
    await db.insert(calendarEvents).values(data);
  } catch (error) {
    console.error("[Database] Failed to create calendar event:", error);
    throw error;
  }
}

export async function getCalendarEventByGoogleId(googleEventId: string) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(calendarEvents)
    .where(eq(calendarEvents.googleEventId, googleEventId))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getCaseCalendarEvents(caseId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(calendarEvents).where(eq(calendarEvents.caseId, caseId));
}

export async function updateCalendarEvent(
  googleEventId: string,
  data: Partial<InsertCalendarEvent>
): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot update calendar event: database not available");
    return;
  }

  try {
    await db
      .update(calendarEvents)
      .set(data)
      .where(eq(calendarEvents.googleEventId, googleEventId));
  } catch (error) {
    console.error("[Database] Failed to update calendar event:", error);
    throw error;
  }
}

export async function deleteCalendarEvent(googleEventId: string): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot delete calendar event: database not available");
    return;
  }

  try {
    await db.delete(calendarEvents).where(eq(calendarEvents.googleEventId, googleEventId));
  } catch (error) {
    console.error("[Database] Failed to delete calendar event:", error);
    throw error;
  }
}


// ============ WEBHOOK QUERIES ============

export async function createWebhookSubscription(
  data: InsertWebhookSubscription
): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot create webhook subscription: database not available");
    return;
  }

  try {
    await db.insert(webhookSubscriptions).values(data);
  } catch (error) {
    console.error("[Database] Failed to create webhook subscription:", error);
    throw error;
  }
}

export async function getWebhookSubscriptionByChannelId(channelId: string) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(webhookSubscriptions)
    .where(eq(webhookSubscriptions.channelId, channelId))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getWebhookSubscriptionById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(webhookSubscriptions)
    .where(eq(webhookSubscriptions.id, id))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function updateWebhookSubscription(
  id: number,
  data: Partial<InsertWebhookSubscription>
): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot update webhook subscription: database not available");
    return;
  }

  try {
    await db.update(webhookSubscriptions).set(data).where(eq(webhookSubscriptions.id, id));
  } catch (error) {
    console.error("[Database] Failed to update webhook subscription:", error);
    throw error;
  }
}

export async function getGoogleCalendarIntegrationById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(googleCalendarIntegrations)
    .where(eq(googleCalendarIntegrations.id, id))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ============ SYNC HISTORY QUERIES ============

export async function createSyncHistory(data: InsertSyncHistory): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot create sync history: database not available");
    return;
  }

  try {
    await db.insert(syncHistory).values(data);
  } catch (error) {
    console.error("[Database] Failed to create sync history:", error);
    throw error;
  }
}

export async function getSyncHistoryByIntegration(integrationId: number, limit: number = 50) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(syncHistory)
    .where(eq(syncHistory.integrationId, integrationId))
    .orderBy(desc(syncHistory.createdAt))
    .limit(limit);
}

// ============ SYNC CONFLICTS QUERIES ============

export async function createSyncConflict(data: InsertSyncConflict): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot create sync conflict: database not available");
    return;
  }

  try {
    await db.insert(syncConflicts).values(data);
  } catch (error) {
    console.error("[Database] Failed to create sync conflict:", error);
    throw error;
  }
}

export async function getUnresolvedConflicts(userId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(syncConflicts)
    .where(and(eq(syncConflicts.userId, userId), eq(syncConflicts.status, "unresolved")))
    .orderBy(desc(syncConflicts.createdAt));
}

export async function updateSyncConflict(
  id: number,
  data: Partial<InsertSyncConflict>
): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot update sync conflict: database not available");
    return;
  }

  try {
    await db.update(syncConflicts).set(data).where(eq(syncConflicts.id, id));
  } catch (error) {
    console.error("[Database] Failed to update sync conflict:", error);
    throw error;
  }
}


export async function getSyncConflictById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(syncConflicts)
    .where(eq(syncConflicts.id, id))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}


// Tribunal and court data queries
export async function getCourtDataByCase(caseId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(courtData)
    .where(eq(courtData.caseId, caseId))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function createOrUpdateCourtData(data: InsertCourtData) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot create court data: database not available");
    return;
  }

  try {
    await db.insert(courtData).values(data).onDuplicateKeyUpdate({
      set: {
        courtName: data.courtName,
        vara: data.vara,
        judge: data.judge,
        processStatus: data.processStatus,
        lastMovement: data.lastMovement,
        lastMovementDate: data.lastMovementDate,
        plaintiff: data.plaintiff,
        defendant: data.defendant,
        nextHearingDate: data.nextHearingDate,
        lastSyncAt: new Date(),
        syncStatus: data.syncStatus,
        updatedAt: new Date(),
      },
    });
  } catch (error) {
    console.error("[Database] Failed to create/update court data:", error);
    throw error;
  }
}

export async function getTribunalSyncConfig(userId: number, tribunalCode: string) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(tribunalSyncConfig)
    .where(and(eq(tribunalSyncConfig.userId, userId), eq(tribunalSyncConfig.tribunalCode, tribunalCode)))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function createTribunalSyncConfig(config: InsertTribunalSyncConfig) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot create tribunal sync config: database not available");
    return;
  }

  try {
    const result = await db.insert(tribunalSyncConfig).values(config);
    return result;
  } catch (error) {
    console.error("[Database] Failed to create tribunal sync config:", error);
    throw error;
  }
}

export async function updateTribunalSyncConfig(id: number, updates: Partial<InsertTribunalSyncConfig>) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot update tribunal sync config: database not available");
    return;
  }

  try {
    await db.update(tribunalSyncConfig).set(updates).where(eq(tribunalSyncConfig.id, id));
  } catch (error) {
    console.error("[Database] Failed to update tribunal sync config:", error);
    throw error;
  }
}

// Case interactions
export async function createCaseInteraction(interaction: InsertCaseInteraction) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot create case interaction: database not available");
    return;
  }

  try {
    const result = await db.insert(caseInteractions).values(interaction);
    return result;
  } catch (error) {
    console.error("[Database] Failed to create case interaction:", error);
    throw error;
  }
}

export async function getCaseInteractionsByCaseId(caseId: number, limit: number = 50) {
  const db = await getDb();
  if (!db) return [];

  try {
    const result = await db
      .select()
      .from(caseInteractions)
      .where(eq(caseInteractions.caseId, caseId))
      .orderBy(desc(caseInteractions.createdAt))
      .limit(limit);

    return result;
  } catch (error) {
    console.error("[Database] Failed to get case interactions:", error);
    return [];
  }
}

// Audit log
export async function createAuditLog(log: InsertAuditLog) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot create audit log: database not available");
    return;
  }

  try {
    await db.insert(auditLog).values(log);
  } catch (error) {
    console.error("[Database] Failed to create audit log:", error);
    throw error;
  }
}

export async function getAuditLogByCaseId(caseId: number, limit: number = 100) {
  const db = await getDb();
  if (!db) return [];

  try {
    const result = await db
      .select()
      .from(auditLog)
      .where(eq(auditLog.caseId, caseId))
      .orderBy(desc(auditLog.createdAt))
      .limit(limit);

    return result;
  } catch (error) {
    console.error("[Database] Failed to get audit log:", error);
    return [];
  }
}
