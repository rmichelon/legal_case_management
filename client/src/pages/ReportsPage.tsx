import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Download, FileText } from 'lucide-react';
import { toast } from 'sonner';

type Tribunal = 'tjsp' | 'tjmg' | 'tjms';
type Period = 'daily' | 'weekly' | 'monthly';

export default function ReportsPage() {
  const [selectedTribunal, setSelectedTribunal] = useState<Tribunal>('tjsp');
  const [selectedPeriod, setSelectedPeriod] = useState<Period>('monthly');
  const [isGenerating, setIsGenerating] = useState(false);

  const generatePDFMutation = trpc.reports.generatePDF.useMutation();
  const reportDataQuery = trpc.reports.getReportData.useQuery({
    tribunal: selectedTribunal,
    period: selectedPeriod,
  });

  const handleGeneratePDF = async () => {
    setIsGenerating(true);
    try {
      const result = await generatePDFMutation.mutateAsync({
        tribunal: selectedTribunal,
        period: selectedPeriod,
      });

      if (result.success) {
        toast.success('Relatório gerado com sucesso!');
        // Aqui você pode adicionar lógica para fazer download do PDF
        console.log('PDF gerado:', result);
      }
    } catch (error) {
      toast.error('Erro ao gerar relatório');
      console.error(error);
    } finally {
      setIsGenerating(false);
    }
  };

  const reportData = reportDataQuery.data;

  return (
    <div className="min-h-screen bg-white p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-black mb-2">Relatórios de Performance</h1>
          <p className="text-gray-600">Gere e exporte relatórios detalhados de sincronização com tribunais</p>
        </div>

        {/* Filtros */}
        <Card className="p-6 mb-8 border-l-4 border-l-red-600">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {/* Tribunal */}
            <div>
              <label className="block text-sm font-semibold text-black mb-2">Tribunal</label>
              <Select value={selectedTribunal} onValueChange={(v) => setSelectedTribunal(v as Tribunal)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tjsp">TJSP - São Paulo</SelectItem>
                  <SelectItem value="tjmg">TJMG - Minas Gerais</SelectItem>
                  <SelectItem value="tjms">TJMS - Mato Grosso do Sul</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Período */}
            <div>
              <label className="block text-sm font-semibold text-black mb-2">Período</label>
              <Select value={selectedPeriod} onValueChange={(v) => setSelectedPeriod(v as Period)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Diário</SelectItem>
                  <SelectItem value="weekly">Semanal</SelectItem>
                  <SelectItem value="monthly">Mensal</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Ações */}
            <div className="flex items-end">
              <Button
                onClick={handleGeneratePDF}
                disabled={isGenerating || reportDataQuery.isLoading}
                className="w-full bg-red-600 hover:bg-red-700 text-white"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Gerando...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    Gerar PDF
                  </>
                )}
              </Button>
            </div>
          </div>
        </Card>

        {/* Resumo Executivo */}
        {reportData && (
          <>
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-black mb-4">Resumo Executivo</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Total de Sincronizações */}
                <Card className="p-4 border-l-4 border-l-red-600">
                  <p className="text-sm text-gray-600 mb-2">Total de Sincronizações</p>
                  <p className="text-3xl font-bold text-black">{reportData.totalSyncs}</p>
                </Card>

                {/* Taxa de Sucesso */}
                <Card className="p-4 border-l-4 border-l-green-600">
                  <p className="text-sm text-gray-600 mb-2">Taxa de Sucesso</p>
                  <p className="text-3xl font-bold text-green-600">{reportData.successRate.toFixed(1)}%</p>
                </Card>

                {/* Tempo Médio */}
                <Card className="p-4 border-l-4 border-l-blue-600">
                  <p className="text-sm text-gray-600 mb-2">Tempo Médio</p>
                  <p className="text-3xl font-bold text-blue-600">{reportData.averageResponseTime.toFixed(0)}ms</p>
                </Card>

                {/* Uptime */}
                <Card className="p-4 border-l-4 border-l-purple-600">
                  <p className="text-sm text-gray-600 mb-2">Uptime</p>
                  <p className="text-3xl font-bold text-purple-600">{reportData.uptime.toFixed(1)}%</p>
                </Card>
              </div>
            </div>

            {/* Detalhes */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              {/* Sincronizações */}
              <Card className="p-6 border-l-4 border-l-red-600">
                <h3 className="text-lg font-bold text-black mb-4">Sincronizações</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Bem-sucedidas</span>
                    <span className="font-semibold text-green-600">{reportData.successfulSyncs}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Falhadas</span>
                    <span className="font-semibold text-red-600">{reportData.failedSyncs}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Taxa de Erro</span>
                    <span className="font-semibold text-orange-600">{reportData.errorRate.toFixed(1)}%</span>
                  </div>
                </div>
              </Card>

              {/* Tempo de Resposta */}
              <Card className="p-6 border-l-4 border-l-blue-600">
                <h3 className="text-lg font-bold text-black mb-4">Tempo de Resposta</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Mínimo</span>
                    <span className="font-semibold">{reportData.minResponseTime.toFixed(0)}ms</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Máximo</span>
                    <span className="font-semibold">{reportData.maxResponseTime.toFixed(0)}ms</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Pico de Uso</span>
                    <span className="font-semibold">{reportData.peakHour}</span>
                  </div>
                </div>
              </Card>
            </div>

            {/* Registros Processados */}
            <Card className="p-6 border-l-4 border-l-red-600 mb-8">
              <h3 className="text-lg font-bold text-black mb-4">Dados Processados</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Registros Processados</p>
                  <p className="text-2xl font-bold text-black">{reportData.totalRecordsProcessed}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total de Erros</p>
                  <p className="text-2xl font-bold text-red-600">{reportData.totalErrors}</p>
                </div>
              </div>
            </Card>

            {/* Erros Mais Comuns */}
            {reportData.topErrors.length > 0 && (
              <Card className="p-6 border-l-4 border-l-red-600">
                <h3 className="text-lg font-bold text-black mb-4">Erros Mais Comuns</h3>
                <div className="space-y-2">
                  {reportData.topErrors.map((error, idx) => (
                    <div key={idx} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                      <span className="text-sm text-gray-700 truncate">{error.error}</span>
                      <span className="ml-2 px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-semibold">
                        {error.count}
                      </span>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </>
        )}

        {reportDataQuery.isLoading && (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-red-600" />
          </div>
        )}

        {reportDataQuery.error && (
          <Card className="p-6 bg-red-50 border-l-4 border-l-red-600">
            <p className="text-red-700">Erro ao carregar dados do relatório</p>
          </Card>
        )}
      </div>
    </div>
  );
}
