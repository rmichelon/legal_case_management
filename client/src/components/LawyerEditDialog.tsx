import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { trpc } from "@/lib/trpc";

interface LawyerEditDialogProps {
  lawyerId: number | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function LawyerEditDialog({
  lawyerId,
  isOpen,
  onClose,
  onSuccess,
}: LawyerEditDialogProps) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    bio: "",
    status: "active" as const,
    yearsOfExperience: "",
    hourlyRate: "",
    officeLocation: "",
  });

  const utils = trpc.useUtils();
  const { data: lawyer, isLoading: isLoadingLawyer } = trpc.lawyers.get.useQuery(
    { id: lawyerId || 0 },
    { enabled: !!lawyerId && isOpen }
  );

  const updateMutation = trpc.lawyers.update.useMutation({
    onSuccess: () => {
      utils.lawyers.list.invalidate();
      if (lawyerId) {
        utils.lawyers.get.invalidate({ id: lawyerId });
      }
      toast.success("Advogado atualizado com sucesso!");
      onSuccess?.();
      onClose();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao atualizar advogado");
    },
  });

  useEffect(() => {
    if (lawyer) {
      setFormData({
        name: lawyer.name || "",
        email: lawyer.email || "",
        phone: lawyer.phone || "",
        bio: lawyer.bio || "",
        status: lawyer.status || "active",
        yearsOfExperience: lawyer.yearsOfExperience?.toString() || "",
        hourlyRate: lawyer.hourlyRate?.toString() || "",
        officeLocation: lawyer.officeLocation || "",
      });
    }
  }, [lawyer]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lawyerId) return;

    try {
      await updateMutation.mutateAsync({
        id: lawyerId,
        name: formData.name || undefined,
        email: formData.email || undefined,
        phone: formData.phone || undefined,
        bio: formData.bio || undefined,
        status: formData.status,
        yearsOfExperience: formData.yearsOfExperience
          ? parseInt(formData.yearsOfExperience)
          : undefined,
        hourlyRate: formData.hourlyRate
          ? parseFloat(formData.hourlyRate)
          : undefined,
        officeLocation: formData.officeLocation || undefined,
      });
    } catch (error) {
      console.error("Erro ao atualizar:", error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Editar Advogado</DialogTitle>
          <DialogDescription>
            Atualize as informações do advogado
          </DialogDescription>
        </DialogHeader>

        {isLoadingLawyer ? (
          <div className="py-8 text-center text-muted-foreground">
            Carregando...
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Nome e Email */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Nome</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="mt-1"
                />
              </div>
            </div>

            {/* Telefone e Status */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="phone">Telefone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      status: value as typeof formData.status,
                    })
                  }
                >
                  <SelectTrigger id="status" className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Ativo</SelectItem>
                    <SelectItem value="inactive">Inativo</SelectItem>
                    <SelectItem value="on_leave">Licença</SelectItem>
                    <SelectItem value="retired">Aposentado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Experiência e Taxa */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="experience">Anos de Experiência</Label>
                <Input
                  id="experience"
                  type="number"
                  min="0"
                  value={formData.yearsOfExperience}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      yearsOfExperience: e.target.value,
                    })
                  }
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="rate">Taxa Horária (R$)</Label>
                <Input
                  id="rate"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.hourlyRate}
                  onChange={(e) =>
                    setFormData({ ...formData, hourlyRate: e.target.value })
                  }
                  className="mt-1"
                />
              </div>
            </div>

            {/* Localização */}
            <div>
              <Label htmlFor="location">Localização do Escritório</Label>
              <Input
                id="location"
                value={formData.officeLocation}
                onChange={(e) =>
                  setFormData({ ...formData, officeLocation: e.target.value })
                }
                className="mt-1"
              />
            </div>

            {/* Bio */}
            <div>
              <Label htmlFor="bio">Biografia</Label>
              <Textarea
                id="bio"
                value={formData.bio}
                onChange={(e) =>
                  setFormData({ ...formData, bio: e.target.value })
                }
                className="mt-1"
                rows={4}
              />
            </div>

            {/* Actions */}
            <div className="flex gap-2 justify-end pt-4">
              <Button variant="outline" onClick={onClose} type="button">
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={updateMutation.isPending}
              >
                {updateMutation.isPending ? "Salvando..." : "Salvar Alterações"}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
