import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { googleCalendarService } from "./googleCalendarService";
import * as db from "./db";
import { TRPCError } from "@trpc/server";

export const googleCalendarRouter = router({
  /**
   * Get OAuth authorization URL
   */
  getAuthUrl: publicProcedure.query(() => {
    return {
      authUrl: googleCalendarService.getAuthUrl(),
    };
  }),

  /**
   * Exchange authorization code for tokens and create integration
   */
  connectCalendar: protectedProcedure
    .input(
      z.object({
        code: z.string(),
        calendarId: z.string().default("primary"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const tokens = await googleCalendarService.exchangeCodeForTokens(input.code);

        // Get calendar details
        const calendarDetails = await googleCalendarService.getCalendarDetails(
          tokens.access_token,
          input.calendarId
        );

        // Save integration to database
        await db.createGoogleCalendarIntegration({
          userId: ctx.user.id,
          googleAccountEmail: calendarDetails.summary || "",
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          tokenExpiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : undefined,
          calendarId: input.calendarId,
          isActive: true,
          syncDeadlines: true,
          syncMovements: true,
          syncHearings: true,
        });

        return {
          success: true,
          message: "Google Calendar conectado com sucesso!",
        };
      } catch (error) {
        console.error("[GoogleCalendarRouter] Failed to connect calendar:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Falha ao conectar Google Calendar",
        });
      }
    }),

  /**
   * Get current integration status
   */
  getIntegration: protectedProcedure.query(async ({ ctx }) => {
    const integration = await db.getGoogleCalendarIntegration(ctx.user.id);
    return integration || null;
  }),

  /**
   * Update integration preferences
   */
  updateIntegration: protectedProcedure
    .input(
      z.object({
        syncDeadlines: z.boolean().optional(),
        syncMovements: z.boolean().optional(),
        syncHearings: z.boolean().optional(),
        isActive: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await db.updateGoogleCalendarIntegration(ctx.user.id, input);
      return { success: true };
    }),

  /**
   * Sync a specific deadline to Google Calendar
   */
  syncDeadline: protectedProcedure
    .input(
      z.object({
        caseId: z.number(),
        deadlineId: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const integration = await db.getGoogleCalendarIntegration(ctx.user.id);
        if (!integration || !integration.isActive) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Google Calendar não está configurado",
          });
        }

        const deadline = await db.getDeadlineById(input.deadlineId);
        if (!deadline) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Prazo não encontrado",
          });
        }

        const caseData = await db.getCaseById(input.caseId);
        if (!caseData) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Processo não encontrado",
          });
        }

        // Check if event already exists
        const existingEvent = await db.getCaseCalendarEvents(input.caseId);
        const deadlineEvent = existingEvent.find((e) => e.deadlineId === input.deadlineId);

        let googleEvent;
        if (deadlineEvent) {
          // Update existing event
          googleEvent = await googleCalendarService.updateCalendarEvent(
            deadlineEvent.googleEventId,
            {
              title: deadline.title,
              dueDate: deadline.dueDate,
              caseTitle: caseData.title,
              description: deadline.description,
            },
            integration.accessToken,
            integration.calendarId
          );

          await db.updateCalendarEvent(deadlineEvent.googleEventId, {
            lastModifiedAt: new Date(),
          });
        } else {
          // Create new event
          googleEvent = await googleCalendarService.syncDeadlineToCalendar(
            ctx.user.id,
            input.caseId,
            {
              title: deadline.title,
              dueDate: deadline.dueDate,
              caseTitle: caseData.title,
              description: deadline.description,
            },
            integration.accessToken,
            integration.calendarId
          );

          await db.createCalendarEvent({
            integrationId: integration.id,
            caseId: input.caseId,
            deadlineId: input.deadlineId,
            googleEventId: googleEvent.id,
            eventType: "deadline",
            title: deadline.title,
            description: deadline.description,
            startTime: new Date(deadline.dueDate),
            isAllDay: false,
          });
        }

        return { success: true, googleEventId: googleEvent.id };
      } catch (error) {
        console.error("[GoogleCalendarRouter] Failed to sync deadline:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Falha ao sincronizar prazo com Google Calendar",
        });
      }
    }),

  /**
   * List calendar events for a case
   */
  getCaseEvents: protectedProcedure
    .input(z.object({ caseId: z.number() }))
    .query(async ({ input }) => {
      return await db.getCaseCalendarEvents(input.caseId);
    }),

  /**
   * List upcoming events from Google Calendar
   */
  getUpcomingEvents: protectedProcedure.query(async ({ ctx }) => {
    try {
      const integration = await db.getGoogleCalendarIntegration(ctx.user.id);
      if (!integration || !integration.isActive) {
        return [];
      }

      return await googleCalendarService.listUpcomingEvents(
        integration.accessToken,
        integration.calendarId,
        20
      );
    } catch (error) {
      console.error("[GoogleCalendarRouter] Failed to list events:", error);
      return [];
    }
  }),

  /**
   * Disconnect Google Calendar
   */
  disconnectCalendar: protectedProcedure.mutation(async ({ ctx }) => {
    await db.updateGoogleCalendarIntegration(ctx.user.id, {
      isActive: false,
    });
    return { success: true };
  }),
});
