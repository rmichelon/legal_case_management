import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
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
  Trash2,
  RotateCcw,
  AlertCircle,
  Calendar,
  User,
} from "lucide-react";
import { toast } from "sonner";
import { DeleteConfirmationModal } from "@/components/DeleteConfirmationModal";

interface DeletedCaseItem {
  id: number;
  caseNumber: string;
  title: string;
  court: string;
  deletedAt: Date | null;
  deletedBy: number | null;
}

export default function TrashBin() {
  const [, navigate] = useLocation();
  const [selectedCases, setSelectedCases] = useState<number[]>([]);
  const [permanentDeleteModal, setPermanentDeleteModal] = useState(false);
  const [caseToDelete, setCaseToDelete] = useState<DeletedCaseItem | null>(null);

  // Fetch deleted cases
  const { data: deletedCases, isLoading, refetch } = trpc.cases.listDeleted.useQuery();

  // Restore mutation
  const restoreMutation = trpc.cases.restore.useMutation({
    onSuccess: () => {
      toast.success("Processo restaurado com sucesso");
      setSelectedCases([]);
      refetch();
    },
    onError: (error: any) => {
      toast.error(`Erro ao restaurar processo: ${error.message}`);
    },
  });

  // Permanent delete mutation
  const permanentDeleteMutation = trpc.cases.delete.useMutation({
    onSuccess: () => {
      toast.success("Processo deletado permanentemente");
      setPermanentDeleteModal(false);
      setCaseToDelete(null);
      setSelectedCases([]);
      refetch();
    },
    onError: (error: any) => {
      toast.error(`Erro ao deletar processo: ${error.message}`);
    },
  });

  const handleSelectAll = () => {
    if (deletedCases) {
      if (selectedCases.length === deletedCases.length) {
        setSelectedCases([]);
      } else {
        setSelectedCases(deletedCases.map((c) => c.id));
      }
    }
  };

  const handleSelectCase = (id: number) => {
    setSelectedCases((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  const handleRestoreSelected = () => {
    selectedCases.forEach((id) => {
      restoreMutation.mutate({ id });
    });
  };

  const handlePermanentDelete = (caseItem: DeletedCaseItem) => {
    setCaseToDelete(caseItem);
    setPermanentDeleteModal(true);
  };

  const handleConfirmPermanentDelete = () => {
    if (caseToDelete) {
      permanentDeleteMutation.mutate({ id: caseToDelete.id });
    }
  };

  const calculateDaysUntilExpiry = (deletedAt: Date | null) => {
    if (!deletedAt) return 0;
    const now = new Date();
    const deleted = new Date(deletedAt);
    const expiryDate = new Date(deleted.getTime() + 30 * 24 * 60 * 60 * 1000);
    const daysLeft = Math.ceil(
      (expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );
    return Math.max(0, daysLeft);
  };

  const formatDate = (date: Date | null) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("pt-BR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const hasDeletedCases = deletedCases && deletedCases.length > 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Lixeira</h1>
        <p className="text-muted-foreground mt-2">
          Processos deletados podem ser recuperados em até 30 dias
        </p>
      </div>

      {!hasDeletedCases ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Trash2 className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">Nenhum processo na lixeira</p>
            <p className="text-muted-foreground text-sm">
              Processos deletados aparecerão aqui
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Toolbar */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-sm text-muted-foreground">
                  {selectedCases.length} de {deletedCases.length} selecionado(s)
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRestoreSelected}
                    disabled={selectedCases.length === 0 || restoreMutation.isPending}
                    className="gap-2"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Restaurar Selecionados
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Table */}
          <Card>
            <CardHeader>
              <CardTitle>Processos Deletados</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox
                          checked={
                            deletedCases.length > 0 &&
                            selectedCases.length === deletedCases.length
                          }
                          onCheckedChange={handleSelectAll}
                        />
                      </TableHead>
                      <TableHead>Número do Processo</TableHead>
                      <TableHead>Título</TableHead>
                      <TableHead>Tribunal</TableHead>
                      <TableHead>Deletado em</TableHead>
                      <TableHead>Expira em</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {deletedCases.map((caseItem) => {
                      const daysLeft = calculateDaysUntilExpiry(caseItem.deletedAt);
                      const isExpiringSoon = daysLeft <= 7;

                      return (
                        <TableRow key={caseItem.id}>
                          <TableCell>
                            <Checkbox
                              checked={selectedCases.includes(caseItem.id)}
                              onCheckedChange={() =>
                                handleSelectCase(caseItem.id)
                              }
                            />
                          </TableCell>
                          <TableCell className="font-mono font-semibold">
                            {caseItem.caseNumber}
                          </TableCell>
                          <TableCell className="max-w-xs truncate">
                            {caseItem.title}
                          </TableCell>
                          <TableCell>{caseItem.court}</TableCell>
                          <TableCell className="text-sm">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-muted-foreground" />
                              {formatDate(caseItem.deletedAt)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {isExpiringSoon ? (
                                <Badge variant="destructive" className="gap-1">
                                  <AlertCircle className="w-3 h-3" />
                                  {daysLeft} dias
                                </Badge>
                              ) : (
                                <Badge variant="outline">
                                  {daysLeft} dias
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  restoreMutation.mutate({ id: caseItem.id })
                                }
                                disabled={restoreMutation.isPending}
                                title="Restaurar"
                                className="text-green-600 hover:bg-green-50"
                              >
                                <RotateCcw className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handlePermanentDelete(caseItem)}
                                disabled={permanentDeleteMutation.isPending}
                                title="Deletar Permanentemente"
                                className="text-destructive hover:bg-destructive/10"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Info Box */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="pt-6">
              <div className="flex gap-3">
                <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-900">
                  <p className="font-semibold">Informação sobre Lixeira</p>
                  <p className="mt-1">
                    Processos deletados são mantidos por 30 dias. Após este período,
                    serão permanentemente removidos do sistema. Você pode restaurar
                    processos a qualquer momento durante este período.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Permanent Delete Confirmation Modal */}
      {caseToDelete && (
        <DeleteConfirmationModal
          isOpen={permanentDeleteModal}
          caseNumber={caseToDelete.caseNumber}
          caseTitle={caseToDelete.title}
          isLoading={permanentDeleteMutation.isPending}
          onConfirm={handleConfirmPermanentDelete}
          onCancel={() => {
            setPermanentDeleteModal(false);
            setCaseToDelete(null);
          }}
        />
      )}
    </div>
  );
}
