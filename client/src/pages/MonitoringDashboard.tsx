import { useEffect, useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle, Clock, TrendingUp, RefreshCw } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function MonitoringDashboard() {
  const [selectedTribunal, setSelectedTribunal] = useState<'tjsp' | 'tjmg' | 'tjms'>('tjsp');
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);

  // Queries
  const dashboardQuery = trpc.monitoring.getDashboardData.useQuery();
  const healthQuery = trpc.monitoring.getHealthStatus.useQuery();
  const alertsQuery = trpc.monitoring.getActiveAlerts.useQuery({ tribunal: selectedTribunal });
  const performanceQuery = trpc.monitoring.getPerformanceReport.useQuery({
    tribunal: selectedTribunal,
    period: 'weekly',
  });

  // Mutations
  const startHealthChecksMutation = trpc.monitoring.startHealthChecks.useMutation();
  const stopHealthChecksMutation = trpc.monitoring.stopHealthChecks.useMutation();

  // Auto-refresh
  useEffect(() => {
    const interval = setInterval(() => {
      dashboardQuery.refetch();
      healthQuery.refetch();
      alertsQuery.refetch();
    }, 10000); // Refresh every 10 seconds

    setRefreshInterval(interval);
    return () => clearInterval(interval);
  }, []);

  const getHealthStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-100 text-green-800';
      case 'degraded':
        return 'bg-yellow-100 text-yellow-800';
      case 'down':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getHealthStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'degraded':
        return <AlertCircle className="w-4 h-4 text-yellow-600" />;
      case 'down':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  return (
    <div className="min-h-screen bg-white p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-black mb-2">Monitoramento de Integrações</h1>
          <p className="text-gray-600">Acompanhe a saúde e performance das integrações com tribunais</p>
        </div>

        {/* Summary Cards */}
        {dashboardQuery.data && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="border-l-4 border-l-red-500">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">Sincronizações Totais</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-black">{dashboardQuery.data.summary.totalSyncs}</div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-green-500">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">Bem-sucedidas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">{dashboardQuery.data.summary.successfulSyncs}</div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-red-500">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">Falhadas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-red-600">{dashboardQuery.data.summary.failedSyncs}</div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-blue-500">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">Taxa de Sucesso</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600">{dashboardQuery.data.summary.successRate}%</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Health Status */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="health" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="health">Saúde</TabsTrigger>
                <TabsTrigger value="alerts">Alertas</TabsTrigger>
                <TabsTrigger value="performance">Performance</TabsTrigger>
              </TabsList>

              {/* Health Tab */}
              <TabsContent value="health" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Status dos Tribunais</CardTitle>
                    <CardDescription>Última verificação em tempo real</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {healthQuery.data?.map((tribunal) => (
                      <div key={tribunal.tribunal} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          {getHealthStatusIcon(tribunal.status)}
                          <div>
                            <p className="font-semibold text-black">{tribunal.tribunal.toUpperCase()}</p>
                            <p className="text-sm text-gray-600">
                              Tempo de resposta: {tribunal.responseTime}ms
                            </p>
                          </div>
                        </div>
                        <Badge className={getHealthStatusColor(tribunal.status)}>
                          {tribunal.status === 'healthy' ? 'Saudável' : tribunal.status === 'degraded' ? 'Degradado' : 'Inativo'}
                        </Badge>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Alerts Tab */}
              <TabsContent value="alerts" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Alertas Ativos</CardTitle>
                    <CardDescription>Problemas detectados nas integrações</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {alertsQuery.data && alertsQuery.data.length > 0 ? (
                      <div className="space-y-3">
                        {alertsQuery.data.map((alert) => (
                          <div key={alert.id} className="p-4 border-l-4 border-l-red-500 bg-red-50 rounded">
                            <div className="flex items-start justify-between">
                              <div>
                                <p className="font-semibold text-black">{alert.title}</p>
                                <p className="text-sm text-gray-600 mt-1">{alert.description}</p>
                                <p className="text-xs text-gray-500 mt-2">
                                  Disparado em: {new Date(alert.triggeredAt).toLocaleString('pt-BR')}
                                </p>
                              </div>
                              <Badge variant="destructive">{alert.severity}</Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-3" />
                        <p className="text-gray-600">Nenhum alerta ativo</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Performance Tab */}
              <TabsContent value="performance" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Relatório de Performance</CardTitle>
                    <CardDescription>Últimos 7 dias</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {performanceQuery.data ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="p-4 bg-gray-50 rounded">
                            <p className="text-sm text-gray-600 mb-1">Taxa de Sucesso</p>
                            <p className="text-2xl font-bold text-black">{performanceQuery.data.successRate}%</p>
                          </div>
                          <div className="p-4 bg-gray-50 rounded">
                            <p className="text-sm text-gray-600 mb-1">Tempo Médio</p>
                            <p className="text-2xl font-bold text-black">{performanceQuery.data.averageResponseTime}ms</p>
                          </div>
                          <div className="p-4 bg-gray-50 rounded">
                            <p className="text-sm text-gray-600 mb-1">Registros Processados</p>
                            <p className="text-2xl font-bold text-black">{performanceQuery.data.totalRecordsProcessed}</p>
                          </div>
                          <div className="p-4 bg-gray-50 rounded">
                            <p className="text-sm text-gray-600 mb-1">Erros</p>
                            <p className="text-2xl font-bold text-red-600">{performanceQuery.data.totalErrors}</p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className="text-gray-600">Carregando dados...</p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Right Column - Controls */}
          <div className="space-y-6">
            {/* Tribunal Selector */}
            <Card>
              <CardHeader>
                <CardTitle>Tribunal</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {(['tjsp', 'tjmg', 'tjms'] as const).map((tribunal) => (
                  <Button
                    key={tribunal}
                    variant={selectedTribunal === tribunal ? 'default' : 'outline'}
                    className="w-full justify-start"
                    onClick={() => setSelectedTribunal(tribunal)}
                  >
                    {tribunal.toUpperCase()}
                  </Button>
                ))}
              </CardContent>
            </Card>

            {/* Health Check Controls */}
            <Card>
              <CardHeader>
                <CardTitle>Controles</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  className="w-full"
                  onClick={() => startHealthChecksMutation.mutate()}
                  disabled={startHealthChecksMutation.isPending}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Iniciar Verificações
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => stopHealthChecksMutation.mutate()}
                  disabled={stopHealthChecksMutation.isPending}
                >
                  Parar Verificações
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    dashboardQuery.refetch();
                    healthQuery.refetch();
                    alertsQuery.refetch();
                  }}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Atualizar Agora
                </Button>
              </CardContent>
            </Card>

            {/* Recent Syncs */}
            {dashboardQuery.data && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Sincronizações Recentes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    {dashboardQuery.data.recentSyncs.slice(0, 5).map((sync) => (
                      <div key={sync.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span className="text-gray-600 truncate">Caso #{sync.caseId}</span>
                        <Badge variant={sync.status === 'success' ? 'default' : 'destructive'}>
                          {sync.status === 'success' ? '✓' : '✗'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
