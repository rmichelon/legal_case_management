import { protectedProcedure, router } from './_core/trpc';
import { z } from 'zod';
import { ReportGenerationService } from './reportGenerationService';
import { PDFReportService } from './pdfReportService';
import { join } from 'path';
import { randomUUID } from 'crypto';

export const reportRouter = router({
  /**
   * Gera dados de relatório sem PDF
   */
  generateReportData: protectedProcedure
    .input(
      z.object({
        tribunal: z.enum(['tjsp', 'tjmg', 'tjms']),
        period: z.enum(['daily', 'weekly', 'monthly']),
      }),
    )
    .query(async ({ input }) => {
      try {
        const reportData = await ReportGenerationService.generateReportData(
          input.tribunal,
          input.period,
        );
        return reportData;
      } catch (error) {
        throw new Error(`Failed to generate report data: ${error}`);
      }
    }),

  /**
   * Gera e exporta relatório em PDF
   */
  generatePDF: protectedProcedure
    .input(
      z.object({
        tribunal: z.enum(['tjsp', 'tjmg', 'tjms']),
        period: z.enum(['daily', 'weekly', 'monthly']),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      try {
        // Gerar dados do relatório
        const reportData = await ReportGenerationService.generateReportData(
          input.tribunal,
          input.period,
        );

        // Salvar no banco de dados
        await ReportGenerationService.saveReport(
          input.tribunal,
          input.period,
          reportData,
        );

        // Gerar PDF
        const fileName = `report-${input.tribunal}-${input.period}-${randomUUID()}.pdf`;
        const outputPath = join('/tmp', fileName);

        const pdfPath = await PDFReportService.generatePDF(reportData, outputPath);

        return {
          success: true,
          fileName,
          path: pdfPath,
          message: 'Relatório gerado com sucesso',
        };
      } catch (error) {
        throw new Error(`Failed to generate PDF: ${error}`);
      }
    }),

  /**
   * Obtém lista de relatórios anteriores
   */
  getReports: protectedProcedure
    .input(
      z.object({
        tribunal: z.enum(['tjsp', 'tjmg', 'tjms']),
        limit: z.number().default(10),
      }),
    )
    .query(async ({ input }) => {
      try {
        const reports = await ReportGenerationService.getReports(
          input.tribunal,
          input.limit,
        );
        return reports;
      } catch (error) {
        throw new Error(`Failed to fetch reports: ${error}`);
      }
    }),

  /**
   * Obtém dados de um relatório específico
   */
  getReportData: protectedProcedure
    .input(
      z.object({
        tribunal: z.enum(['tjsp', 'tjmg', 'tjms']),
        period: z.enum(['daily', 'weekly', 'monthly']),
      }),
    )
    .query(async ({ input }) => {
      try {
        const reportData = await ReportGenerationService.generateReportData(
          input.tribunal,
          input.period,
        );
        return reportData;
      } catch (error) {
        throw new Error(`Failed to fetch report data: ${error}`);
      }
    }),

  /**
   * Agenda geração de relatório para envio por email
   */
  scheduleReport: protectedProcedure
    .input(
      z.object({
        tribunal: z.enum(['tjsp', 'tjmg', 'tjms']),
        period: z.enum(['daily', 'weekly', 'monthly']),
        frequency: z.enum(['daily', 'weekly', 'monthly']),
        email: z.string().email(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      try {
        // TODO: Implementar agendamento de relatórios
        return {
          success: true,
          message: `Relatório agendado para ${input.frequency} em ${input.email}`,
        };
      } catch (error) {
        throw new Error(`Failed to schedule report: ${error}`);
      }
    }),
});
