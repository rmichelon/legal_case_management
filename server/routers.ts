import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { TRPCError } from "@trpc/server";
import { invokeLLM } from "./_core/llm";
import { storagePut } from "./storage";
import { nanoid } from "nanoid";
import { NotificationService } from "./notificationService";
import { wsManager } from "./websocket";
import { googleCalendarRouter } from "./googleCalendarRouter";
import { webhookRouter } from "./webhookRouter";
import { caseManagementRouter } from "./caseManagementRouter";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // ============ CLIENTS ROUTER ============
  clients: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return await db.getClientsByUserId(ctx.user.id);
    }),

    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const client = await db.getClientById(input.id);
        if (!client) throw new TRPCError({ code: "NOT_FOUND" });
        return client;
      }),

    create: protectedProcedure
      .input(z.object({
        name: z.string().min(1),
        email: z.string().email().optional(),
        phone: z.string().optional(),
        cpfCnpj: z.string().optional(),
        address: z.string().optional(),
        city: z.string().optional(),
        state: z.string().optional(),
        zipCode: z.string().optional(),
        type: z.enum(["person", "company"]).default("person"),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return await db.createClient({
          userId: ctx.user.id,
          ...input,
        });
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        email: z.string().email().optional(),
        phone: z.string().optional(),
        cpfCnpj: z.string().optional(),
        address: z.string().optional(),
        city: z.string().optional(),
        state: z.string().optional(),
        zipCode: z.string().optional(),
        type: z.enum(["person", "company"]).optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        return await db.updateClient(id, data);
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return await db.deleteClient(input.id);
      }),
  }),

  // ============ CASES ROUTER ============
  cases: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return await db.getCasesByUserId(ctx.user.id);
    }),

    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const caseData = await db.getCaseById(input.id);
        if (!caseData) throw new TRPCError({ code: "NOT_FOUND" });
        return caseData;
      }),

    create: protectedProcedure
      .input(z.object({
        caseNumber: z.string().min(1),
        title: z.string().min(1),
        description: z.string().optional(),
        caseType: z.string().min(1),
        court: z.string().min(1),
        judge: z.string().optional(),
        opposingParty: z.string().optional(),
        clientId: z.number(),
        fileNumber: z.string().optional(),
        filingDate: z.date().optional(),
        estimatedClosureDate: z.date().optional(),
        priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
      }))
      .mutation(async ({ ctx, input }) => {
        // Check if case number already exists
        const existing = await db.getCaseByCaseNumber(input.caseNumber);
        if (existing) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "Número do processo já existe",
          });
        }

        return await db.createCase({
          userId: ctx.user.id,
          status: "open",
          ...input,
        });
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().optional(),
        description: z.string().optional(),
        caseType: z.string().optional(),
        court: z.string().optional(),
        judge: z.string().optional(),
        opposingParty: z.string().optional(),
        clientId: z.number().optional(),
        status: z.enum(["open", "suspended", "closed", "archived"]).optional(),
        priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
        estimatedClosureDate: z.date().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        return await db.updateCase(id, data);
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return await db.deleteCase(input.id);
      }),

    search: protectedProcedure
      .input(z.object({ query: z.string() }))
      .query(async ({ ctx, input }) => {
        return await db.searchCases(ctx.user.id, input.query);
      }),
  }),

  // ============ DEADLINES ROUTER ============
  deadlines: router({
    listByCase: protectedProcedure
      .input(z.object({ caseId: z.number() }))
      .query(async ({ input }) => {
        return await db.getDeadlinesByCaseId(input.caseId);
      }),

    upcoming: protectedProcedure
      .input(z.object({ daysAhead: z.number().default(30) }))
      .query(async ({ ctx, input }) => {
        return await db.getUpcomingDeadlinesByUserId(ctx.user.id, input.daysAhead);
      }),

    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const deadline = await db.getDeadlineById(input.id);
        if (!deadline) throw new TRPCError({ code: "NOT_FOUND" });
        return deadline;
      }),

    create: protectedProcedure
      .input(z.object({
        caseId: z.number(),
        title: z.string().min(1),
        description: z.string().optional(),
        dueDate: z.date(),
        type: z.enum(["hearing", "filing", "response", "appeal", "payment", "other"]).default("other"),
      }))
      .mutation(async ({ input }) => {
        return await db.createDeadline({
          ...input,
          status: "pending",
          alertSent: false,
        });
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().optional(),
        description: z.string().optional(),
        dueDate: z.date().optional(),
        type: z.enum(["hearing", "filing", "response", "appeal", "payment", "other"]).optional(),
        status: z.enum(["pending", "completed", "overdue", "cancelled"]).optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        return await db.updateDeadline(id, data);
      }),
  }),

  // ============ DOCUMENTS ROUTER ============
  documents: router({
    listByCase: protectedProcedure
      .input(z.object({ caseId: z.number() }))
      .query(async ({ input }) => {
        return await db.getDocumentsByCaseId(input.caseId);
      }),

    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const doc = await db.getDocumentById(input.id);
        if (!doc) throw new TRPCError({ code: "NOT_FOUND" });
        return doc;
      }),

    upload: protectedProcedure
      .input(z.object({
        caseId: z.number(),
        name: z.string().min(1),
        description: z.string().optional(),
        documentType: z.string().optional(),
        file: z.instanceof(Buffer),
        mimeType: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        const fileKey = `cases/${input.caseId}/documents/${nanoid()}-${input.name}`;
        const { url } = await storagePut(fileKey, input.file, input.mimeType);

        return await db.createDocument({
          caseId: input.caseId,
          name: input.name,
          description: input.description,
          documentType: input.documentType,
          fileKey,
          fileUrl: url,
          mimeType: input.mimeType,
          fileSize: input.file.length,
          uploadedBy: ctx.user.id,
        });
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return await db.deleteDocument(input.id);
      }),
  }),

  // ============ MOVEMENTS ROUTER ============
  movements: router({
    listByCase: protectedProcedure
      .input(z.object({ caseId: z.number() }))
      .query(async ({ input }) => {
        return await db.getMovementsByCaseId(input.caseId);
      }),

    create: protectedProcedure
      .input(z.object({
        caseId: z.number(),
        title: z.string().min(1),
        description: z.string().optional(),
        type: z.string().min(1),
        date: z.date(),
      }))
      .mutation(async ({ input }) => {
        return await db.createMovement(input);
      }),
  }),

  // ============ CHAT ROUTER ============
  chat: router({
    sendMessage: protectedProcedure
      .input(z.object({
        caseId: z.number().optional(),
        topic: z.string(),
        userMessage: z.string().min(1),
        conversationHistory: z.array(z.object({
          role: z.enum(["user", "assistant"]),
          content: z.string(),
        })).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        try {
          // Build system prompt based on topic
          let systemPrompt = "Você é um assistente jurídico inteligente especializado em direito brasileiro. ";
          
          if (input.topic === "petition_draft") {
            systemPrompt += "Ajude o advogado a redigir petições jurídicas claras, precisas e bem fundamentadas. ";
          } else if (input.topic === "document_analysis") {
            systemPrompt += "Analise documentos jurídicos e forneça insights sobre pontos importantes, riscos e oportunidades. ";
          } else if (input.topic === "jurisprudence") {
            systemPrompt += "Sugira jurisprudência relevante e precedentes que possam apoiar o caso. ";
          }

          systemPrompt += "Seja conciso, profissional e sempre cite fontes quando possível.";

          // Build messages array
          const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
            { role: "system", content: systemPrompt },
          ];

          if (input.conversationHistory) {
            messages.push(...input.conversationHistory);
          }

          messages.push({ role: "user", content: input.userMessage });

          // Call LLM
          const response = await invokeLLM({
            messages: messages as any,
          });

          const assistantMessage = response.choices[0]?.message?.content || "";

          // Save to chat history
          const allMessages = [
            ...(input.conversationHistory || []),
            { role: "user", content: input.userMessage },
            { role: "assistant", content: assistantMessage },
          ];

          await db.createChatHistory({
            userId: ctx.user.id,
            caseId: input.caseId,
            topic: input.topic,
            messages: JSON.stringify(allMessages),
          });

          return {
            message: assistantMessage,
            conversationHistory: allMessages,
          };
        } catch (error) {
          console.error("Chat error:", error);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Erro ao processar mensagem",
          });
        }
      }),

    getHistory: protectedProcedure
      .input(z.object({ limit: z.number().default(10) }))
      .query(async ({ ctx, input }) => {
        return await db.getChatHistoryByUserId(ctx.user.id, input.limit);
      }),
  }),

  // ============ NOTIFICATIONS ROUTER ============
  notifications: router({
    list: protectedProcedure
      .input(z.object({ limit: z.number().default(20) }))
      .query(async ({ ctx, input }) => {
        return await db.getNotificationsByUserId(ctx.user.id, input.limit);
      }),

    unread: protectedProcedure.query(async ({ ctx }) => {
      return await db.getUnreadNotificationsByUserId(ctx.user.id);
    }),

    markAsRead: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.markNotificationAsRead(input.id);
        return { success: true };
      }),

    markAllAsRead: protectedProcedure.mutation(async ({ ctx }) => {
      await db.markAllNotificationsAsRead(ctx.user.id);
      return { success: true };
    }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteNotification(input.id);
        return { success: true };
      }),

    getPreferences: protectedProcedure.query(async ({ ctx }) => {
      let prefs = await db.getNotificationPreferencesByUserId(ctx.user.id);
      if (!prefs) {
        // Create default preferences if not exists
        await db.createNotificationPreferences({
          userId: ctx.user.id,
          deadlineAlerts: true,
          caseUpdates: true,
          newMovements: true,
          documentUploads: true,
          emailNotifications: true,
          pushNotifications: true,
          daysBeforeDeadline: 3,
        });
        prefs = await db.getNotificationPreferencesByUserId(ctx.user.id);
      }
      return prefs;
    }),

    updatePreferences: protectedProcedure
      .input(z.object({
        deadlineAlerts: z.boolean().optional(),
        caseUpdates: z.boolean().optional(),
        newMovements: z.boolean().optional(),
        documentUploads: z.boolean().optional(),
        emailNotifications: z.boolean().optional(),
        pushNotifications: z.boolean().optional(),
        daysBeforeDeadline: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.updateNotificationPreferences(ctx.user.id, input);
        return { success: true };
      }),

    getWebSocketStatus: protectedProcedure.query(async ({ ctx }) => {
      return {
        connected: NotificationService.isUserConnected(ctx.user.id),
        connectedUsers: NotificationService.getConnectedUsersCount(),
      };
    }),

    testNotification: protectedProcedure
      .input(z.object({
        title: z.string(),
        message: z.string(),
        type: z.enum(["deadline_alert", "case_update", "new_movement", "document_uploaded", "system"]),
        priority: z.enum(["low", "medium", "high", "urgent"]),
      }))
      .mutation(async ({ ctx, input }) => {
        return await NotificationService.createAndBroadcast(ctx.user.id, input);
       }),
  }),

  googleCalendar: googleCalendarRouter,
  webhook: webhookRouter,
  caseManagement: caseManagementRouter,
});
export type AppRouter = typeof appRouter;
