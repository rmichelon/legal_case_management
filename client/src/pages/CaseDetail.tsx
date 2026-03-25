import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { useEffect, useState, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { ArrowLeft, Plus, Trash2, Upload, Calendar, FileText, MessageSquare } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function CaseDetail({ caseId }: { caseId: string }) {
  const { isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();
  const [deadlineOpen, setDeadlineOpen] = useState(false);
  const [movementOpen, setMovementOpen] = useState(false);
  const [documentOpen, setDocumentOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: caseData } = trpc.cases.get.useQuery(
    { id: parseInt(caseId) },
    { enabled: !!caseId && isAuthenticated }
  );

  const { data: deadlines = [], refetch: refetchDeadlines } = trpc.deadlines.listByCase.useQuery(
    { caseId: parseInt(caseId) },
    { enabled: !!caseId && isAuthenticated }
  );

  const { data: documents = [], refetch: refetchDocuments } = trpc.documents.listByCase.useQuery(
    { caseId: parseInt(caseId) },
    { enabled: !!caseId && isAuthenticated }
  );

  const { data: movements = [], refetch: refetchMovements } = trpc.movements.listByCase.useQuery(
    { caseId: parseInt(caseId) },
    { enabled: !!caseId && isAuthenticated }
  );

  const createDeadlineMutation = trpc.deadlines.create.useMutation();
  const updateDeadlineMutation = trpc.deadlines.update.useMutation();
  const createMovementMutation = trpc.movements.create.useMutation();
  const uploadDocumentMutation = trpc.documents.upload.useMutation();
  const deleteDocumentMutation = trpc.documents.delete.useMutation();

  const [deadlineForm, setDeadlineForm] = useState({
    title: "",
    description: "",
    dueDate: "",
    type: "other",
  });

  const [movementForm, setMovementForm] = useState({
    title: "",
    description: "",
    type: "",
    date: "",
  });

  const handleAddDeadline = async () => {
    if (!deadlineForm.title || !deadlineForm.dueDate) {
      toast.error("Preencha os campos obrigatórios");
      return;
    }

    try {
      await createDeadlineMutation.mutateAsync({
        caseId: parseInt(caseId),
        title: deadlineForm.title,
        description: deadlineForm.description,
        dueDate: new Date(deadlineForm.dueDate),
        type: deadlineForm.type as any,
      });
      toast.success("Prazo adicionado com sucesso!");
      setDeadlineForm({ title: "", description: "", dueDate: "", type: "other" });
      setDeadlineOpen(false);
      refetchDeadlines();
    } catch (error: any) {
      toast.error(error.message || "Erro ao adicionar prazo");
    }
  };

  const handleAddMovement = async () => {
    if (!movementForm.title || !movementForm.type || !movementForm.date) {
      toast.error("Preencha os campos obrigatórios");
      return;
    }

    try {
      await createMovementMutation.mutateAsync({
        caseId: parseInt(caseId),
        title: movementForm.title,
        description: movementForm.description,
        type: movementForm.type,
        date: new Date(movementForm.date),
      });
      toast.success("Movimentação adicionada com sucesso!");
      setMovementForm({ title: "", description: "", type: "", date: "" });
      setMovementOpen(false);
      refetchMovements();
    } catch (error: any) {
      toast.error(error.message || "Erro ao adicionar movimentação");
    }
  };

  const handleUploadDocument = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const buffer = await file.arrayBuffer();
      await uploadDocumentMutation.mutateAsync({
        caseId: parseInt(caseId),
        name: file.name,
        description: "",
        documentType: "other",
        file: Buffer.from(buffer),
        mimeType: file.type,
      });
      toast.success("Documento enviado com sucesso!");
      setDocumentOpen(false);
      refetchDocuments();
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (error: any) {
      toast.error(error.message || "Erro ao enviar documento");
    }
  };

  const handleDeleteDocument = async (id: number) => {
    if (confirm("Tem certeza que deseja deletar este documento?")) {
      try {
        await deleteDocumentMutation.mutateAsync({ id });
        toast.success("Documento deletado com sucesso!");
        refetchDocuments();
      } catch (error: any) {
        toast.error(error.message || "Erro ao deletar documento");
      }
    }
  };

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

  if (!caseData) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container py-8">
          <Button variant="ghost" onClick={() => navigate("/dashboard")} className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <Card>
            <CardContent className="pt-12 pb-12 text-center">
              <p className="text-muted-foreground">Processo não encontrado</p>
            </CardContent>
          </Card>
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
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-4xl font-bold text-foreground">{caseData.title}</h1>
              <p className="text-muted-foreground mt-2">{caseData.caseNumber}</p>
            </div>
            <Badge
              variant={caseData.status === "open" ? "default" : "secondary"}
              className="text-sm"
            >
              {caseData.status === "open" ? "Ativo" : caseData.status}
            </Badge>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
          {/* Info Cards */}
          <Card className="border-l-4 border-l-accent">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Tipo</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-semibold text-foreground">{caseData.caseType}</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-accent">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Vara</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-semibold text-foreground">{caseData.court}</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-accent">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Prioridade</CardTitle>
            </CardHeader>
            <CardContent>
              <Badge className="bg-accent text-accent-foreground">
                {caseData.priority}
              </Badge>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-accent">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Prazos</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-semibold text-foreground">{deadlines.length}</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="deadlines" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="deadlines">Prazos</TabsTrigger>
            <TabsTrigger value="documents">Documentos</TabsTrigger>
            <TabsTrigger value="movements">Movimentações</TabsTrigger>
            <TabsTrigger value="chat">Chat</TabsTrigger>
          </TabsList>

          {/* Deadlines Tab */}
          <TabsContent value="deadlines">
            <Card>
              <CardHeader className="border-b border-border flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Prazos Processuais</CardTitle>
                  <CardDescription>Datas importantes do processo</CardDescription>
                </div>
                <Dialog open={deadlineOpen} onOpenChange={setDeadlineOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-accent text-accent-foreground hover:bg-accent/90">
                      <Plus className="w-4 h-4 mr-2" />
                      Novo Prazo
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Adicionar Prazo</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="deadline-title">Título *</Label>
                        <Input
                          id="deadline-title"
                          value={deadlineForm.title}
                          onChange={(e) =>
                            setDeadlineForm({ ...deadlineForm, title: e.target.value })
                          }
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="deadline-date">Data *</Label>
                        <Input
                          id="deadline-date"
                          type="date"
                          value={deadlineForm.dueDate}
                          onChange={(e) =>
                            setDeadlineForm({ ...deadlineForm, dueDate: e.target.value })
                          }
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="deadline-type">Tipo</Label>
                        <Select
                          value={deadlineForm.type}
                          onValueChange={(value) =>
                            setDeadlineForm({ ...deadlineForm, type: value })
                          }
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="hearing">Audiência</SelectItem>
                            <SelectItem value="filing">Petição</SelectItem>
                            <SelectItem value="response">Resposta</SelectItem>
                            <SelectItem value="appeal">Apelação</SelectItem>
                            <SelectItem value="payment">Pagamento</SelectItem>
                            <SelectItem value="other">Outro</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="deadline-desc">Descrição</Label>
                        <Textarea
                          id="deadline-desc"
                          value={deadlineForm.description}
                          onChange={(e) =>
                            setDeadlineForm({ ...deadlineForm, description: e.target.value })
                          }
                          className="mt-1"
                          rows={3}
                        />
                      </div>
                      <Button
                        onClick={handleAddDeadline}
                        className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
                      >
                        Adicionar
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent className="pt-6">
                {deadlines.length === 0 ? (
                  <div className="text-center py-8">
                    <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                    <p className="text-muted-foreground">Nenhum prazo cadastrado</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {deadlines.map((deadline: any) => (
                      <div
                        key={deadline.id}
                        className="flex items-start gap-4 pb-4 border-b border-border last:border-0"
                      >
                        <div className="flex-shrink-0 w-1 bg-accent rounded-full mt-2"></div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-foreground">{deadline.title}</h4>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(deadline.dueDate), "dd 'de' MMMM 'de' yyyy", {
                              locale: ptBR,
                            })}
                          </p>
                          <Badge variant="outline" className="text-xs mt-2">
                            {deadline.type}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Documents Tab */}
          <TabsContent value="documents">
            <Card>
              <CardHeader className="border-b border-border flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Documentos</CardTitle>
                  <CardDescription>Arquivos do processo</CardDescription>
                </div>
                <Dialog open={documentOpen} onOpenChange={setDocumentOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-accent text-accent-foreground hover:bg-accent/90">
                      <Upload className="w-4 h-4 mr-2" />
                      Enviar Documento
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Enviar Documento</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="file-input">Selecione o arquivo</Label>
                        <Input
                          id="file-input"
                          type="file"
                          ref={fileInputRef}
                          onChange={handleUploadDocument}
                          className="mt-1"
                        />
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent className="pt-6">
                {documents.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                    <p className="text-muted-foreground">Nenhum documento enviado</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {documents.map((doc: any) => (
                      <div
                        key={doc.id}
                        className="flex items-center justify-between p-3 border border-border rounded hover:bg-muted/50"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground truncate">{doc.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {(doc.fileSize / 1024).toFixed(2)} KB
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <a
                            href={doc.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-accent hover:underline text-sm"
                          >
                            Baixar
                          </a>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteDocument(doc.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Movements Tab */}
          <TabsContent value="movements">
            <Card>
              <CardHeader className="border-b border-border flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Histórico de Movimentações</CardTitle>
                  <CardDescription>Atualizações do processo</CardDescription>
                </div>
                <Dialog open={movementOpen} onOpenChange={setMovementOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-accent text-accent-foreground hover:bg-accent/90">
                      <Plus className="w-4 h-4 mr-2" />
                      Nova Movimentação
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Adicionar Movimentação</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="movement-title">Título *</Label>
                        <Input
                          id="movement-title"
                          value={movementForm.title}
                          onChange={(e) =>
                            setMovementForm({ ...movementForm, title: e.target.value })
                          }
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="movement-type">Tipo *</Label>
                        <Input
                          id="movement-type"
                          placeholder="Ex: Sentença, Apelação"
                          value={movementForm.type}
                          onChange={(e) =>
                            setMovementForm({ ...movementForm, type: e.target.value })
                          }
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="movement-date">Data *</Label>
                        <Input
                          id="movement-date"
                          type="date"
                          value={movementForm.date}
                          onChange={(e) =>
                            setMovementForm({ ...movementForm, date: e.target.value })
                          }
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="movement-desc">Descrição</Label>
                        <Textarea
                          id="movement-desc"
                          value={movementForm.description}
                          onChange={(e) =>
                            setMovementForm({ ...movementForm, description: e.target.value })
                          }
                          className="mt-1"
                          rows={3}
                        />
                      </div>
                      <Button
                        onClick={handleAddMovement}
                        className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
                      >
                        Adicionar
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent className="pt-6">
                {movements.length === 0 ? (
                  <div className="text-center py-8">
                    <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                    <p className="text-muted-foreground">Nenhuma movimentação registrada</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {movements.map((movement: any) => (
                      <div
                        key={movement.id}
                        className="flex items-start gap-4 pb-4 border-b border-border last:border-0"
                      >
                        <div className="flex-shrink-0 w-1 bg-accent rounded-full mt-2"></div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-foreground">{movement.title}</h4>
                          <p className="text-sm text-muted-foreground">
                            {movement.type} • {format(new Date(movement.date), "dd/MM/yyyy")}
                          </p>
                          {movement.description && (
                            <p className="text-sm text-muted-foreground mt-2">
                              {movement.description}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Chat Tab */}
          <TabsContent value="chat">
            <Card>
              <CardHeader>
                <CardTitle>Assistente Jurídico</CardTitle>
                <CardDescription>
                  Converse com nosso assistente inteligente para redação de petições, análise de documentos e jurisprudência
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                  <p className="text-muted-foreground mb-4">
                    Chatbot inteligente será implementado na próxima fase
                  </p>
                  <Button className="bg-accent text-accent-foreground hover:bg-accent/90" disabled>
                    Em Desenvolvimento
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
