import { ReportData } from './reportGenerationService';

/**
 * Serviço para gerar relatórios em PDF usando ReportLab
 * Este serviço será chamado via Python subprocess
 */
export class PDFReportService {
  /**
   * Gera um script Python para criar PDF com ReportLab
   */
  static generatePythonScript(reportData: ReportData, outputPath: string): string {
    const pythonScript = `
import json
from datetime import datetime
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, PageBreak, Image
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
import matplotlib.pyplot as plt
import matplotlib.dates as mdates
from io import BytesIO
import base64

# Dados do relatório
report_data = ${JSON.stringify(reportData)}

# Configuração do documento
doc = SimpleDocTemplate("${outputPath}", pagesize=A4, topMargin=0.5*inch, bottomMargin=0.5*inch)
elements = []
styles = getSampleStyleSheet()

# Estilos customizados
title_style = ParagraphStyle(
    'CustomTitle',
    parent=styles['Heading1'],
    fontSize=24,
    textColor=colors.HexColor('#E91E63'),
    spaceAfter=30,
    alignment=TA_CENTER,
    fontName='Helvetica-Bold'
)

heading_style = ParagraphStyle(
    'CustomHeading',
    parent=styles['Heading2'],
    fontSize=14,
    textColor=colors.HexColor('#333333'),
    spaceAfter=12,
    spaceBefore=12,
    fontName='Helvetica-Bold'
)

# Título
title = Paragraph(f"Relatório de Performance - {report_data['tribunal'].upper()}", title_style)
elements.append(title)

# Período
period_text = f"Período: {report_data['startDate']} a {report_data['endDate']}"
elements.append(Paragraph(period_text, styles['Normal']))
elements.append(Spacer(1, 0.2*inch))

# Resumo Executivo
elements.append(Paragraph("Resumo Executivo", heading_style))

summary_data = [
    ['Métrica', 'Valor'],
    ['Total de Sincronizações', str(report_data['totalSyncs'])],
    ['Sincronizações Bem-sucedidas', str(report_data['successfulSyncs'])],
    ['Sincronizações Falhadas', str(report_data['failedSyncs'])],
    ['Taxa de Sucesso', f"{report_data['successRate']:.2f}%"],
    ['Tempo Médio de Resposta', f"{report_data['averageResponseTime']:.0f}ms"],
    ['Tempo Mínimo', f"{report_data['minResponseTime']:.0f}ms"],
    ['Tempo Máximo', f"{report_data['maxResponseTime']:.0f}ms"],
    ['Registros Processados', str(report_data['totalRecordsProcessed'])],
    ['Total de Erros', str(report_data['totalErrors'])],
    ['Uptime', f"{report_data['uptime']:.2f}%"],
]

summary_table = Table(summary_data, colWidths=[3*inch, 2*inch])
summary_table.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#E91E63')),
    ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
    ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
    ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
    ('FONTSIZE', (0, 0), (-1, 0), 12),
    ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
    ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
    ('GRID', (0, 0), (-1, -1), 1, colors.black),
    ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
    ('FONTSIZE', (0, 1), (-1, -1), 10),
]))

elements.append(summary_table)
elements.append(Spacer(1, 0.3*inch))

# Gráfico de Taxa de Sucesso
elements.append(Paragraph("Taxa de Sucesso", heading_style))

fig, ax = plt.subplots(figsize=(6, 3))
sizes = [report_data['successfulSyncs'], report_data['failedSyncs']]
labels = ['Bem-sucedidas', 'Falhadas']
colors_pie = ['#4CAF50', '#F44336']
ax.pie(sizes, labels=labels, autopct='%1.1f%%', colors=colors_pie, startangle=90)
ax.set_title('Distribuição de Sincronizações')

img_buffer = BytesIO()
plt.savefig(img_buffer, format='png', dpi=100, bbox_inches='tight')
img_buffer.seek(0)
plt.close()

from reportlab.platypus import Image as RLImage
img = RLImage(img_buffer, width=5*inch, height=3*inch)
elements.append(img)
elements.append(Spacer(1, 0.2*inch))

# Gráfico de Tempo de Resposta
elements.append(Paragraph("Tempo de Resposta por Hora", heading_style))

fig, ax = plt.subplots(figsize=(6, 3))
hours = [m['hour'] for m in report_data['hourlyMetrics']]
times = [m['avgResponseTime'] for m in report_data['hourlyMetrics']]
ax.bar(hours, times, color='#2196F3')
ax.set_xlabel('Hora')
ax.set_ylabel('Tempo (ms)')
ax.set_title('Tempo Médio de Resposta por Hora')
ax.tick_params(axis='x', rotation=45)

img_buffer = BytesIO()
plt.savefig(img_buffer, format='png', dpi=100, bbox_inches='tight')
img_buffer.seek(0)
plt.close()

img = RLImage(img_buffer, width=5*inch, height=3*inch)
elements.append(img)
elements.append(Spacer(1, 0.2*inch))

# Página 2 - Detalhes
elements.append(PageBreak())

# Métricas Diárias
elements.append(Paragraph("Métricas Diárias", heading_style))

daily_data = [['Data', 'Total', 'Sucesso', 'Falhas', 'Tempo Médio (ms)']]
for metric in report_data['dailyMetrics']:
    daily_data.append([
        metric['date'],
        str(metric['syncs']),
        str(metric['success']),
        str(metric['failed']),
        f"{metric['avgResponseTime']:.0f}"
    ])

daily_table = Table(daily_data, colWidths=[1.2*inch, 0.8*inch, 0.8*inch, 0.8*inch, 1.2*inch])
daily_table.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#E91E63')),
    ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
    ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
    ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
    ('FONTSIZE', (0, 0), (-1, 0), 10),
    ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
    ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
    ('GRID', (0, 0), (-1, -1), 1, colors.black),
    ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
    ('FONTSIZE', (0, 1), (-1, -1), 9),
]))

elements.append(daily_table)
elements.append(Spacer(1, 0.3*inch))

# Top Errors
elements.append(Paragraph("Erros Mais Comuns", heading_style))

errors_data = [['Erro', 'Ocorrências']]
for error in report_data['topErrors']:
    errors_data.append([error['error'][:50], str(error['count'])])

errors_table = Table(errors_data, colWidths=[4*inch, 1*inch])
errors_table.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#E91E63')),
    ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
    ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
    ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
    ('FONTSIZE', (0, 0), (-1, 0), 10),
    ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
    ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
    ('GRID', (0, 0), (-1, -1), 1, colors.black),
    ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
    ('FONTSIZE', (0, 1), (-1, -1), 9),
]))

elements.append(errors_table)

# Rodapé
elements.append(Spacer(1, 0.5*inch))
footer_text = f"Relatório gerado em {datetime.now().strftime('%d/%m/%Y %H:%M:%S')}"
elements.append(Paragraph(footer_text, styles['Normal']))

# Gerar PDF
doc.build(elements)
print(f"PDF gerado com sucesso: ${outputPath}")
`;

    return pythonScript;
  }

  /**
   * Executa a geração de PDF via subprocess
   */
  static async generatePDF(reportData: ReportData, outputPath: string): Promise<string> {
    const { spawn } = await import('child_process');
    const pythonScript = this.generatePythonScript(reportData, outputPath);

    return new Promise((resolve, reject) => {
      const python = spawn('python3', ['-c', pythonScript]);
      let output = '';
      let error = '';

      python.stdout.on('data', (data) => {
        output += data.toString();
      });

      python.stderr.on('data', (data) => {
        error += data.toString();
      });

      python.on('close', (code) => {
        if (code === 0) {
          resolve(outputPath);
        } else {
          reject(new Error(`Python error: ${error}`));
        }
      });

      python.on('error', (err) => {
        reject(err);
      });
    });
  }
}
