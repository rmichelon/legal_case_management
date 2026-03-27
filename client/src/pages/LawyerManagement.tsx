import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Trash2, Edit2, Eye } from "lucide-react";
import { useRouter } from "wouter";

export function LawyerManagement() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    oabNumber: "",
    oabState: "",
    yearsOfExperience: "",
    hourlyRate: "",
    officeLocation: "",
  });

  const [, navigate] = useRouter() as any;
  const utils = trpc.useUtils();

  // Queries
  const { data: lawyers = [], isLoading } = trpc.lawyers.list.useQuery();
  const { data: searchResults = [] } = trpc.lawyers.search.useQuery(
    { query: searchQuery },
    { enabled: searchQuery.length > 0 }
  );

  // Mutations
  const createMutation = trpc.lawyers.create.useMutation({
    onSuccess: () => {
      utils.lawyers.list.invalidate();
      setIsCreateDialogOpen(false);
      setFormData({
        name: "",
        email: "",
        phone: "",
        oabNumber: "",
        oabState: "",
        yearsOfExperience: "",
        hourlyRate: "",
        officeLocation: "",
      });
    },
  });

  const deleteMutation = trpc.lawyers.delete.useMutation({
    onSuccess: () => {
      utils.lawyers.list.invalidate();
    },
  });

  const displayedLawyers = searchQuery ? searchResults : lawyers;

  const handleCreateLawyer = async (e: React.FormEvent) => {
    e.preventDefault();
    await createMutation.mutateAsync({
      name: formData.name,
      email: formData.email,
      phone: formData.phone || undefined,
      oabNumber: formData.oabNumber || undefined,
      oabState: formData.oabState || undefined,
      yearsOfExperience: formData.yearsOfExperience ? parseInt(formData.yearsOfExperience) : undefined,
      hourlyRate: formData.hourlyRate ? parseFloat(formData.hourlyRate) : undefined,
      officeLocation: formData.officeLocation || undefined,
    });
  };

  const handleDeleteLawyer = async (id: number) => {
    if (confirm("Tem certeza que deseja deletar este advogado?")) {
      await deleteMutation.mutateAsync({ id });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "inactive":
        return "bg-gray-100 text-gray-800";
      case "on_leave":
        return "bg-yellow-100 text-yellow-800";
      case "retired":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "active":
        return "Ativo";
      case "inactive":
        return "Inativo";
      case "on_leave":
        return "Licença";
      case "retired":
        return "Aposentado";
      default:
        return status;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gestão de Advogados</h1>
          <p className="text-gray-600 mt-2">Gerencie advogados da sua firma</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-pink-600 hover:bg-pink-700">
              <Plus className="w-4 h-4 mr-2" />
              Novo Advogado
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar Novo Advogado</DialogTitle>
              <DialogDescription>
                Preencha os dados do advogado para adicioná-lo ao sistema
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateLawyer} className="space-y-4">
              <div>
                <label className="text-sm font-medium">Nome *</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Nome completo"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium">Email *</label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="email@example.com"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium">Telefone</label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="(11) 99999-9999"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Número OAB</label>
                  <Input
                    value={formData.oabNumber}
                    onChange={(e) => setFormData({ ...formData, oabNumber: e.target.value })}
                    placeholder="123456"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Estado OAB</label>
                  <Input
                    value={formData.oabState}
                    onChange={(e) => setFormData({ ...formData, oabState: e.target.value })}
                    placeholder="SP"
                    maxLength={2}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Anos de Experiência</label>
                  <Input
                    type="number"
                    value={formData.yearsOfExperience}
                    onChange={(e) => setFormData({ ...formData, yearsOfExperience: e.target.value })}
                    placeholder="5"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Valor Hora (R$)</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.hourlyRate}
                    onChange={(e) => setFormData({ ...formData, hourlyRate: e.target.value })}
                    placeholder="150.00"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Localização do Escritório</label>
                <Input
                  value={formData.officeLocation}
                  onChange={(e) => setFormData({ ...formData, officeLocation: e.target.value })}
                  placeholder="Rua X, Número Y, São Paulo"
                />
              </div>
              <Button type="submit" className="w-full bg-pink-600 hover:bg-pink-700" disabled={createMutation.isPending}>
                {createMutation.isPending ? "Criando..." : "Criar Advogado"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-2">
            <Search className="w-5 h-5 text-gray-400 mt-2.5" />
            <Input
              placeholder="Buscar advogado por nome..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1"
            />
          </div>
        </CardContent>
      </Card>

      {/* Lawyers Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Advogados</CardTitle>
          <CardDescription>
            Total de {displayedLawyers.length} advogado(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Carregando advogados...</div>
          ) : displayedLawyers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Nenhum advogado encontrado
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>OAB</TableHead>
                    <TableHead>Experiência</TableHead>
                    <TableHead>Valor/Hora</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayedLawyers.map((lawyer: any) => (
                    <TableRow key={lawyer.id}>
                      <TableCell className="font-medium">{lawyer.name}</TableCell>
                      <TableCell>{lawyer.email}</TableCell>
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
                        <Badge className={getStatusColor(lawyer.status)}>
                          {getStatusLabel(lawyer.status)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/advogados/${lawyer.id}`)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/advogados/${lawyer.id}/editar`)}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteLawyer(lawyer.id)}
                            disabled={deleteMutation.isPending}
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
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
    </div>
  );
}
