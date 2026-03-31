import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { DeleteConfirmationModal } from "@/components/DeleteConfirmationModal";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Search,
  Plus,
  RefreshCw,
  Download,
  Eye,
  Filter,
  AlertCircle,
  CheckCircle2,
  Clock,
  Edit,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

interface CaseFilter {
  searchTerm: string;
  status: string;
  court: string;
  clientId: string;
}

interface CaseItem {
  id: number;
  caseNumber: string;
  title: string;
  court: string;
  status: "open" | "suspended" | "closed" | "archived";
  clientId: number;
  updatedAt: Date;
}

export default function CaseManagement() {
  const [, navigate] = useLocation();
  const [selectedCases, setSelectedCases] = useState<number[]>([]);
  const [filters, setFilters] = useState<CaseFilter>({
    searchTerm: "",
    status: "",
    court: "",
    clientId: "",
  });
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [caseToDelete, setCaseToDelete] = useState<CaseItem | null>(null);

  // Fetch cases with filters
  const { data: cases, isLoading, refetch } = trpc.cases.search.useQuery({
    query: filters.searchTerm,
  });

  // Fetch clients for filter dropdown
  const { data: clients } = trpc.clients.list.useQuery();

  // Sync mutation
  const syncMutation = trpc.caseManagement.syncCaseFromTribunal.useMutation({
    onSuccess: () => {
      toast.success("Sincronização iniciada com sucesso");
      refetch();
    },
    onError: (error: any) => {
      toast.error(`Erro na sincronização: ${error.message}`);
    },
  });

  // Bulk sync mutation - usando múltiplas chamadas
  const bulkSyncMutation = trpc.caseManagement.syncCaseFromTribunal.useMutation({
    onSuccess: () => {
      toast.success("Sincronização em lote iniciada");
      setSelectedCases([]);
      refetch();
    },
    onError: (error: any) => {
      toast.error(`Erro na sincronização: ${error.message}`);
    },
  });

  // Export to PDF mutation
  const exportPDFMutation = trpc.export.toPDF.useMutation({
    onSuccess: (data) => {
      const link = document.createElement("a");
      link.href = `data:${data.mimeType};base64,${data.data}`;
      link.download = data.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("PDF exportado com sucesso");
    },
    onError: (error: any) => {
      toast.error(`Erro ao exportar PDF: ${error.message}`);
    },
  });

  // Export to Excel mutation
  const exportExcelMutation = trpc.export.toExcel.useMutation({
    onSuccess: (data) => {
      const link = document.createElement("a");
      link.href = `data:${data.mimeType};base64,${data.data}`;
      link.download = data.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Excel exportado com sucesso");
    },
    onError: (error: any) => {
      toast.error(`Erro ao exportar Excel: ${error.message}`);
    },
  });

  // Soft delete case mutation
  const deleteMutation = trpc.cases.softDelete.useMutation({
    onSuccess: () => {
      toast.success("Processo movido para lixeira. Você pode recuperá-lo em até 30 dias.");
      setDeleteModalOpen(false);
      setCaseToDelete(null);
      refetch();
    },
    onError: (error: any) => {
      toast.error(`Erro ao deletar processo: ${error.message}`);
    },
  });

  const handleDeleteClick = (caseItem: CaseItem) => {
    setCaseToDelete(caseItem);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = () => {
    if (caseToDelete) {
      deleteMutation.mutate({ id: caseToDelete.id });
    }
  };

  // Filter cases
  const filteredCases = useMemo(() => {
    if (!cases) return [];
    return cases.filter((c) => {
      if (filters.status && c.status !== filters.status) return false;
      if (filters.court && c.court !== filters.court) return false;
      if (filters.clientId && c.clientId !== parseInt(filters.clientId))
        return false;
      return true;
    });
  }, [cases, filters]);

  const handleSelectAll = () => {
    if (selectedCases.length === filteredCases.length) {
      setSelectedCases([]);
    } else {
      setSelectedCases(filteredCases.map((c) => c.id));
    }
  };

  const handleSelectCase = (caseId: number) => {
    setSelectedCases((prev) =>
      prev.includes(caseId)
        ? prev.filter((id) => id !== caseId)
        : [...prev, caseId]
    );
  };

  const handleBulkSync = async () => {
    if (selectedCases.length === 0) {
      toast.error("Selecione pelo menos um processo");
      return;
    }
    
    let successCount = 0;
    for (const caseId of selectedCases) {
      const caseItem = filteredCases.find(c => c.id === caseId);
      if (caseItem) {
        try {
          await syncMutation.mutateAsync({
            caseId,
            processNumber: caseItem.caseNumber,
          });
          successCount++;
        } catch (error) {
          console.error(`Erro ao sincronizar ${caseItem.caseNumber}:`, error);
        }
      }
    }
    
    setSelectedCases([]);
    toast.success(`${successCount}/${selectedCases.length} processo(s) sincronizado(s)`);
    refetch();
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: any }> = {
      open: { label: "Aberto", variant: "default" },
      suspended: { label: "Suspenso", variant: "outline" },
      closed: { label: "Encerrado", variant: "destructive" },
      archived: { label: "Arquivado", variant: "secondary" },
    };
    const config = statusMap[status] || { label: status, variant: "default" };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getSyncStatusIcon = (lastUpdate?: Date) => {
    if (!lastUpdate) {
      return <AlertCircle className="w-4 h-4 text-yellow-500" />;
    }
    const hoursSinceSync = (Date.now() - new Date(lastUpdate).getTime()) / 3600000;
    if (hoursSinceSync < 1) {
      return <CheckCircle2 className="w-4 h-4 text-green-500" />;
    }
    if (hoursSinceSync < 24) {
      return <Clock className="w-4 h-4 text-blue-500" />;
    }
    return <AlertCircle className="w-4 h-4 text-orange-500" />;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Gestão de Processos
          </h1>
          <p className="text-muted-foreground mt-1">
            Gerencie e sincronize seus processos judiciais
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => exportPDFMutation.mutate({ status: filters.status, court: filters.court })}
            disabled={!filteredCases || filteredCases.length === 0 || exportPDFMutation.isPending}
            variant="outline"
            className="gap-2"
            title="Exportar para PDF"
          >
            <Download className="w-4 h-4" />
            PDF
          </Button>
          <Button
            onClick={() => exportExcelMutation.mutate({ status: filters.status, court: filters.court })}
            disabled={!filteredCases || filteredCases.length === 0 || exportExcelMutation.isPending}
            variant="outline"
            className="gap-2"
            title="Exportar para Excel"
          >
            <Download className="w-4 h-4" />
            Excel
          </Button>
          <Button
            onClick={() => navigate("/cases/new")}
            className="gap-2 bg-accent hover:bg-accent/90"
          >
            <Plus className="w-4 h-4" />
            Novo Processo
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-4 h-4" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar processo..."
                value={filters.searchTerm}
                onChange={(e) =>
                  setFilters({ ...filters, searchTerm: e.target.value })
                }
                className="pl-10"
              />
            </div>

            {/* Status Filter */}
            <Select
              value={filters.status}
              onValueChange={(value) =>
                setFilters({ ...filters, status: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="open">Aberto</SelectItem>
                <SelectItem value="suspended">Suspenso</SelectItem>
                <SelectItem value="closed">Encerrado</SelectItem>
                <SelectItem value="archived">Arquivado</SelectItem>
              </SelectContent>
            </Select>

            {/* Court Filter */}
            <Select
              value={filters.court}
              onValueChange={(value) =>
                setFilters({ ...filters, court: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Tribunal" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="Vara Cível">Vara Cível</SelectItem>
                <SelectItem value="Vara Criminal">Vara Criminal</SelectItem>
                <SelectItem value="Vara Trabalhista">Vara Trabalhista</SelectItem>
                <SelectItem value="Vara de Família">Vara de Família</SelectItem>
              </SelectContent>
            </Select>

            {/* Client Filter */}
            <Select
              value={filters.clientId}
              onValueChange={(value) =>
                setFilters({ ...filters, clientId: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Cliente" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {clients?.map((client) => (
                  <SelectItem key={client.id} value={client.id.toString()}>
                    {client.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {selectedCases.length > 0 && (
        <Card className="border-accent/50 bg-accent/5">
          <CardContent className="pt-6 flex items-center justify-between">
            <p className="text-sm font-medium">
              {selectedCases.length} processo(s) selecionado(s)
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setSelectedCases([])}
                size="sm"
              >
                Limpar
              </Button>
              <Button
                onClick={handleBulkSync}
                disabled={bulkSyncMutation.isPending}
                size="sm"
                className="gap-2 bg-accent hover:bg-accent/90"
              >
                <RefreshCw className="w-4 h-4" />
                Sincronizar Selecionados
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cases Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            Processos ({filteredCases.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin">
                <RefreshCw className="w-6 h-6 text-accent" />
              </div>
            </div>
          ) : filteredCases.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum processo encontrado
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={
                          selectedCases.length === filteredCases.length &&
                          filteredCases.length > 0
                        }
                        onChange={handleSelectAll}
                      />
                    </TableHead>
                    <TableHead>Número</TableHead>
                    <TableHead>Título</TableHead>
                    <TableHead>Tribunal</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Última Atualização</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCases.map((caseItem) => (
                    <TableRow key={caseItem.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedCases.includes(caseItem.id)}
                          onChange={() => handleSelectCase(caseItem.id)}
                        />
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {caseItem.caseNumber}
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {caseItem.title}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{caseItem.court}</Badge>
                      </TableCell>
                      <TableCell>{getStatusBadge(caseItem.status)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getSyncStatusIcon(caseItem.updatedAt)}
                          <span className="text-xs text-muted-foreground">
                            {caseItem.updatedAt
                              ? new Date(caseItem.updatedAt).toLocaleDateString(
                                  "pt-BR"
                                )
                              : "Nunca"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              navigate(`/cases/${caseItem.id}`)
                            }
                            title="Visualizar"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              syncMutation.mutate({
                                caseId: caseItem.id,
                                processNumber: caseItem.caseNumber,
                              })
                            }
                            disabled={syncMutation.isPending}
                            title="Sincronizar"
                          >
                            <RefreshCw className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              navigate(`/reports?caseId=${caseItem.id}`)
                            }
                            title="Relatório"
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              navigate(`/cases/${caseItem.id}/edit`)
                            }
                            title="Editar"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteClick(caseItem)}
                            disabled={deleteMutation.isPending}
                            title="Deletar"
                            className="text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Modal */}
      {caseToDelete && (
        <DeleteConfirmationModal
          isOpen={deleteModalOpen}
          caseNumber={caseToDelete.caseNumber}
          caseTitle={caseToDelete.title}
          isLoading={deleteMutation.isPending}
          onConfirm={handleConfirmDelete}
          onCancel={() => {
            setDeleteModalOpen(false);
            setCaseToDelete(null);
          }}
        />
      )}
    </div>
  );
}
