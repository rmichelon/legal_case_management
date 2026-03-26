import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, boolean, json } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extended with additional tables for legal case management system.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Clients/Parties table - stores information about clients and parties involved in cases
 */
export const clients = mysqlTable("clients", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 20 }),
  cpfCnpj: varchar("cpfCnpj", { length: 20 }).unique(),
  address: text("address"),
  city: varchar("city", { length: 100 }),
  state: varchar("state", { length: 2 }),
  zipCode: varchar("zipCode", { length: 10 }),
  type: mysqlEnum("type", ["person", "company"]).default("person").notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Client = typeof clients.$inferSelect;
export type InsertClient = typeof clients.$inferInsert;

/**
 * Legal cases/processes table - stores information about judicial processes
 */
export const cases = mysqlTable("cases", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  caseNumber: varchar("caseNumber", { length: 50 }).notNull().unique(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  caseType: varchar("caseType", { length: 100 }).notNull(), // e.g., "Ação Cível", "Ação Trabalhista"
  status: mysqlEnum("status", ["open", "suspended", "closed", "archived"]).default("open").notNull(),
  court: varchar("court", { length: 255 }).notNull(), // e.g., "Vara Cível"
  judge: varchar("judge", { length: 255 }),
  opposingParty: varchar("opposingParty", { length: 255 }),
  clientId: int("clientId").notNull(),
  fileNumber: varchar("fileNumber", { length: 50 }),
  filingDate: timestamp("filingDate"),
  estimatedClosureDate: timestamp("estimatedClosureDate"),
  priority: mysqlEnum("priority", ["low", "medium", "high", "urgent"]).default("medium").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Case = typeof cases.$inferSelect;
export type InsertCase = typeof cases.$inferInsert;

/**
 * Deadlines/Prazos table - stores important dates and deadlines for cases
 */
export const deadlines = mysqlTable("deadlines", {
  id: int("id").autoincrement().primaryKey(),
  caseId: int("caseId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  dueDate: timestamp("dueDate").notNull(),
  type: mysqlEnum("type", ["hearing", "filing", "response", "appeal", "payment", "other"]).default("other").notNull(),
  status: mysqlEnum("status", ["pending", "completed", "overdue", "cancelled"]).default("pending").notNull(),
  alertSent: boolean("alertSent").default(false).notNull(),
  alertSentAt: timestamp("alertSentAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Deadline = typeof deadlines.$inferSelect;
export type InsertDeadline = typeof deadlines.$inferInsert;

/**
 * Case movements/Movimentações table - tracks procedural movements and updates
 */
export const movements = mysqlTable("movements", {
  id: int("id").autoincrement().primaryKey(),
  caseId: int("caseId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  type: varchar("type", { length: 100 }).notNull(), // e.g., "Sentença", "Apelação", "Recurso"
  date: timestamp("date").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Movement = typeof movements.$inferSelect;
export type InsertMovement = typeof movements.$inferInsert;

/**
 * Documents table - stores metadata about uploaded documents
 */
export const documents = mysqlTable("documents", {
  id: int("id").autoincrement().primaryKey(),
  caseId: int("caseId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  fileKey: varchar("fileKey", { length: 255 }).notNull(), // S3 key
  fileUrl: text("fileUrl").notNull(), // S3 URL
  mimeType: varchar("mimeType", { length: 100 }).notNull(),
  fileSize: int("fileSize").notNull(), // in bytes
  documentType: varchar("documentType", { length: 100 }), // e.g., "Petição", "Sentença", "Parecer"
  uploadedBy: int("uploadedBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Document = typeof documents.$inferSelect;
export type InsertDocument = typeof documents.$inferInsert;

/**
 * Chat history table - stores conversations with the AI chatbot
 */
export const chatHistory = mysqlTable("chatHistory", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  caseId: int("caseId"),
  messages: json("messages").notNull(), // Array of {role, content}
  topic: varchar("topic", { length: 100 }), // e.g., "petition_draft", "document_analysis"
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ChatHistory = typeof chatHistory.$inferSelect;
export type InsertChatHistory = typeof chatHistory.$inferInsert;

/**
 * Email alerts log - tracks sent email alerts
 */
export const emailAlerts = mysqlTable("emailAlerts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  deadlineId: int("deadlineId").notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  subject: varchar("subject", { length: 255 }).notNull(),
  sentAt: timestamp("sentAt").defaultNow().notNull(),
  status: mysqlEnum("status", ["sent", "failed", "bounced"]).default("sent").notNull(),
});

export type EmailAlert = typeof emailAlerts.$inferSelect;
export type InsertEmailAlert = typeof emailAlerts.$inferInsert;

/**
 * Notifications table - stores real-time notifications for users
 */
export const notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  caseId: int("caseId"),
  deadlineId: int("deadlineId"),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  type: mysqlEnum("type", ["deadline_alert", "case_update", "new_movement", "document_uploaded", "system"]).notNull(),
  priority: mysqlEnum("priority", ["low", "medium", "high", "urgent"]).default("medium").notNull(),
  read: boolean("read").default(false).notNull(),
  readAt: timestamp("readAt"),
  actionUrl: varchar("actionUrl", { length: 500 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;

/**
 * Notification preferences table - stores user preferences for notifications
 */
export const notificationPreferences = mysqlTable("notificationPreferences", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  deadlineAlerts: boolean("deadlineAlerts").default(true).notNull(),
  caseUpdates: boolean("caseUpdates").default(true).notNull(),
  newMovements: boolean("newMovements").default(true).notNull(),
  documentUploads: boolean("documentUploads").default(true).notNull(),
  emailNotifications: boolean("emailNotifications").default(true).notNull(),
  pushNotifications: boolean("pushNotifications").default(true).notNull(),
  daysBeforeDeadline: int("daysBeforeDeadline").default(3).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type NotificationPreference = typeof notificationPreferences.$inferSelect;
export type InsertNotificationPreference = typeof notificationPreferences.$inferInsert;


/**
 * Google Calendar Integration Tables
 */
export const googleCalendarIntegrations = mysqlTable("googleCalendarIntegrations", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  googleAccountEmail: varchar("googleAccountEmail", { length: 320 }).notNull(),
  accessToken: text("accessToken").notNull(),
  refreshToken: text("refreshToken"),
  tokenExpiresAt: timestamp("tokenExpiresAt"),
  calendarId: varchar("calendarId", { length: 255 }).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  syncDeadlines: boolean("syncDeadlines").default(true).notNull(),
  syncMovements: boolean("syncMovements").default(true).notNull(),
  syncHearings: boolean("syncHearings").default(true).notNull(),
  lastSyncAt: timestamp("lastSyncAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type GoogleCalendarIntegration = typeof googleCalendarIntegrations.$inferSelect;
export type InsertGoogleCalendarIntegration = typeof googleCalendarIntegrations.$inferInsert;

export const calendarEvents = mysqlTable("calendarEvents", {
  id: int("id").autoincrement().primaryKey(),
  integrationId: int("integrationId").notNull(),
  caseId: int("caseId").notNull(),
  deadlineId: int("deadlineId"),
  googleEventId: varchar("googleEventId", { length: 255 }).notNull().unique(),
  eventType: mysqlEnum("eventType", ["deadline", "movement", "hearing", "other"]).notNull(),
  title: text("title").notNull(),
  description: text("description"),
  startTime: timestamp("startTime").notNull(),
  endTime: timestamp("endTime"),
  location: varchar("location", { length: 500 }),
  isAllDay: boolean("isAllDay").default(false).notNull(),
  syncedAt: timestamp("syncedAt").defaultNow().notNull(),
  lastModifiedAt: timestamp("lastModifiedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CalendarEvent = typeof calendarEvents.$inferSelect;
export type InsertCalendarEvent = typeof calendarEvents.$inferInsert;


/**
 * Webhook subscriptions table - tracks active webhooks for Google Calendar
 */
export const webhookSubscriptions = mysqlTable("webhookSubscriptions", {
  id: int("id").autoincrement().primaryKey(),
  integrationId: int("integrationId").notNull(),
  userId: int("userId").notNull(),
  calendarId: varchar("calendarId", { length: 255 }).notNull(),
  resourceId: varchar("resourceId", { length: 255 }).notNull().unique(),
  channelId: varchar("channelId", { length: 255 }).notNull().unique(),
  expiration: timestamp("expiration").notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  lastNotificationAt: timestamp("lastNotificationAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type WebhookSubscription = typeof webhookSubscriptions.$inferSelect;
export type InsertWebhookSubscription = typeof webhookSubscriptions.$inferInsert;

/**
 * Sync history table - tracks all synchronization events between Google Calendar and system
 */
export const syncHistory = mysqlTable("syncHistory", {
  id: int("id").autoincrement().primaryKey(),
  integrationId: int("integrationId").notNull(),
  userId: int("userId").notNull(),
  eventType: mysqlEnum("eventType", ["created", "updated", "deleted"]).notNull(),
  sourceSystem: mysqlEnum("sourceSystem", ["google_calendar", "legal_system"]).notNull(),
  googleEventId: varchar("googleEventId", { length: 255 }),
  caseId: int("caseId"),
  deadlineId: int("deadlineId"),
  status: mysqlEnum("status", ["success", "failed", "conflict", "skipped"]).default("success").notNull(),
  conflictType: mysqlEnum("conflictType", ["none", "modified_both", "deleted_both", "timestamp_mismatch"]),
  conflictResolution: mysqlEnum("conflictResolution", ["keep_google", "keep_system", "manual"]),
  errorMessage: text("errorMessage"),
  metadata: text("metadata"), // JSON string with additional details
  syncedAt: timestamp("syncedAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type SyncHistory = typeof syncHistory.$inferSelect;
export type InsertSyncHistory = typeof syncHistory.$inferInsert;

/**
 * Sync conflicts table - stores unresolved conflicts for manual review
 */
export const syncConflicts = mysqlTable("syncConflicts", {
  id: int("id").autoincrement().primaryKey(),
  integrationId: int("integrationId").notNull(),
  userId: int("userId").notNull(),
  googleEventId: varchar("googleEventId", { length: 255 }).notNull(),
  caseId: int("caseId"),
  deadlineId: int("deadlineId"),
  conflictType: mysqlEnum("conflictType", ["modified_both", "deleted_both", "timestamp_mismatch", "data_mismatch"]).notNull(),
  googleData: text("googleData").notNull(), // JSON string
  systemData: text("systemData").notNull(), // JSON string
  status: mysqlEnum("status", ["unresolved", "resolved", "ignored"]).default("unresolved").notNull(),
  resolution: mysqlEnum("resolution", ["keep_google", "keep_system", "merge", "manual"]),
  resolvedBy: int("resolvedBy"), // userId who resolved
  resolvedAt: timestamp("resolvedAt"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SyncConflict = typeof syncConflicts.$inferSelect;
export type InsertSyncConflict = typeof syncConflicts.$inferInsert;


/**
 * Court data table - stores information synchronized from court/tribunal webservices
 */
export const courtData = mysqlTable("courtData", {
  id: int("id").autoincrement().primaryKey(),
  caseId: int("caseId").notNull(),
  userId: int("userId").notNull(),
  // Court identification
  courtName: varchar("courtName", { length: 255 }),
  courtCode: varchar("courtCode", { length: 50 }),
  vara: varchar("vara", { length: 100 }),
  judge: varchar("judge", { length: 255 }),
  // Case status and details
  processStatus: mysqlEnum("processStatus", [
    "pending",
    "active",
    "suspended",
    "archived",
    "closed",
    "appealed",
    "unknown",
  ]).default("unknown").notNull(),
  lastMovement: text("lastMovement"),
  lastMovementDate: timestamp("lastMovementDate"),
  // Parties and representatives
  plaintiff: text("plaintiff"),
  defendant: text("defendant"),
  plaintiffLawyer: varchar("plaintiffLawyer", { length: 255 }),
  defendantLawyer: varchar("defendantLawyer", { length: 255 }),
  // Hearing information
  nextHearingDate: timestamp("nextHearingDate"),
  nextHearingLocation: varchar("nextHearingLocation", { length: 500 }),
  nextHearingType: varchar("nextHearingType", { length: 100 }),
  // Additional data
  courtMetadata: text("courtMetadata"), // JSON with additional court-specific data
  externalId: varchar("externalId", { length: 255 }).unique(), // ID from tribunal system
  // Sync tracking
  lastSyncAt: timestamp("lastSyncAt"),
  syncStatus: mysqlEnum("syncStatus", ["synced", "pending", "failed", "manual"]).default("manual").notNull(),
  syncErrorMessage: text("syncErrorMessage"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CourtData = typeof courtData.$inferSelect;
export type InsertCourtData = typeof courtData.$inferInsert;

/**
 * Tribunal sync configuration - stores credentials and settings for tribunal webservice integration
 */
export const tribunalSyncConfig = mysqlTable("tribunalSyncConfig", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  // Tribunal identification
  tribunalName: varchar("tribunalName", { length: 255 }).notNull(),
  tribunalCode: varchar("tribunalCode", { length: 50 }).notNull(),
  // API configuration
  apiUrl: varchar("apiUrl", { length: 500 }).notNull(),
  apiKey: varchar("apiKey", { length: 255 }), // Encrypted
  apiSecret: varchar("apiSecret", { length: 255 }), // Encrypted
  authMethod: mysqlEnum("authMethod", ["api_key", "oauth", "basic_auth", "custom"]).default("api_key").notNull(),
  // Sync settings
  isEnabled: boolean("isEnabled").default(true).notNull(),
  autoSyncEnabled: boolean("autoSyncEnabled").default(true).notNull(),
  syncIntervalMinutes: int("syncIntervalMinutes").default(360).notNull(), // Default 6 hours
  lastSyncAt: timestamp("lastSyncAt"),
  nextSyncAt: timestamp("nextSyncAt"),
  // Error tracking
  lastErrorAt: timestamp("lastErrorAt"),
  lastErrorMessage: text("lastErrorMessage"),
  consecutiveFailures: int("consecutiveFailures").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type TribunalSyncConfig = typeof tribunalSyncConfig.$inferSelect;
export type InsertTribunalSyncConfig = typeof tribunalSyncConfig.$inferInsert;

/**
 * Case interactions table - tracks all interactions and updates to a case
 */
export const caseInteractions = mysqlTable("caseInteractions", {
  id: int("id").autoincrement().primaryKey(),
  caseId: int("caseId").notNull(),
  userId: int("userId").notNull(),
  // Interaction details
  type: mysqlEnum("type", [
    "status_change",
    "deadline_added",
    "deadline_updated",
    "deadline_removed",
    "movement_added",
    "document_uploaded",
    "note_added",
    "client_contacted",
    "court_contacted",
    "hearing_scheduled",
    "hearing_completed",
    "appeal_filed",
    "settlement_proposed",
    "other",
  ]).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  // Related entities
  relatedDeadlineId: int("relatedDeadlineId"),
  relatedMovementId: int("relatedMovementId"),
  relatedDocumentId: int("relatedDocumentId"),
  // Metadata
  metadata: text("metadata"), // JSON with additional details
  attachments: text("attachments"), // JSON array of file URLs
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CaseInteraction = typeof caseInteractions.$inferSelect;
export type InsertCaseInteraction = typeof caseInteractions.$inferInsert;

/**
 * Audit log table - tracks all changes to cases for compliance and audit purposes
 */
export const auditLog = mysqlTable("auditLog", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  caseId: int("caseId"),
  // Action details
  action: varchar("action", { length: 100 }).notNull(), // e.g., "case_created", "case_updated", "document_uploaded"
  entityType: varchar("entityType", { length: 50 }).notNull(), // e.g., "case", "deadline", "document"
  entityId: int("entityId").notNull(),
  // Changes
  oldValues: text("oldValues"), // JSON with previous values
  newValues: text("newValues"), // JSON with new values
  changedFields: text("changedFields"), // JSON array of field names that changed
  // Context
  ipAddress: varchar("ipAddress", { length: 45 }),
  userAgent: text("userAgent"),
  metadata: text("metadata"), // JSON with additional context
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AuditLog = typeof auditLog.$inferSelect;
export type InsertAuditLog = typeof auditLog.$inferInsert;


/**
 * Tribunal Integration Monitoring - tracks health and status of tribunal APIs
 */
export const tribunalHealthCheck = mysqlTable('tribunalHealthCheck', {
  id: int('id').autoincrement().primaryKey(),
  tribunal: mysqlEnum('tribunal', ['tjsp', 'tjmg', 'tjms']).notNull(),
  status: mysqlEnum('status', ['healthy', 'degraded', 'down']).default('healthy').notNull(),
  responseTime: int('responseTime'), // milliseconds
  lastCheckAt: timestamp('lastCheckAt').notNull(),
  lastSuccessAt: timestamp('lastSuccessAt'),
  lastFailureAt: timestamp('lastFailureAt'),
  failureCount: int('failureCount').default(0),
  successCount: int('successCount').default(0),
  errorMessage: text('errorMessage'),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
  updatedAt: timestamp('updatedAt').defaultNow().onUpdateNow().notNull(),
});

export type TribunalHealthCheck = typeof tribunalHealthCheck.$inferSelect;
export type InsertTribunalHealthCheck = typeof tribunalHealthCheck.$inferInsert;

/**
 * Synchronization Metrics - tracks performance of tribunal data synchronizations
 */
export const syncMetrics = mysqlTable('syncMetrics', {
  id: int('id').autoincrement().primaryKey(),
  caseId: int('caseId').notNull(),
  userId: int('userId').notNull(),
  tribunal: mysqlEnum('tribunal', ['tjsp', 'tjmg', 'tjms']).notNull(),
  syncType: mysqlEnum('syncType', ['full', 'incremental', 'manual']).default('manual').notNull(),
  status: mysqlEnum('status', ['pending', 'in_progress', 'success', 'failed']).default('pending').notNull(),
  startTime: timestamp('startTime').notNull(),
  endTime: timestamp('endTime'),
  duration: int('duration'), // milliseconds
  recordsProcessed: int('recordsProcessed').default(0),
  recordsUpdated: int('recordsUpdated').default(0),
  recordsCreated: int('recordsCreated').default(0),
  recordsFailed: int('recordsFailed').default(0),
  errorMessage: text('errorMessage'),
  retryCount: int('retryCount').default(0),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
});

export type SyncMetrics = typeof syncMetrics.$inferSelect;
export type InsertSyncMetrics = typeof syncMetrics.$inferInsert;

/**
 * API Error Log - tracks errors from tribunal APIs for debugging
 */
export const apiErrorLog = mysqlTable('apiErrorLog', {
  id: int('id').autoincrement().primaryKey(),
  tribunal: mysqlEnum('tribunal', ['tjsp', 'tjmg', 'tjms']).notNull(),
  endpoint: varchar('endpoint', { length: 500 }).notNull(),
  method: varchar('method', { length: 10 }).notNull(), // GET, POST, etc
  statusCode: int('statusCode'),
  errorType: varchar('errorType', { length: 100 }).notNull(), // e.g., "TIMEOUT", "AUTH_FAILED", "RATE_LIMIT"
  errorMessage: text('errorMessage'),
  requestPayload: text('requestPayload'), // JSON
  responsePayload: text('responsePayload'), // JSON
  userId: int('userId'),
  caseId: int('caseId'),
  severity: mysqlEnum('severity', ['low', 'medium', 'high', 'critical']).default('medium').notNull(),
  resolved: boolean('resolved').default(false),
  resolvedAt: timestamp('resolvedAt'),
  resolvedBy: int('resolvedBy'),
  notes: text('notes'),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
});

export type ApiErrorLog = typeof apiErrorLog.$inferSelect;
export type InsertApiErrorLog = typeof apiErrorLog.$inferInsert;

/**
 * Integration Alerts - tracks alerts triggered by integration issues
 */
export const integrationAlerts = mysqlTable('integrationAlerts', {
  id: int('id').autoincrement().primaryKey(),
  tribunal: mysqlEnum('tribunal', ['tjsp', 'tjmg', 'tjms']).notNull(),
  alertType: mysqlEnum('alertType', ['health_check_failed', 'sync_failed', 'rate_limit_exceeded', 'auth_failed', 'timeout', 'high_error_rate']).notNull(),
  severity: mysqlEnum('severity', ['warning', 'error', 'critical']).default('error').notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  affectedCases: int('affectedCases').default(0),
  triggeredAt: timestamp('triggeredAt').notNull(),
  resolvedAt: timestamp('resolvedAt'),
  acknowledged: boolean('acknowledged').default(false),
  acknowledgedBy: int('acknowledgedBy'),
  acknowledgedAt: timestamp('acknowledgedAt'),
  metadata: text('metadata'), // JSON with additional context
  createdAt: timestamp('createdAt').defaultNow().notNull(),
});

export type IntegrationAlert = typeof integrationAlerts.$inferSelect;
export type InsertIntegrationAlert = typeof integrationAlerts.$inferInsert;

/**
 * Performance Report - aggregated performance metrics for reporting
 */
export const performanceReport = mysqlTable('performanceReport', {
  id: int('id').autoincrement().primaryKey(),
  tribunal: mysqlEnum('tribunal', ['tjsp', 'tjmg', 'tjms']).notNull(),
  reportDate: timestamp('reportDate').notNull(),
  period: mysqlEnum('period', ['daily', 'weekly', 'monthly']).notNull(),
  totalSyncs: int('totalSyncs').default(0),
  successfulSyncs: int('successfulSyncs').default(0),
  failedSyncs: int('failedSyncs').default(0),
  successRate: decimal('successRate', { precision: 5, scale: 2 }).default('0.00'), // percentage
  averageResponseTime: int('averageResponseTime'), // milliseconds
  minResponseTime: int('minResponseTime'),
  maxResponseTime: int('maxResponseTime'),
  totalRecordsProcessed: int('totalRecordsProcessed').default(0),
  totalErrors: int('totalErrors').default(0),
  uptime: decimal('uptime', { precision: 5, scale: 2 }).default('100.00'), // percentage
  notes: text('notes'),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
});

export type PerformanceReport = typeof performanceReport.$inferSelect;
export type InsertPerformanceReport = typeof performanceReport.$inferInsert;

/**
 * Integration Configuration - stores tribunal-specific API configuration
 */
export const integrationConfig = mysqlTable('integrationConfig', {
  id: int('id').autoincrement().primaryKey(),
  userId: int('userId').notNull(),
  tribunal: mysqlEnum('tribunal', ['tjsp', 'tjmg', 'tjms']).notNull(),
  isActive: boolean('isActive').default(true).notNull(),
  apiUrl: varchar('apiUrl', { length: 500 }).notNull(),
  authType: mysqlEnum('authType', ['certificate', 'api_key', 'oauth', 'basic_auth']).notNull(),
  credentials: text('credentials').notNull(), // JSON encrypted
  certificatePath: varchar('certificatePath', { length: 500 }), // for TJSP
  apiKey: varchar('apiKey', { length: 500 }), // for TJMG
  oauthClientId: varchar('oauthClientId', { length: 500 }), // for TJMS
  oauthClientSecret: varchar('oauthClientSecret', { length: 500 }), // for TJMS
  syncInterval: int('syncInterval').default(3600), // seconds
  retryAttempts: int('retryAttempts').default(3),
  retryDelay: int('retryDelay').default(5000), // milliseconds
  enableHealthCheck: boolean('enableHealthCheck').default(true),
  healthCheckInterval: int('healthCheckInterval').default(300), // seconds
  lastTestedAt: timestamp('lastTestedAt'),
  testStatus: mysqlEnum('testStatus', ['success', 'failed', 'not_tested']).default('not_tested'),
  testErrorMessage: text('testErrorMessage'),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
  updatedAt: timestamp('updatedAt').defaultNow().onUpdateNow().notNull(),
});

export type IntegrationConfig = typeof integrationConfig.$inferSelect;
export type InsertIntegrationConfig = typeof integrationConfig.$inferInsert;
