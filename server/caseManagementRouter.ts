import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import * as db from "./db";
import { TRPCError } from "@trpc/server";
import { createTribunalService } from "./tribunalService";

export const caseManagementRouter = router({
  /**
   * Get case details with court data
   */
  getCaseWithCourtData: protectedProcedure
    .input(z.object({ caseId: z.number() }))
    .query(async ({ ctx, input }) => {
      const caseData = await db.getCaseById(input.caseId);
      if (!caseData || caseData.userId !== ctx.user.id) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Processo não encontrado",
        });
      }

      const courtData = await db.getCourtDataByCase(input.caseId);
      const interactions = await db.getCaseInteractionsByCaseId(input.caseId, 20);

      return {
        case: caseData,
        courtData,
        interactions,
      };
    }),

  /**
   * Sync case data from tribunal webservice
   */
  syncCaseFromTribunal: protectedProcedure
    .input(
      z.object({
        caseId: z.number(),
        processNumber: z.string(),
        tribunalConfigId: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // Get case
        const caseData = await db.getCaseById(input.caseId);
        if (!caseData || caseData.userId !== ctx.user.id) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Processo não encontrado",
          });
        }

        // Get tribunal config (or use default)
        // TODO: implement getTribunalSyncConfigById
        let tribunalConfig: any = null;

        // For now, use dummy config
        // TODO: implement proper tribunal config

        // Create tribunal service with dummy config
        const tribunalService = createTribunalService(
          "https://api.tribunal.example.com",
          "api_key",
          "dummy-key"
        );

        // Sync data
        const syncedData = await tribunalService.syncCaseData(input.processNumber);

        // Save court data
        const courtDataToSave: any = {
          caseId: input.caseId,
          userId: ctx.user.id,
          ...syncedData,
          syncStatus: "synced",
          lastSyncAt: new Date(),
        };
        // Ensure processStatus is valid
        if (courtDataToSave.processStatus && !["closed", "suspended", "archived", "pending", "active", "appealed", "unknown"].includes(courtDataToSave.processStatus)) {
          courtDataToSave.processStatus = "unknown";
        }
        await db.createOrUpdateCourtData(courtDataToSave);

        // Create interaction log
        await db.createCaseInteraction({
          caseId: input.caseId,
          userId: ctx.user.id,
          type: "status_change",
          title: "Sincronização com Tribunal",
          description: `Dados sincronizados do tribunal. Status: ${syncedData.processStatus}`,
          metadata: JSON.stringify(syncedData),
        });

        // Create audit log
        await db.createAuditLog({
          userId: ctx.user.id,
          caseId: input.caseId,
          action: "case_synced_from_tribunal",
          entityType: "case",
          entityId: input.caseId,
          newValues: JSON.stringify(syncedData),
        });

        // TODO: implement tribunal config update

        return {
          success: true,
          data: syncedData,
        };
      } catch (error: any) {
        console.error("[CaseManagementRouter] Error syncing case:", error);

        // Log error in tribunal config
        // TODO: implement error logging for tribunal config

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Erro ao sincronizar: ${error.message}`,
        });
      }
    }),

  /**
   * Update case with new information
   */
  updateCase: protectedProcedure
    .input(
      z.object({
        caseId: z.number(),
        updates: z.object({
          title: z.string().optional(),
          description: z.string().optional(),
          status: z.enum(["open", "closed", "suspended", "archived"]).optional(),
          notes: z.string().optional(),
        }),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // Get case
        const caseData = await db.getCaseById(input.caseId);
        if (!caseData || caseData.userId !== ctx.user.id) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Processo não encontrado",
          });
        }

        // Store old values for audit
        const oldValues = {
          title: caseData.title,
          description: caseData.description,
          status: caseData.status,
        };

        // Update case
        const updateData: any = {};
        if (input.updates.title) updateData.title = input.updates.title;
        if (input.updates.description) updateData.description = input.updates.description;
        if (input.updates.status) updateData.status = input.updates.status;
        updateData.updatedAt = new Date();
        await db.updateCase(input.caseId, updateData);

        // Create interaction log
        await db.createCaseInteraction({
          caseId: input.caseId,
          userId: ctx.user.id,
          type: "status_change",
          title: "Processo Atualizado",
          description: `Informações do processo foram atualizadas`,
          metadata: JSON.stringify(input.updates),
        });

        // Create audit log
        const changedFields = Object.keys(input.updates).filter(
          (key) => oldValues[key as keyof typeof oldValues] !== input.updates[key as keyof typeof input.updates]
        );

        await db.createAuditLog({
          userId: ctx.user.id,
          caseId: input.caseId,
          action: "case_updated",
          entityType: "case",
          entityId: input.caseId,
          oldValues: JSON.stringify(oldValues),
          newValues: JSON.stringify(input.updates),
          changedFields: JSON.stringify(changedFields),
        });

        return { success: true };
      } catch (error: any) {
        console.error("[CaseManagementRouter] Error updating case:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Erro ao atualizar processo: ${error.message}`,
        });
      }
    }),

  /**
   * Get case interaction history
   */
  getCaseInteractions: protectedProcedure
    .input(
      z.object({
        caseId: z.number(),
        limit: z.number().default(50),
      })
    )
    .query(async ({ ctx, input }) => {
      const caseData = await db.getCaseById(input.caseId);
      if (!caseData || caseData.userId !== ctx.user.id) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Processo não encontrado",
        });
      }

      return await db.getCaseInteractionsByCaseId(input.caseId, input.limit);
    }),

  /**
   * Get audit log for case
   */
  getCaseAuditLog: protectedProcedure
    .input(
      z.object({
        caseId: z.number(),
        limit: z.number().default(100),
      })
    )
    .query(async ({ ctx, input }) => {
      const caseData = await db.getCaseById(input.caseId);
      if (!caseData || caseData.userId !== ctx.user.id) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Processo não encontrado",
        });
      }

      return await db.getAuditLogByCaseId(input.caseId, input.limit);
    }),

  /**
   * Setup tribunal sync configuration
   */
  setupTribunalSync: protectedProcedure
    .input(
      z.object({
        tribunalName: z.string(),
        tribunalCode: z.string(),
        apiUrl: z.string().url(),
        authMethod: z.enum(["api_key", "oauth", "basic_auth", "custom"]),
        apiKey: z.string().optional(),
        apiSecret: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // Test connection
        const tribunalService = createTribunalService(
          input.apiUrl,
          input.authMethod,
          input.apiKey,
          input.apiSecret
        );

        const isConnected = await tribunalService.testConnection();
        if (!isConnected) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Não foi possível conectar ao tribunal. Verifique as credenciais.",
          });
        }

        // Save configuration
        await db.createTribunalSyncConfig({
          userId: ctx.user.id,
          tribunalName: input.tribunalName,
          tribunalCode: input.tribunalCode,
          apiUrl: input.apiUrl,
          authMethod: input.authMethod,
          apiKey: input.apiKey,
          apiSecret: input.apiSecret,
        });

        return { success: true };
      } catch (error: any) {
        console.error("[CaseManagementRouter] Error setting up tribunal sync:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Erro ao configurar sincronização: ${error.message}`,
        });
      }
    }),
});
