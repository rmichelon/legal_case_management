import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import * as db from "./db";
import { TRPCError } from "@trpc/server";
import { setupWebhookSubscription, renewWebhookSubscription } from "./webhookHandler";

export const webhookRouter = router({
  /**
   * Setup webhook for calendar synchronization
   */
  setupWebhook: protectedProcedure
    .input(
      z.object({
        integrationId: z.number(),
        webhookUrl: z.string().url(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const integration = await db.getGoogleCalendarIntegrationById(input.integrationId);
        if (!integration) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Integração não encontrada",
          });
        }

        if (integration.userId !== ctx.user.id) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Acesso negado",
          });
        }

        const result = await setupWebhookSubscription(
          input.integrationId,
          ctx.user.id,
          integration.accessToken,
          integration.calendarId,
          input.webhookUrl
        );

        return result;
      } catch (error) {
        console.error("[WebhookRouter] Error setting up webhook:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao configurar webhook",
        });
      }
    }),

  /**
   * Get sync history for an integration
   */
  getSyncHistory: protectedProcedure
    .input(
      z.object({
        integrationId: z.number(),
        limit: z.number().default(50),
      })
    )
    .query(async ({ ctx, input }) => {
      const integration = await db.getGoogleCalendarIntegrationById(input.integrationId);
      if (!integration || integration.userId !== ctx.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Acesso negado",
        });
      }

      return await db.getSyncHistoryByIntegration(input.integrationId, input.limit);
    }),

  /**
   * Get unresolved sync conflicts
   */
  getConflicts: protectedProcedure.query(async ({ ctx }) => {
    return await db.getUnresolvedConflicts(ctx.user.id);
  }),

  /**
   * Resolve a sync conflict
   */
  resolveConflict: protectedProcedure
    .input(
      z.object({
        conflictId: z.number(),
        resolution: z.enum(["keep_google", "keep_system", "merge", "manual"]),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // Get conflict
        const conflict = await db.getSyncConflictById(input.conflictId);
        if (!conflict) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Conflito não encontrado",
          });
        }

        if (conflict.userId !== ctx.user.id) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Acesso negado",
          });
        }

        // Update conflict
        await db.updateSyncConflict(input.conflictId, {
          status: "resolved",
          resolution: input.resolution,
          resolvedBy: ctx.user.id,
          resolvedAt: new Date(),
          notes: input.notes,
        });

        // TODO: Apply resolution based on type
        // - keep_google: Update system event with Google data
        // - keep_system: Update Google event with system data
        // - merge: Merge both versions
        // - manual: Mark for manual review

        return { success: true };
      } catch (error) {
        console.error("[WebhookRouter] Error resolving conflict:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao resolver conflito",
        });
      }
    }),

  /**
   * Get sync statistics
   */
  getSyncStats: protectedProcedure
    .input(z.object({ integrationId: z.number() }))
    .query(async ({ ctx, input }) => {
      const integration = await db.getGoogleCalendarIntegrationById(input.integrationId);
      if (!integration || integration.userId !== ctx.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Acesso negado",
        });
      }

      const history = await db.getSyncHistoryByIntegration(input.integrationId, 1000);

      const stats = {
        totalSyncs: history.length,
        successful: history.filter((h) => h.status === "success").length,
        failed: history.filter((h) => h.status === "failed").length,
        conflicts: history.filter((h) => h.status === "conflict").length,
        skipped: history.filter((h) => h.status === "skipped").length,
        lastSync: history.length > 0 ? history[0].syncedAt : null,
      };

      return stats;
    }),
});
