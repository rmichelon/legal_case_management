import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Plus, Trash2, Edit2, Users } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const clientFormSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  phone: z.string().optional(),
  cpfCnpj: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  type: z.enum(["person", "company"]),
  notes: z.string().optional(),
});

type ClientFormData = z.infer<typeof clientFormSchema>;

export default function Clients() {
  const { isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const { data: clients = [], refetch } = trpc.clients.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const createMutation = trpc.clients.create.useMutation();
  const updateMutation = trpc.clients.update.useMutation();
  const deleteMutation = trpc.clients.delete.useMutation();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<ClientFormData>({
    resolver: zodResolver(clientFormSchema),
    defaultValues: {
      type: "person",
    },
  });

  const onSubmit = async (data: ClientFormData) => {
    try {
      if (editingId) {
        await updateMutation.mutateAsync({
          id: editingId,
          ...data,
        });
        toast.success("Cliente atualizado com sucesso!");
      } else {
        await createMutation.mutateAsync(data);
        toast.success("Cliente criado com sucesso!");
      }
      reset();
      setOpen(false);
      setEditingId(null);
      refetch();
    } catch (error: any) {
      toast.error(error.message || "Erro ao salvar cliente");
    }
  };

  const handleEdit = (client: any) => {
    setEditingId(client.id);
    setValue("name", client.name);
    setValue("email", client.email || "");
    setValue("phone", client.phone || "");
    setValue("cpfCnpj", client.cpfCnpj || "");
    setValue("address", client.address || "");
    setValue("city", client.city || "");
    setValue("state", client.state || "");
    setValue("zipCode", client.zipCode || "");
    setValue("type", client.type);
    setValue("notes", client.notes || "");
    setOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm("Tem certeza que deseja deletar este cliente?")) {
      try {
        await deleteMutation.mutateAsync({ id });
        toast.success("Cliente deletado com sucesso!");
        refetch();
      } catch (error: any) {
        toast.error(error.message || "Erro ao deletar cliente");
      }
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      reset();
      setEditingId(null);
    }
    setOpen(newOpen);
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
        <div className="container py-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-4xl font-bold text-foreground mb-2">Clientes</h1>
              <p className="text-muted-foreground">Gerencie seus clientes e partes</p>
            </div>
            <Dialog open={open} onOpenChange={handleOpenChange}>
              <DialogTrigger asChild>
                <Button className="bg-accent text-accent-foreground hover:bg-accent/90">
                  <Plus className="w-4 h-4 mr-2" />
                  Novo Cliente
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>
                    {editingId ? "Editar Cliente" : "Novo Cliente"}
                  </DialogTitle>
                  <DialogDescription>
                    {editingId
                      ? "Atualize as informações do cliente"
                      : "Adicione um novo cliente ou parte ao sistema"}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <div>
                    <Label htmlFor="name">Nome *</Label>
                    <Input
                      id="name"
                      placeholder="Nome completo"
                      {...register("name")}
                      className="mt-1"
                    />
                    {errors.name && (
                      <p className="text-xs text-destructive mt-1">
                        {errors.name.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="type">Tipo *</Label>
                    <Select
                      defaultValue={watch("type")}
                      onValueChange={(value) => setValue("type", value as any)}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="person">Pessoa Física</SelectItem>
                        <SelectItem value="company">Pessoa Jurídica</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="email@example.com"
                      {...register("email")}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="phone">Telefone</Label>
                    <Input
                      id="phone"
                      placeholder="(11) 99999-9999"
                      {...register("phone")}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="cpfCnpj">CPF/CNPJ</Label>
                    <Input
                      id="cpfCnpj"
                      placeholder="000.000.000-00"
                      {...register("cpfCnpj")}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="address">Endereço</Label>
                    <Input
                      id="address"
                      placeholder="Rua, número"
                      {...register("address")}
                      className="mt-1"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="city">Cidade</Label>
                      <Input
                        id="city"
                        placeholder="São Paulo"
                        {...register("city")}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="state">Estado</Label>
                      <Input
                        id="state"
                        placeholder="SP"
                        maxLength={2}
                        {...register("state")}
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="zipCode">CEP</Label>
                    <Input
                      id="zipCode"
                      placeholder="00000-000"
                      {...register("zipCode")}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="notes">Notas</Label>
                    <Input
                      id="notes"
                      placeholder="Observações adicionais"
                      {...register("notes")}
                      className="mt-1"
                    />
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => handleOpenChange(false)}
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="submit"
                      className="bg-accent text-accent-foreground hover:bg-accent/90"
                    >
                      {editingId ? "Atualizar" : "Criar"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container py-8">
        {clients.length === 0 ? (
          <Card>
            <CardContent className="pt-12 pb-12 text-center">
              <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Nenhum cliente cadastrado
              </h3>
              <p className="text-muted-foreground mb-6">
                Comece adicionando seu primeiro cliente ao sistema
              </p>
              <Dialog open={open} onOpenChange={handleOpenChange}>
                <DialogTrigger asChild>
                  <Button className="bg-accent text-accent-foreground hover:bg-accent/90">
                    <Plus className="w-4 h-4 mr-2" />
                    Criar Primeiro Cliente
                  </Button>
                </DialogTrigger>
              </Dialog>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {clients.map((client: any) => (
              <Card key={client.id} className="border-l-4 border-l-accent">
                <CardContent className="pt-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground text-lg">
                        {client.name}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {client.type === "person" ? "Pessoa Física" : "Pessoa Jurídica"}
                      </p>
                      {client.email && (
                        <p className="text-sm text-muted-foreground">
                          {client.email}
                        </p>
                      )}
                      {client.phone && (
                        <p className="text-sm text-muted-foreground">
                          {client.phone}
                        </p>
                      )}
                      {client.cpfCnpj && (
                        <p className="text-sm text-muted-foreground">
                          {client.cpfCnpj}
                        </p>
                      )}
                      {client.address && (
                        <p className="text-sm text-muted-foreground mt-2">
                          {client.address}
                          {client.city && `, ${client.city}`}
                          {client.state && ` - ${client.state}`}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(client)}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(client.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
