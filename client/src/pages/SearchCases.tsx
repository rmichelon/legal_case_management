import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Search } from "lucide-react";

export default function SearchCases() {
  const { isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");

  const { data: cases = [] } = trpc.cases.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const { data: searchResults = [] } = trpc.cases.search.useQuery(
    { query: searchQuery },
    { enabled: !!searchQuery && isAuthenticated }
  );

  // Filter results based on selected filters
  const filteredResults = (searchQuery ? searchResults : cases).filter((caseItem: any) => {
    if (statusFilter && statusFilter !== "all" && caseItem.status !== statusFilter) return false;
    if (priorityFilter && priorityFilter !== "all" && caseItem.priority !== priorityFilter) return false;
    return true;
  });

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

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border">
        <div className="container py-6">
          <Button
            variant="ghost"
            onClick={() => navigate("/dashboard")}
            className="mb-4 -ml-2"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <h1 className="text-4xl font-bold text-foreground">Buscar Processos</h1>
          <p className="text-muted-foreground mt-2">
            Encontre seus processos com filtros avançados
          </p>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="container py-8">
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Filtros de Busca</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Search Input */}
            <div>
              <Label htmlFor="search">Buscar por título ou número</Label>
              <div className="relative mt-2">
                <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Digite o título ou número do processo..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Filters Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <Label htmlFor="status-filter">Status</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Todos os status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os status</SelectItem>
                    <SelectItem value="open">Ativo</SelectItem>
                    <SelectItem value="suspended">Suspenso</SelectItem>
                    <SelectItem value="closed">Fechado</SelectItem>
                    <SelectItem value="archived">Arquivado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="priority-filter">Prioridade</Label>
                <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Todas as prioridades" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as prioridades</SelectItem>
                    <SelectItem value="low">Baixa</SelectItem>
                    <SelectItem value="medium">Média</SelectItem>
                    <SelectItem value="high">Alta</SelectItem>
                    <SelectItem value="urgent">Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchQuery("");
                    setStatusFilter("all");
                    setPriorityFilter("all");
                  }}
                  className="w-full"
                >
                  Limpar Filtros
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        <div>
          <div className="mb-4">
            <p className="text-sm text-muted-foreground">
              {filteredResults.length} processo{filteredResults.length !== 1 ? "s" : ""} encontrado{filteredResults.length !== 1 ? "s" : ""}
            </p>
          </div>

          {filteredResults.length === 0 ? (
            <Card>
              <CardContent className="pt-12 pb-12 text-center">
                <Search className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Nenhum processo encontrado
                </h3>
                <p className="text-muted-foreground">
                  Tente ajustar seus filtros ou criar um novo processo
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {filteredResults.map((caseItem: any) => (
                <Card
                  key={caseItem.id}
                  className="border-l-4 border-l-accent cursor-pointer hover:shadow-md transition"
                  onClick={() => navigate(`/cases/${caseItem.id}`)}
                >
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-foreground">
                          {caseItem.title}
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          {caseItem.caseNumber}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Badge
                          variant={
                            caseItem.status === "open" ? "default" : "secondary"
                          }
                        >
                          {caseItem.status === "open" ? "Ativo" : caseItem.status}
                        </Badge>
                        <Badge className="bg-accent text-accent-foreground">
                          {caseItem.priority}
                        </Badge>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t border-border">
                      <div>
                        <p className="text-xs text-muted-foreground">Tipo</p>
                        <p className="text-sm font-medium text-foreground">
                          {caseItem.caseType}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Vara</p>
                        <p className="text-sm font-medium text-foreground">
                          {caseItem.court}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Juiz</p>
                        <p className="text-sm font-medium text-foreground">
                          {caseItem.judge || "—"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Parte Contrária</p>
                        <p className="text-sm font-medium text-foreground truncate">
                          {caseItem.opposingParty || "—"}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
