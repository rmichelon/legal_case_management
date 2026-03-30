import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertTriangle, Check } from "lucide-react";

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  caseNumber: string;
  caseTitle: string;
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const MAX_ATTEMPTS = 3;

export function DeleteConfirmationModal({
  isOpen,
  caseNumber,
  caseTitle,
  isLoading = false,
  onConfirm,
  onCancel,
}: DeleteConfirmationModalProps) {
  const [confirmationInput, setConfirmationInput] = useState("");
  const [error, setError] = useState("");
  const [attempts, setAttempts] = useState(0);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setConfirmationInput("");
      setError("");
      setAttempts(0);
    }
  }, [isOpen]);

  const isConfirmationValid = confirmationInput.trim() === caseNumber.trim();
  const hasExceededAttempts = attempts >= MAX_ATTEMPTS;

  const handleConfirm = () => {
    if (!isConfirmationValid) {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);

      if (newAttempts >= MAX_ATTEMPTS) {
        setError(
          "Número máximo de tentativas excedido. Feche este modal e tente novamente."
        );
      } else {
        const remainingAttempts = MAX_ATTEMPTS - newAttempts;
        setError(
          `O número do processo não corresponde. ${remainingAttempts} tentativa(s) restante(s).`
        );
      }
      return;
    }
    setError("");
    onConfirm();
    setConfirmationInput("");
  };

  const handleCancel = () => {
    setConfirmationInput("");
    setError("");
    setAttempts(0);
    onCancel();
  };

  const handleInputChange = (value: string) => {
    setConfirmationInput(value);
    if (error) {
      setError("");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleCancel}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <DialogTitle>Deletar Processo</DialogTitle>
              <DialogDescription>
                Esta ação não pode ser desfeita. Por favor, confirme digitando o
                número do processo.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Informações do Processo */}
          <div className="rounded-lg bg-muted p-4 space-y-3">
            <div>
              <Label className="text-xs font-semibold text-muted-foreground">
                Número do Processo
              </Label>
              <p className="font-mono text-sm font-bold text-foreground mt-1">
                {caseNumber}
              </p>
            </div>
            <div>
              <Label className="text-xs font-semibold text-muted-foreground">
                Título
              </Label>
              <p className="text-sm text-foreground mt-1 line-clamp-2">
                {caseTitle}
              </p>
            </div>
          </div>

          {/* Campo de Confirmação */}
          <div className="space-y-2">
            <Label htmlFor="confirmation-input" className="text-sm font-semibold">
              Digite o número do processo para confirmar:
            </Label>
            <Input
              id="confirmation-input"
              placeholder={caseNumber}
              value={confirmationInput}
              onChange={(e) => handleInputChange(e.target.value)}
              disabled={isLoading || hasExceededAttempts}
              className={error ? "border-destructive" : ""}
              autoComplete="off"
            />
            {error && (
              <p className="text-xs text-destructive font-medium">{error}</p>
            )}
          </div>

          {/* Aviso Principal */}
          <div className="rounded-lg bg-destructive/5 border border-destructive/20 p-3">
            <p className="text-xs text-destructive font-medium">
              ⚠️ Ao deletar este processo, todos os dados associados (documentos,
              prazos, interações) serão permanentemente removidos.
            </p>
          </div>

          {/* Tentativas */}
          {attempts > 0 && (
            <div className="rounded-lg bg-yellow-50 border border-yellow-200 p-3">
              <p className="text-xs font-medium text-yellow-800">
                Tentativas: {attempts}/{MAX_ATTEMPTS}
              </p>
            </div>
          )}

          {/* Confirmação Visual */}
          {isConfirmationValid && (
            <div className="rounded-lg bg-green-50 border border-green-200 p-3 flex items-center gap-2">
              <Check className="h-4 w-4 text-green-600" />
              <p className="text-xs font-medium text-green-700">
                Número do processo confirmado. Clique em "Deletar Permanentemente"
                para continuar.
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={!isConfirmationValid || isLoading || hasExceededAttempts}
            className="gap-2"
          >
            {isLoading ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Deletando...
              </>
            ) : (
              "Deletar Permanentemente"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
