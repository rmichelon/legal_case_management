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
import { ArrowLeft } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const caseFormSchema = z.object({
  caseNumber: z.string().min(1, "Número do processo é obrigatório"),
  title: z.string().min(1, "Título é obrigatório"),
  description: z.string().optional(),
  caseType: z.string().min(1, "Tipo de ação é obrigatório"),
  court: z.string().min(1, "Vara é obrigatória"),
  judge: z.string().optional(),
  opposingParty: z.string().optional(),
  clientId: z.string().min(1, "Cliente é obrigatório"),
  fileNumber: z.string().optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]),
});

type CaseFormData = z.infer<typeof caseFormSchema>;

export default function CaseForm({ caseId }: { caseId?: string }) {
  const { isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: clients = [] } = trpc.clients.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const { data: caseData } = trpc.cases.get.useQuery(
    { id: parseInt(caseId || "0") },
    { enabled: !!caseId && isAuthenticated }
  );

  const createCaseMutation = trpc.cases.create.useMutation();
  const updateCaseMutation = trpc.cases.update.useMutation();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<CaseFormData>({
    resolver: zodResolver(caseFormSchema),
    defaultValues: {
      priority: "medium",
    },
  });

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
      setValue("priority", caseData.priority);
    }
  }, [caseData, setValue]);

  const onSubmit = async (data: CaseFormData) => {
    setIsSubmitting(true);
    try {
      if (caseId) {
        await updateCaseMutation.mutateAsync({
          id: parseInt(caseId),
          ...data,
          clientId: parseInt(data.clientId),
        });
        toast.success("Processo atualizado com sucesso!");
      } else {
        await createCaseMutation.mutateAsync({
          ...data,
          clientId: parseInt(data.clientId),
        });
        toast.success("Processo criado com sucesso!");
      }
      navigate("/dashboard");
    } catch (error: any) {
      toast.error(error.message || "Erro ao salvar processo");
    } finally {
      setIsSubmitting(false);
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
          <h1 className="text-4xl font-bold text-foreground">
            {caseId ? "Editar Processo" : "Novo Processo"}
          </h1>
        </div>
      </div>

      {/* Form */}
      <div className="container py-8">
        <div className="max-w-3xl">
          <Card>
            <CardHeader className="border-b border-border">
              <CardTitle>Informações do Processo</CardTitle>
              <CardDescription>
                Preencha os dados do processo judicial
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Número do Processo */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="caseNumber">Número do Processo *</Label>
                    <Input
                      id="caseNumber"
                      placeholder="0000000-00.0000.0.00.0000"
                      {...register("caseNumber")}
                      className="mt-2"
                    />
                    {errors.caseNumber && (
                      <p className="text-xs text-destructive mt-1">
                        {errors.caseNumber.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="fileNumber">Número do Autos</Label>
                    <Input
                      id="fileNumber"
                      placeholder="Ex: 1234567"
                      {...register("fileNumber")}
                      className="mt-2"
                    />
                  </div>
                </div>

                {/* Título */}
                <div>
                  <Label htmlFor="title">Título do Processo *</Label>
                  <Input
                    id="title"
                    placeholder="Ex: Ação Cível de Cobrança"
                    {...register("title")}
                    className="mt-2"
                  />
                  {errors.title && (
                    <p className="text-xs text-destructive mt-1">
                      {errors.title.message}
                    </p>
                  )}
                </div>

                {/* Descrição */}
                <div>
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    placeholder="Descreva os detalhes do processo..."
                    {...register("description")}
                    className="mt-2"
                    rows={4}
                  />
                </div>

                {/* Tipo de Ação e Vara */}
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
                      <p className="text-xs text-destructive mt-1">
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
                      <p className="text-xs text-destructive mt-1">
                        {errors.court.message}
                      </p>
                    )}
                  </div>
                </div>

                {/* Juiz e Parte Contrária */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="judge">Juiz</Label>
                    <Input
                      id="judge"
                      placeholder="Nome do juiz"
                      {...register("judge")}
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label htmlFor="opposingParty">Parte Contrária</Label>
                    <Input
                      id="opposingParty"
                      placeholder="Nome da parte contrária"
                      {...register("opposingParty")}
                      className="mt-2"
                    />
                  </div>
                </div>

                {/* Cliente e Prioridade */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                        {clients.map((client: any) => (
                          <SelectItem key={client.id} value={client.id.toString()}>
                            {client.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.clientId && (
                      <p className="text-xs text-destructive mt-1">
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
                </div>

                {/* Buttons */}
                <div className="flex gap-4 pt-6 border-t border-border">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate("/dashboard")}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    className="bg-accent text-accent-foreground hover:bg-accent/90"
                    disabled={isSubmitting}
                  >
                    {isSubmitting
                      ? "Salvando..."
                      : caseId
                      ? "Atualizar Processo"
                      : "Criar Processo"}
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
