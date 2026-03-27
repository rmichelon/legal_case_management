import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
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
import { Textarea } from "@/components/ui/textarea";
import { UserPlus } from "lucide-react";

interface CaseAssignmentDialogProps {
  caseId: number;
  onSuccess?: () => void;
}

export function CaseAssignmentDialog({ caseId, onSuccess }: CaseAssignmentDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedLawyer, setSelectedLawyer] = useState<string>("");
  const [role, setRole] = useState<"lead" | "co_counsel" | "junior" | "consultant">("lead");
  const [notes, setNotes] = useState("");

  const utils = trpc.useUtils();

  // Queries
  const { data: lawyers = [] } = trpc.lawyers.list.useQuery();

  // Mutations
  const assignCaseMutation = trpc.lawyers.assignCase.useMutation({
    onSuccess: () => {
      utils.lawyers.list.invalidate();
      setIsOpen(false);
      setSelectedLawyer("");
      setRole("lead");
      setNotes("");
      onSuccess?.();
    },
  });

  const handleAssign = async () => {
    if (!selectedLawyer) return;

    await assignCaseMutation.mutateAsync({
      caseId,
      lawyerId: parseInt(selectedLawyer),
      role,
      notes: notes || undefined,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="bg-pink-600 hover:bg-pink-700">
          <UserPlus className="w-4 h-4 mr-2" />
          Atribuir Advogado
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Atribuir Advogado ao Caso</DialogTitle>
          <DialogDescription>
            Selecione um advogado para trabalhar neste caso
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Advogado *</label>
            <Select value={selectedLawyer} onValueChange={setSelectedLawyer}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um advogado" />
              </SelectTrigger>
              <SelectContent>
                {lawyers.map((lawyer: any) => (
                  <SelectItem key={lawyer.id} value={lawyer.id.toString()}>
                    {lawyer.name}
                    {lawyer.oabNumber && ` (OAB ${lawyer.oabNumber}/${lawyer.oabState})`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium">Função *</label>
            <Select value={role} onValueChange={(value: any) => setRole(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="lead">Responsável</SelectItem>
                <SelectItem value="co_counsel">Co-Responsável</SelectItem>
                <SelectItem value="junior">Júnior</SelectItem>
                <SelectItem value="consultant">Consultor</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium">Observações</label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Adicione observações sobre a atribuição..."
              rows={3}
            />
          </div>

          <Button
            onClick={handleAssign}
            disabled={!selectedLawyer || assignCaseMutation.isPending}
            className="w-full bg-pink-600 hover:bg-pink-700"
          >
            {assignCaseMutation.isPending ? "Atribuindo..." : "Atribuir"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
