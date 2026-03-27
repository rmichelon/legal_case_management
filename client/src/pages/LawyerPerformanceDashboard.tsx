import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
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
import { TrendingUp, Users, Target, Clock } from "lucide-react";

export default function LawyerPerformanceDashboard() {
  const [selectedPeriod, setSelectedPeriod] = useState("monthly");

  // Queries
  const { data: lawyers = [] } = trpc.lawyers.list.useQuery();

  // Prepare performance data for charts
  const performanceData = lawyers.map((lawyer: any) => ({
    name: lawyer.name,
    id: lawyer.id,
    status: lawyer.status,
    yearsOfExperience: lawyer.yearsOfExperience || 0,
    hourlyRate: lawyer.hourlyRate ? parseFloat(lawyer.hourlyRate) : 0,
  }));

  // Calculate statistics
  const totalLawyers = lawyers.length;
  const activeLawyers = lawyers.filter((l: any) => l.status === "active").length;
  const averageExperience =
    lawyers.length > 0
      ? (lawyers.reduce((sum: number, l: any) => sum + (l.yearsOfExperience || 0), 0) /
          lawyers.length).toFixed(1)
      : 0;

  const chartData = [
    { name: "Ativo", value: activeLawyers, color: "#ec4899" },
    { name: "Inativo", value: totalLawyers - activeLawyers, color: "#9ca3af" },
  ];

  const experienceData = performanceData
    .sort((a: any, b: any) => b.yearsOfExperience - a.yearsOfExperience)
    .slice(0, 10)
    .map((lawyer: any) => ({
      name: lawyer.name.split(" ")[0],
      experience: lawyer.yearsOfExperience,
    }));

  const rateData = performanceData
    .filter((l: any) => l.hourlyRate > 0)
    .sort((a: any, b: any) => b.hourlyRate - a.hourlyRate)
    .slice(0, 10)
    .map((lawyer: any) => ({
      name: lawyer.name.split(" ")[0],
      rate: lawyer.hourlyRate,
    }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard de Performance</h1>
        <p className="text-gray-600 mt-2">Análise de performance dos advogados</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="w-4 h-4 text-pink-600" />
              Total de Advogados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalLawyers}</div>
            <p className="text-xs text-gray-500 mt-1">Cadastrados no sistema</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-green-600" />
              Advogados Ativos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeLawyers}</div>
            <p className="text-xs text-gray-500 mt-1">
              {totalLawyers > 0 ? ((activeLawyers / totalLawyers) * 100).toFixed(0) : 0}% do total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-600" />
              Experiência Média
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{averageExperience}</div>
            <p className="text-xs text-gray-500 mt-1">Anos de experiência</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Target className="w-4 h-4 text-orange-600" />
              Taxa de Utilização
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">85%</div>
            <p className="text-xs text-gray-500 mt-1">Média de ocupação</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Distribuição de Status</CardTitle>
            <CardDescription>Advogados por status</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {chartData.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Experience Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Top 10 - Anos de Experiência</CardTitle>
            <CardDescription>Advogados mais experientes</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={experienceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="experience" fill="#ec4899" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Hourly Rates */}
      <Card>
        <CardHeader>
          <CardTitle>Top 10 - Valor por Hora</CardTitle>
          <CardDescription>Advogados com maiores valores/hora</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={rateData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
                <Tooltip formatter={(value: any) => `R$ ${typeof value === 'number' ? value.toFixed(2) : value}`} />
              <Bar dataKey="rate" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Lawyers Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Advogados</CardTitle>
          <CardDescription>Todos os advogados cadastrados</CardDescription>
        </CardHeader>
        <CardContent>
          {lawyers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Nenhum advogado cadastrado
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>OAB</TableHead>
                    <TableHead>Experiência</TableHead>
                    <TableHead>Valor/Hora</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Data de Entrada</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lawyers.map((lawyer: any) => (
                    <TableRow key={lawyer.id}>
                      <TableCell className="font-medium">{lawyer.name}</TableCell>
                      <TableCell>
                        {lawyer.oabNumber ? (
                          <span className="text-sm">
                            {lawyer.oabNumber}/{lawyer.oabState}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {lawyer.yearsOfExperience ? `${lawyer.yearsOfExperience} anos` : "-"}
                      </TableCell>
                      <TableCell>
                        {lawyer.hourlyRate ? `R$ ${parseFloat(lawyer.hourlyRate).toFixed(2)}` : "-"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            lawyer.status === "active"
                              ? "bg-green-100 text-green-800"
                              : lawyer.status === "on_leave"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-gray-100 text-gray-800"
                          }
                        >
                          {lawyer.status === "active"
                            ? "Ativo"
                            : lawyer.status === "on_leave"
                            ? "Licença"
                            : lawyer.status === "inactive"
                            ? "Inativo"
                            : "Aposentado"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {new Date(lawyer.joinDate).toLocaleDateString("pt-BR")}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
