import { useState, useMemo } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { AlertCircle, TrendingUp, Clock, CheckCircle, AlertTriangle, Mail, Bell, Settings } from "lucide-react";

export default function ControladoriaDashboard() {
  const { user } = useAuth();
  const [selectedMetric, setSelectedMetric] = useState("overview");

  // Fetch data
  const { data: dailyReports } = trpc.controladoria.getDailyReports.useQuery({ limit: 30 });
  const { data: performanceMetrics } = trpc.controladoria.getPerformanceMetrics.useQuery({ limit: 30 });
  const { data: alertHistory } = trpc.controladoria.getAlertHistory.useQuery({ limit: 50 });
  const { data: scheduledReports } = trpc.controladoria.getScheduledReports.useQuery();

  // Calculate statistics
  const stats = useMemo(() => {
    if (!dailyReports || dailyReports.length === 0) {
      return {
        totalCases: 0,
        activeCases: 0,
        closedCases: 0,
        overduePrazos: 0,
        upcomingPrazos: 0,
        totalLawyers: 0,
        totalClients: 0,
      };
    }

    const latest = dailyReports[0];
    return {
      totalCases: latest.totalCases || 0,
      activeCases: latest.activeCases || 0,
      closedCases: latest.closedCases || 0,
      overduePrazos: latest.overduePrazos || 0,
      upcomingPrazos: latest.upcomingPrazos || 0,
      totalLawyers: latest.totalLawyers || 0,
      totalClients: latest.totalClients || 0,
    };
  }, [dailyReports]);

  // Chart data
  const chartData = useMemo(() => {
    if (!dailyReports) return [];
    return dailyReports.slice().reverse().map((report) => ({
      date: new Date(report.reportDate).toLocaleDateString("pt-BR"),
      cases: report.totalCases,
      deadlines: report.totalDeadlines,
                  prazos: (report.overduePrazos || 0) + (report.upcomingPrazos || 0),
    }));
  }, [dailyReports]);

  const performanceData = useMemo(() => {
    if (!performanceMetrics) return [];
    return performanceMetrics.slice(0, 10).reverse().map((metric) => ({
      date: new Date(metric.metricsDate).toLocaleDateString("pt-BR"),
      successRate: parseFloat(metric.successRate || "0"),
      casesHandled: metric.casesHandled,
      revenue: parseFloat(metric.revenue || "0"),
    }));
  }, [performanceMetrics]);

  const alertStats = useMemo(() => {
    if (!alertHistory) return { sent: 0, failed: 0, pending: 0 };
    return {
      sent: alertHistory.filter((a) => a.status === "sent").length,
      failed: alertHistory.filter((a) => a.status === "failed").length,
      pending: alertHistory.filter((a) => a.status === "pending").length,
    };
  }, [alertHistory]);

  const pieData = [
    { name: "Enviados", value: alertStats.sent, color: "#10b981" },
    { name: "Falhados", value: alertStats.failed, color: "#ef4444" },
    { name: "Pendentes", value: alertStats.pending, color: "#f59e0b" },
  ];

  if (!user) {
    return <div>Carregando...</div>;
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Controladoria Advocatícia</h1>
          <p className="text-gray-600 mt-1">Monitoramento completo de processos, prazos e performance</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Mail className="w-4 h-4 mr-2" />
            Configurar Alertas
          </Button>
          <Button variant="outline" size="sm">
            <Settings className="w-4 h-4 mr-2" />
            Preferências
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Processos Ativos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.activeCases}</div>
            <p className="text-xs text-gray-500 mt-1">de {stats.totalCases} total</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Prazos Vencidos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">{stats.overduePrazos}</div>
            <p className="text-xs text-gray-500 mt-1">Requerem atenção</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Prazos Próximos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-600">{stats.upcomingPrazos}</div>
            <p className="text-xs text-gray-500 mt-1">Próximos 30 dias</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Advogados Ativos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalLawyers}</div>
            <p className="text-xs text-gray-500 mt-1">no sistema</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="alerts">Alertas</TabsTrigger>
          <TabsTrigger value="reports">Relatórios</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Evolução de Processos e Prazos</CardTitle>
              <CardDescription>Últimos 30 dias</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="cases" stroke="#ef4444" name="Processos" />
                  <Line type="monotone" dataKey="prazos" stroke="#f59e0b" name="Prazos" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Status de Processos</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Ativos</span>
                  <Badge variant="outline">{stats.activeCases}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Fechados</span>
                  <Badge variant="outline">{stats.closedCases}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Total</span>
                  <Badge>{stats.totalCases}</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recursos</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Advogados</span>
                  <Badge variant="outline">{stats.totalLawyers}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Clientes</span>
                  <Badge variant="outline">{stats.totalClients}</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Taxa de Sucesso e Casos Tratados</CardTitle>
              <CardDescription>Últimos 10 períodos</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="successRate" fill="#10b981" name="Taxa Sucesso %" />
                  <Bar dataKey="casesHandled" fill="#3b82f6" name="Casos Tratados" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Receita Gerada</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  R$ {performanceMetrics?.[0]?.revenue || "0,00"}
                </div>
                <p className="text-xs text-gray-500 mt-2">Período atual</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Média de Resolução</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {performanceMetrics?.[0]?.averageResolutionDays || 0} dias
                </div>
                <p className="text-xs text-gray-500 mt-2">Tempo médio</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Alerts Tab */}
        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Status de Alertas</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" labelLine={false} label={({ name, value }) => `${name}: ${value}`} outerRadius={80} fill="#8884d8" dataKey="value">
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Histórico de Alertas Recentes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {alertHistory && alertHistory.length > 0 ? (
                  alertHistory.slice(0, 10).map((alert) => (
                    <div key={alert.id} className="flex items-start gap-3 pb-3 border-b last:border-b-0">
                      <div className="mt-1">
                        {alert.status === "sent" && <CheckCircle className="w-4 h-4 text-green-600" />}
                        {alert.status === "failed" && <AlertTriangle className="w-4 h-4 text-red-600" />}
                        {alert.status === "pending" && <Clock className="w-4 h-4 text-yellow-600" />}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{alert.title}</p>
                        <p className="text-xs text-gray-500 mt-1">{alert.message}</p>
                        <Badge className="mt-2" variant={alert.status === "sent" ? "default" : "secondary"}>
                          {alert.channel}
                        </Badge>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">Nenhum alerta registrado</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Reports Tab */}
        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Relatórios Agendados</CardTitle>
              <CardDescription>Configurar geração automática de relatórios</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {scheduledReports && scheduledReports.length > 0 ? (
                  scheduledReports.map((report) => (
                    <div key={report.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium text-sm">{report.name}</p>
                        <p className="text-xs text-gray-500">{report.reportType} - {report.format}</p>
                      </div>
                      <Badge variant={report.enabled ? "default" : "secondary"}>
                        {report.enabled ? "Ativo" : "Inativo"}
                      </Badge>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">Nenhum relatório agendado</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Relatórios Diários</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {dailyReports && dailyReports.length > 0 ? (
                  dailyReports.slice(0, 10).map((report) => (
                    <div key={report.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                      <div>
                        <p className="text-sm font-medium">{new Date(report.reportDate).toLocaleDateString("pt-BR")}</p>
                        <p className="text-xs text-gray-500">
                          {report.activeCases} ativos • {report.overduePrazos} vencidos • {report.upcomingPrazos} próximos
                        </p>
                      </div>
                      <Button variant="ghost" size="sm">
                        Ver
                      </Button>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">Nenhum relatório disponível</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
