import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { ArrowLeft, AlertCircle, CheckCircle2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

// Schema com validação robusta
const caseFormSchema = z.object({
  caseNumber: z.string()
    .min(1, "Número do processo é obrigatório")
    .regex(/^\d{7}-\d{2}\.\d{4}\.\d\.\d{2}\.\d{4}$|^[\d\w\-\.]+$/, "Formato inválido para número do processo"),
  title: z.string()
    .min(3, "Título deve ter pelo menos 3 caracteres")
    .max(255, "Título não pode exceder 255 caracteres"),
  description: z.string()
    .max(5000, "Descrição não pode exceder 5000 caracteres")
    .optional()
    .or(z.literal("")),
  caseType: z.string()
    .min(1, "Tipo de ação é obrigatório")
    .max(100, "Tipo de ação não pode exceder 100 caracteres"),
  court: z.string()
    .min(1, "Vara é obrigatória")
    .max(255, "Vara não pode exceder 255 caracteres"),
  judge: z.string()
    .max(255, "Nome do juiz não pode exceder 255 caracteres")
    .optional()
    .or(z.literal("")),
  opposingParty: z.string()
    .max(255, "Parte contrária não pode exceder 255 caracteres")
    .optional()
    .or(z.literal("")),
  clientId: z.string()
    .min(1, "Cliente é obrigatório"),
  fileNumber: z.string()
    .max(50, "Número de autos não pode exceder 50 caracteres")
    .optional()
    .or(z.literal("")),
  status: z.enum(["open", "suspended", "closed", "archived"]),
  priority: z.enum(["low", "medium", "high", "urgent"]),
  filingDate: z.string().optional().or(z.literal("")),
  estimatedClosureDate: z.string().optional().or(z.literal("")),
});

type CaseFormData = z.infer<typeof caseFormSchema>;

export default function CaseForm({ caseId }: { caseId?: string }) {
  const { isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const { data: clients = [] } = trpc.clients.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const { data: caseData, isLoading: caseLoading } = trpc.cases.get.useQuery(
    { id: parseInt(caseId || "0") },
    { enabled: !!caseId && isAuthenticated }
  );

  const createCaseMutation = trpc.cases.create.useMutation();
  const updateCaseMutation = trpc.cases.update.useMutation();

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    setValue,
    watch,
    reset,
  } = useForm<CaseFormData>({
    resolver: zodResolver(caseFormSchema),
    mode: "onBlur",
    defaultValues: {
      priority: "medium",
      status: "open",
    },
  });

  // Preencher formulário com dados existentes
  useEffect(() => {
    if (caseData) {
      setValue("caseNumber", caseData.caseNumber);
      setValue("title", caseData.title);
      setValue("description", caseData.description || "");
      setValue("caseType", caseData.caseType);
      setValue("court", caseData.court);
      setValue("judge", caseData.judge || "");
      setValue("opposingParty", caseData.opposingParty || "");
      setValue("clientId", caseData.clientId.toString());
      setValue("fileNumber", caseData.fileNumber || "");
      setValue("status", caseData.status);
      setValue("priority", caseData.priority);
      
      if (caseData.filingDate) {
        const date = new Date(caseData.filingDate);
        setValue("filingDate", date.toISOString().split('T')[0]);
      }
      
      if (caseData.estimatedClosureDate) {
        const date = new Date(caseData.estimatedClosureDate);
        setValue("estimatedClosureDate", date.toISOString().split('T')[0]);
      }
    }
  }, [caseData, setValue]);

  // Validar datas
  const validateDates = (filingDate?: string, closureDate?: string): boolean => {
    if (filingDate && closureDate) {
      const filing = new Date(filingDate);
      const closure = new Date(closureDate);
      if (closure <= filing) {
        setValidationErrors({
          estimatedClosureDate: "Data de encerramento deve ser posterior à data de protocolo"
        });
        return false;
      }
    }
    setValidationErrors({});
    return true;
  };

  const onSubmit = async (data: CaseFormData) => {
    // Validar datas
    if (!validateDates(data.filingDate, data.estimatedClosureDate)) {
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        ...data,
        clientId: parseInt(data.clientId),
        filingDate: data.filingDate ? new Date(data.filingDate) : undefined,
        estimatedClosureDate: data.estimatedClosureDate ? new Date(data.estimatedClosureDate) : undefined,
      };

      if (caseId) {
        await updateCaseMutation.mutateAsync({
          id: parseInt(caseId),
          ...payload,
        });
        toast.success("✅ Processo atualizado com sucesso!");
        navigate(`/cases/${caseId}`);
      } else {
        const result = await createCaseMutation.mutateAsync(payload);
        toast.success("✅ Processo criado com sucesso!");
        navigate(`/cases/${result.id}`);
      }
    } catch (error: any) {
      const errorMessage = error.message || "Erro ao salvar processo";
      toast.error(`❌ ${errorMessage}`);
      
      // Se for erro de número duplicado, focar no campo
      if (errorMessage.includes("já existe")) {
        setValidationErrors({
          caseNumber: "Este número de processo já está cadastrado"
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading || caseLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-accent mx-auto mb-4"></div>
          <p className="text-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  const isEditing = !!caseId;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border">
        <div className="container py-6">
          <Button
            variant="ghost"
            onClick={() => navigate(isEditing ? `/cases/${caseId}` : "/cases")}
            className="mb-4 -ml-2"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-foreground">
                {isEditing ? "Editar Processo" : "Novo Processo"}
              </h1>
              <p className="text-muted-foreground mt-2">
                {isEditing 
                  ? `Atualize os dados do processo ${caseData?.caseNumber}`
                  : "Cadastre um novo processo judicial"}
              </p>
            </div>
            {isDirty && (
              <div className="flex items-center gap-2 text-amber-600">
                <AlertCircle className="w-5 h-5" />
                <span className="text-sm font-medium">Alterações não salvas</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="container py-8">
        <div className="max-w-4xl">
          <Card>
            <CardHeader className="border-b border-border">
              <CardTitle>Informações do Processo</CardTitle>
              <CardDescription>
                Os campos marcados com * são obrigatórios
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                {/* Seção 1: Identificação do Processo */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-foreground">Identificação</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="caseNumber">Número do Processo *</Label>
                      <Input
                        id="caseNumber"
                        placeholder="0000000-00.0000.0.00.0000"
                        {...register("caseNumber")}
                        className="mt-2"
                        disabled={isEditing}
                      />
                      {errors.caseNumber && (
                        <p className="text-xs text-destructive mt-1 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {errors.caseNumber.message}
                        </p>
                      )}
                      {validationErrors.caseNumber && (
                        <p className="text-xs text-destructive mt-1 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {validationErrors.caseNumber}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="fileNumber">Número de Autos</Label>
                      <Input
                        id="fileNumber"
                        placeholder="Ex: 1234567"
                        {...register("fileNumber")}
                        className="mt-2"
                      />
                      {errors.fileNumber && (
                        <p className="text-xs text-destructive mt-1">
                          {errors.fileNumber.message}
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="title">Título do Processo *</Label>
                    <Input
                      id="title"
                      placeholder="Ex: Ação Cível de Cobrança"
                      {...register("title")}
                      className="mt-2"
                    />
                    {errors.title && (
                      <p className="text-xs text-destructive mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {errors.title.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="description">Descrição</Label>
                    <Textarea
                      id="description"
                      placeholder="Descreva os detalhes do processo..."
                      {...register("description")}
                      className="mt-2"
                      rows={4}
                    />
                    {errors.description && (
                      <p className="text-xs text-destructive mt-1">
                        {errors.description.message}
                      </p>
                    )}
                  </div>
                </div>

                {/* Seção 2: Dados Judiciais */}
                <div className="space-y-4 pt-6 border-t border-border">
                  <h3 className="text-lg font-semibold text-foreground">Dados Judiciais</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="caseType">Tipo de Ação *</Label>
                      <Input
                        id="caseType"
                        placeholder="Ex: Ação Cível, Trabalhista"
                        {...register("caseType")}
                        className="mt-2"
                      />
                      {errors.caseType && (
                        <p className="text-xs text-destructive mt-1 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {errors.caseType.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="court">Vara *</Label>
                      <Input
                        id="court"
                        placeholder="Ex: Vara Cível"
                        {...register("court")}
                        className="mt-2"
                      />
                      {errors.court && (
                        <p className="text-xs text-destructive mt-1 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {errors.court.message}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="judge">Juiz</Label>
                      <Input
                        id="judge"
                        placeholder="Nome do juiz"
                        {...register("judge")}
                        className="mt-2"
                      />
                      {errors.judge && (
                        <p className="text-xs text-destructive mt-1">
                          {errors.judge.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="opposingParty">Parte Contrária</Label>
                      <Input
                        id="opposingParty"
                        placeholder="Nome da parte contrária"
                        {...register("opposingParty")}
                        className="mt-2"
                      />
                      {errors.opposingParty && (
                        <p className="text-xs text-destructive mt-1">
                          {errors.opposingParty.message}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Seção 3: Datas */}
                <div className="space-y-4 pt-6 border-t border-border">
                  <h3 className="text-lg font-semibold text-foreground">Datas</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="filingDate">Data de Protocolo</Label>
                      <Input
                        id="filingDate"
                        type="date"
                        {...register("filingDate")}
                        className="mt-2"
                      />
                      {errors.filingDate && (
                        <p className="text-xs text-destructive mt-1">
                          {errors.filingDate.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="estimatedClosureDate">Data Estimada de Encerramento</Label>
                      <Input
                        id="estimatedClosureDate"
                        type="date"
                        {...register("estimatedClosureDate")}
                        className="mt-2"
                      />
                      {errors.estimatedClosureDate && (
                        <p className="text-xs text-destructive mt-1 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {errors.estimatedClosureDate.message}
                        </p>
                      )}
                      {validationErrors.estimatedClosureDate && (
                        <p className="text-xs text-destructive mt-1 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {validationErrors.estimatedClosureDate}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Seção 4: Gestão */}
                <div className="space-y-4 pt-6 border-t border-border">
                  <h3 className="text-lg font-semibold text-foreground">Gestão</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <Label htmlFor="clientId">Cliente *</Label>
                      <Select
                        defaultValue={watch("clientId")}
                        onValueChange={(value) => setValue("clientId", value)}
                      >
                        <SelectTrigger className="mt-2">
                          <SelectValue placeholder="Selecione um cliente" />
                        </SelectTrigger>
                        <SelectContent>
                          {clients.length === 0 ? (
                            <div className="p-2 text-sm text-muted-foreground">
                              Nenhum cliente disponível
                            </div>
                          ) : (
                            clients.map((client: any) => (
                              <SelectItem key={client.id} value={client.id.toString()}>
                                {client.name}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      {errors.clientId && (
                        <p className="text-xs text-destructive mt-1 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {errors.clientId.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="priority">Prioridade</Label>
                      <Select
                        defaultValue={watch("priority")}
                        onValueChange={(value) =>
                          setValue("priority", value as any)
                        }
                      >
                        <SelectTrigger className="mt-2">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Baixa</SelectItem>
                          <SelectItem value="medium">Média</SelectItem>
                          <SelectItem value="high">Alta</SelectItem>
                          <SelectItem value="urgent">Urgente</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {isEditing && (
                      <div>
                        <Label htmlFor="status">Status</Label>
                        <Select
                          defaultValue={watch("status")}
                          onValueChange={(value) =>
                            setValue("status", value as any)
                          }
                        >
                          <SelectTrigger className="mt-2">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="open">Aberto</SelectItem>
                            <SelectItem value="suspended">Suspenso</SelectItem>
                            <SelectItem value="closed">Encerrado</SelectItem>
                            <SelectItem value="archived">Arquivado</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                </div>

                {/* Buttons */}
                <div className="flex gap-4 pt-8 border-t border-border">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate(isEditing ? `/cases/${caseId}` : "/cases")}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    className="bg-accent text-accent-foreground hover:bg-accent/90"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-accent-foreground mr-2"></div>
                        Salvando...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        {isEditing ? "Atualizar Processo" : "Criar Processo"}
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
