import { useParams, useLocation } from "wouter";
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Loader2, ArrowLeft, RefreshCw, Edit2, CheckCircle2, AlertCircle, Clock } from "lucide-react";
import { toast } from "sonner";
import CaseEditForm from "@/components/CaseEditForm";
import CaseInteractionTimeline from "@/components/CaseInteractionTimeline";
import CaseAuditLog from "@/components/CaseAuditLog";
import TribunalSyncPanel from "@/components/TribunalSyncPanel";

export default function CaseDetailPage() {
  const { caseId } = useParams<{ caseId: string }>();
  const [, navigate] = useLocation();
  const [isEditing, setIsEditing] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const caseIdNum = caseId ? parseInt(caseId) : 0;

  // Fetch case data with court data
  const { data: caseData, isLoading, refetch } = trpc.caseManagement.getCaseWithCourtData.useQuery(
    { caseId: caseIdNum },
    { enabled: caseIdNum > 0 }
  );

  // Sync mutation
  const syncMutation = trpc.caseManagement.syncCaseFromTribunal.useMutation({
    onSuccess: () => {
      toast.success("Processo sincronizado com sucesso!");
      refetch();
      setIsSyncing(false);
    },
    onError: (error) => {
      toast.error(`Erro ao sincronizar: ${error.message}`);
      setIsSyncing(false);
    },
  });

  const handleSync = async () => {
    setIsSyncing(true);
    await syncMutation.mutateAsync({
      caseId: caseIdNum,
      processNumber: caseData?.case.caseNumber || "",
    });
  };

  const handleBack = () => {
    navigate("/");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-red-600" />
      </div>
    );
  }

  if (!caseData) {
    return (
      <div className="container mx-auto py-8">
        <Button onClick={handleBack} variant="outline" className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-gray-500">Processo não encontrado</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { case: caseInfo, courtData, interactions } = caseData;
  const statusColors: Record<string, string> = {
    open: "bg-blue-100 text-blue-800",
    closed: "bg-green-100 text-green-800",
    suspended: "bg-yellow-100 text-yellow-800",
    archived: "bg-gray-100 text-gray-800",
  };

  return (
    <div className="container mx-auto py-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button onClick={handleBack} variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{caseInfo.title}</h1>
            <p className="text-gray-600 mt-1">Processo: {caseInfo.caseNumber}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleSync}
            disabled={isSyncing}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isSyncing ? "animate-spin" : ""}`} />
            {isSyncing ? "Sincronizando..." : "Sincronizar"}
          </Button>
          <Button
            onClick={() => setIsEditing(!isEditing)}
            variant={isEditing ? "default" : "outline"}
            size="sm"
          >
            <Edit2 className="w-4 h-4 mr-2" />
            {isEditing ? "Cancelar" : "Editar"}
          </Button>
        </div>
      </div>

      {/* Status and Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Status</p>
                <Badge className={statusColors[caseInfo.status] || "bg-gray-100 text-gray-800"}>
                  {caseInfo.status}
                </Badge>
              </div>
              <CheckCircle2 className="w-8 h-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Tipo</p>
                <p className="font-semibold text-gray-900">{caseInfo.caseType}</p>
              </div>
              <Clock className="w-8 h-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Tribunal</p>
                <p className="font-semibold text-gray-900">{courtData?.courtName || "—"}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Juiz</p>
                <p className="font-semibold text-gray-900">{courtData?.judge || "—"}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="info" className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-6">
          <TabsTrigger value="info">Informações</TabsTrigger>
          <TabsTrigger value="tribunal">Tribunal</TabsTrigger>
          <TabsTrigger value="history">Histórico</TabsTrigger>
          <TabsTrigger value="audit">Auditoria</TabsTrigger>
        </TabsList>

        {/* Informações Tab */}
        <TabsContent value="info">
          {isEditing ? (
            <CaseEditForm
              caseId={caseIdNum}
              initialData={caseInfo}
              onSuccess={() => {
                setIsEditing(false);
                refetch();
              }}
            />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Informações do Processo</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Número do Processo</p>
                    <p className="font-semibold text-gray-900">{caseInfo.caseNumber}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Tipo de Ação</p>
                    <p className="font-semibold text-gray-900">{caseInfo.caseType}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Tribunal</p>
                    <p className="font-semibold text-gray-900">{caseInfo.court}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Prioridade</p>
                    <Badge variant="outline">{caseInfo.priority}</Badge>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Descrição</p>
                  <p className="text-gray-900 mt-1">{caseInfo.description}</p>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                  <div>
                    <p>Criado em: {new Date(caseInfo.createdAt).toLocaleDateString("pt-BR")}</p>
                  </div>
                  <div>
                    <p>Atualizado em: {new Date(caseInfo.updatedAt).toLocaleDateString("pt-BR")}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Tribunal Tab */}
        <TabsContent value="tribunal">
          <TribunalSyncPanel caseId={caseIdNum} courtData={courtData} />
        </TabsContent>

        {/* Histórico Tab */}
        <TabsContent value="history">
          <CaseInteractionTimeline interactions={interactions || []} />
        </TabsContent>

        {/* Auditoria Tab */}
        <TabsContent value="audit">
          <CaseAuditLog caseId={caseIdNum} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
