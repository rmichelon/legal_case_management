import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Calendar, FileText, Users, Plus, Briefcase, RefreshCw, TrendingUp, Scale } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function Dashboard() {
  const { user, isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();

  const { data: cases = [] } = trpc.cases.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const { data: upcomingDeadlines = [] } = trpc.deadlines.upcoming.useQuery(
    { daysAhead: 30 },
    { enabled: isAuthenticated }
  );

  const { data: clients = [] } = trpc.clients.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const { data: lawyers = [] } = trpc.lawyers.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate("/");
    }
  }, [loading, isAuthenticated]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-accent mx-auto mb-4"></div>
          <p className="text-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  const activeCases = cases.filter((c: any) => c.status === "open").length;
  const overdueDeadlines = upcomingDeadlines.filter((d: any) => d.deadlines?.status === "overdue").length;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border">
        <div className="container py-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-4xl font-bold text-foreground mb-2">Dashboard</h1>
              <p className="text-muted-foreground">Bem-vindo, {user?.name || "Advogado"}</p>
            </div>
            <Button
              onClick={() => navigate("/cases/new")}
              className="bg-accent text-accent-foreground hover:bg-accent/90"
            >
              <Plus className="w-4 h-4 mr-2" />
              Novo Processo
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="border-l-4 border-l-accent">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Processos Ativos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{activeCases}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Total de {cases.length} processos
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-accent">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Prazos Próximos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">
                {upcomingDeadlines.length}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Próximos 30 dias
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-accent">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                Prazos Vencidos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-accent">{overdueDeadlines}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Requerem atenção
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-accent">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Users className="w-4 h-4" />
                Clientes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{clients.length}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Cadastrados no sistema
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-accent">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Scale className="w-4 h-4" />
                Advogados
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{lawyers.length}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Ativos no sistema
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Case Management Widgets */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-accent" />
                Gestão de Processos
              </CardTitle>
              <CardDescription>Acesso rápido à gestão completa</CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={() => navigate("/management")}
                className="w-full bg-accent hover:bg-accent/90"
              >
                <Briefcase className="w-4 h-4 mr-2" />
                Ir para Gestão de Processos
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <RefreshCw className="w-5 h-5 text-accent" />
                Sincronização
              </CardTitle>
              <CardDescription>Status de sincronização com tribunais</CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={() => navigate("/monitoring")}
                className="w-full bg-accent hover:bg-accent/90"
              >
                <TrendingUp className="w-4 h-4 mr-2" />
                Ver Monitoramento
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Scale className="w-5 h-5 text-accent" />
                Gestão de Advogados
              </CardTitle>
              <CardDescription>Gerenciar equipe de advogados</CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={() => navigate("/lawyers")}
                className="w-full bg-accent hover:bg-accent/90"
              >
                <Scale className="w-4 h-4 mr-2" />
                Ir para Advogados
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Upcoming Deadlines and Recent Cases */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader className="border-b border-border">
                <CardTitle>Prazos Próximos</CardTitle>
                <CardDescription>Datas importantes nos próximos 30 dias</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                {upcomingDeadlines.length === 0 ? (
                  <div className="text-center py-8">
                    <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                    <p className="text-muted-foreground">Nenhum prazo próximo</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {upcomingDeadlines.slice(0, 5).map((item: any) => (
                      <div
                        key={item.deadlines?.id}
                        className="flex items-start gap-4 pb-4 border-b border-border last:border-0 last:pb-0"
                      >
                        <div className="flex-shrink-0 w-1 bg-accent rounded-full mt-2"></div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-foreground truncate">
                            {item.deadlines?.title}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            {item.cases?.title}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="outline" className="text-xs">
                              {item.deadlines?.type}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(item.deadlines?.dueDate), "dd 'de' MMMM", {
                                locale: ptBR,
                              })}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Recent Cases */}
          <div>
            <Card>
              <CardHeader className="border-b border-border">
                <CardTitle className="text-lg">Processos Recentes</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                {cases.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                    <p className="text-muted-foreground text-sm">Nenhum processo cadastrado</p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-4 w-full"
                      onClick={() => navigate("/cases/new")}
                    >
                      Criar Primeiro Processo
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {cases.slice(0, 5).map((caseItem: any) => (
                      <div
                        key={caseItem.id}
                        className="p-3 border border-border rounded hover:bg-muted/50 cursor-pointer transition"
                        onClick={() => navigate(`/cases/${caseItem.id}`)}
                      >
                        <p className="font-medium text-sm text-foreground truncate">
                          {caseItem.title}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {caseItem.caseNumber}
                        </p>
                        <div className="mt-2">
                          <Badge
                            variant={caseItem.status === "open" ? "default" : "secondary"}
                            className="text-xs"
                          >
                            {caseItem.status === "open" ? "Ativo" : caseItem.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
