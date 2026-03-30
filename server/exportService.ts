import { PDFDocument, PDFPage, rgb } from "pdf-lib";
import ExcelJS from "exceljs";
import { CaseItem } from "@/types";

interface CaseExportData {
  id: number;
  caseNumber: string;
  title: string;
  description?: string | null;
  caseType: string;
  court: string;
  judge?: string | null;
  opposingParty?: string | null;
  status: string;
  priority: string;
  createdAt: Date;
  updatedAt: Date;
}

export class ExportService {
  /**
   * Exporta processos para PDF
   */
  static async exportToPDF(cases: CaseExportData[], filename: string = "processos.pdf"): Promise<Buffer> {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595, 842]); // A4
    const { height } = page.getSize();
    let yPosition = height - 50;

    // Título
    page.drawText("Relatório de Processos Judiciais", {
      x: 50,
      y: yPosition,
      size: 18,
      color: rgb(0.2, 0.2, 0.8),
    });
    yPosition -= 30;

    // Data do relatório
    page.drawText(`Data: ${new Date().toLocaleDateString("pt-BR")}`, {
      x: 50,
      y: yPosition,
      size: 10,
      color: rgb(0.5, 0.5, 0.5),
    });
    yPosition -= 20;

    // Total de processos
    page.drawText(`Total de processos: ${cases.length}`, {
      x: 50,
      y: yPosition,
      size: 11,
      color: rgb(0, 0, 0),
    });
    yPosition -= 25;

    // Tabela de processos
    for (const caseItem of cases) {
      if (yPosition < 100) {
        // Próxima página se necessário
        yPosition = height - 50;
        pdfDoc.addPage([595, 842]);
      }

      // Número do processo
      page.drawText(`Nº: ${caseItem.caseNumber}`, {
        x: 50,
        y: yPosition,
        size: 11,
        color: rgb(0, 0, 0),
      });
      yPosition -= 15;

      // Título
      page.drawText(`Título: ${caseItem.title}`, {
        x: 50,
        y: yPosition,
        size: 10,
        color: rgb(0.2, 0.2, 0.2),
      });
      yPosition -= 12;

      // Tribunal
      page.drawText(`Tribunal: ${caseItem.court}`, {
        x: 50,
        y: yPosition,
        size: 9,
        color: rgb(0.3, 0.3, 0.3),
      });
      yPosition -= 12;

      // Status
      const statusColor = this.getStatusColor(caseItem.status);
      page.drawText(`Status: ${caseItem.status}`, {
        x: 50,
        y: yPosition,
        size: 9,
        color: statusColor,
      });
      yPosition -= 12;

      // Prioridade
      page.drawText(`Prioridade: ${caseItem.priority}`, {
        x: 50,
        y: yPosition,
        size: 9,
        color: rgb(0.3, 0.3, 0.3),
      });
      yPosition -= 12;

      // Data de atualização
      page.drawText(`Última atualização: ${new Date(caseItem.updatedAt).toLocaleDateString("pt-BR")}`, {
        x: 50,
        y: yPosition,
        size: 8,
        color: rgb(0.5, 0.5, 0.5),
      });
      yPosition -= 20;

      // Linha separadora
      page.drawLine({
        start: { x: 50, y: yPosition },
        end: { x: 545, y: yPosition },
        color: rgb(0.8, 0.8, 0.8),
      });
      yPosition -= 10;
    }

    return Buffer.from(await pdfDoc.save());
  }

  /**
   * Exporta processos para Excel
   */
  static async exportToExcel(cases: CaseExportData[], filename: string = "processos.xlsx"): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Processos");

    // Configurar colunas
    worksheet.columns = [
      { header: "Nº Processo", key: "caseNumber", width: 15 },
      { header: "Título", key: "title", width: 30 },
      { header: "Tipo", key: "caseType", width: 15 },
      { header: "Tribunal", key: "court", width: 20 },
      { header: "Juiz", key: "judge", width: 20 },
      { header: "Parte Contrária", key: "opposingParty", width: 20 },
      { header: "Status", key: "status", width: 12 },
      { header: "Prioridade", key: "priority", width: 12 },
      { header: "Criado em", key: "createdAt", width: 15 },
      { header: "Atualizado em", key: "updatedAt", width: 15 },
    ];

    // Estilizar cabeçalho
    worksheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
    worksheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF1F4E78" },
    };
    worksheet.getRow(1).alignment = { horizontal: "center", vertical: "center" };

    // Adicionar dados
    cases.forEach((caseItem) => {
      worksheet.addRow({
        caseNumber: caseItem.caseNumber,
        title: caseItem.title,
        caseType: caseItem.caseType,
        court: caseItem.court,
        judge: caseItem.judge || "-",
        opposingParty: caseItem.opposingParty || "-",
        status: caseItem.status,
        priority: caseItem.priority,
        createdAt: new Date(caseItem.createdAt).toLocaleDateString("pt-BR"),
        updatedAt: new Date(caseItem.updatedAt).toLocaleDateString("pt-BR"),
      });
    });

    // Aplicar filtros
    worksheet.autoFilter.from = "A1";
    worksheet.autoFilter.to = `J${cases.length + 1}`;

    // Congelar primeira linha
    worksheet.views = [{ state: "frozen", ySplit: 1 }];

    // Centralizar colunas de status e prioridade
    worksheet.getColumn("G").alignment = { horizontal: "center" };
    worksheet.getColumn("H").alignment = { horizontal: "center" };

    return Buffer.from(await workbook.xlsx.writeBuffer());
  }

  /**
   * Retorna cor RGB baseada no status
   */
  private static getStatusColor(status: string): { red: number; green: number; blue: number } {
    const colors: Record<string, { red: number; green: number; blue: number }> = {
      open: rgb(0, 0.5, 0), // Verde
      suspended: rgb(1, 0.65, 0), // Laranja
      closed: rgb(0.5, 0.5, 0.5), // Cinza
      archived: rgb(0.3, 0.3, 0.3), // Cinza escuro
    };
    return colors[status] || rgb(0, 0, 0);
  }
}
