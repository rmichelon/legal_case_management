import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { TrendingUp, Award, Clock, CheckCircle2, AlertCircle } from "lucide-react";

interface LawyerPerformanceMetricsProps {
  lawyerId: number;
  performance?: {
    totalCasesAssigned: number;
    activeCases: number;
    closedCases: number;
    successfulCases: number;
    totalHoursWorked: number;
    totalBilled: number;
    averageHoursPerCase: number;
    caseSuccessRate: number;
    clientSatisfactionRating?: number;
    deadlinesMissed: number;
  };
  assignments?: any[];
}

export function LawyerPerformanceMetrics({
  performance,
  assignments = [],
}: LawyerPerformanceMetricsProps) {
  if (!performance) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Nenhum dado de desempenho disponível
        </CardContent>
      </Card>
    );
  }

  const successRate = performance.caseSuccessRate || 0;
  const satisfactionRating = performance.clientSatisfactionRating || 0;

  // Dados para gráfico de casos
  const caseData = [
    { name: "Ativos", value: performance.activeCases, fill: "#ec4899" },
    { name: "Encerrados", value: performance.closedCases, fill: "#10b981" },
  ];

  // Dados para gráfico de horas
  const hoursData = [
    {
      name: "Horas",
      total: Math.round(performance.totalHoursWorked),
      média: Math.round(performance.averageHoursPerCase),
    },
  ];

  // Dados para gráfico de sucesso
  const successData = [
    { name: "Sucesso", value: performance.successfulCases, fill: "#10b981" },
    { name: "Outros", value: performance.closedCases - performance.successfulCases, fill: "#f3f4f6" },
  ];

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total de Casos */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Award className="w-4 h-4" />
              Total de Casos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{performance.totalCasesAssigned}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {performance.activeCases} ativos, {performance.closedCases} encerrados
            </p>
          </CardContent>
        </Card>

        {/* Taxa de Sucesso */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Taxa de Sucesso
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{successRate.toFixed(1)}%</div>
            <Progress value={successRate} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {performance.successfulCases} de {performance.closedCases} casos
            </p>
          </CardContent>
        </Card>

        {/* Horas Trabalhadas */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Horas Trabalhadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(performance.totalHoursWorked)}h
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Média: {performance.averageHoursPerCase.toFixed(1)}h/caso
            </p>
          </CardContent>
        </Card>

        {/* Satisfação do Cliente */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              Satisfação
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {satisfactionRating > 0 ? satisfactionRating.toFixed(1) : "N/A"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {satisfactionRating > 0 ? `de 5.0 estrelas` : "Sem avaliações"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Alertas */}
      {performance.deadlinesMissed > 0 && (
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2 text-amber-900">
              <AlertCircle className="w-4 h-4" />
              Prazos Perdidos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-amber-800">
              {performance.deadlinesMissed} prazo(s) perdido(s) neste período
            </p>
          </CardContent>
        </Card>
      )}

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Distribuição de Casos */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Distribuição de Casos</CardTitle>
            <CardDescription>Casos ativos vs encerrados</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={caseData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {caseData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Taxa de Sucesso */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Resultado dos Casos</CardTitle>
            <CardDescription>Casos bem-sucedidos vs outros</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={successData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {successData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Atribuições Recentes */}
      {assignments && assignments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Atribuições Recentes</CardTitle>
            <CardDescription>Últimos casos atribuídos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {assignments.slice(0, 5).map((assignment: any) => (
                <div
                  key={assignment.id}
                  className="flex items-center justify-between p-2 border rounded"
                >
                  <div>
                    <p className="font-sm">{assignment.caseNumber}</p>
                    <p className="text-xs text-muted-foreground">
                      {assignment.title}
                    </p>
                  </div>
                  <Badge variant="outline">{assignment.role}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Resumo Financeiro */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Resumo Financeiro</CardTitle>
          <CardDescription>Horas e faturamento</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Total Faturado</p>
              <p className="text-2xl font-bold">
                R$ {parseFloat(performance.totalBilled as any).toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Horas Totais</p>
              <p className="text-2xl font-bold">
                {Math.round(performance.totalHoursWorked)}h
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
