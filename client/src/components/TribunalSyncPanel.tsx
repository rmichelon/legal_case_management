import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertCircle, Clock } from "lucide-react";

interface TribunalSyncPanelProps {
  caseId: number;
  courtData?: {
    courtName?: string | null;
    vara?: string | null;
    judge?: string | null;
    processStatus?: string;
    lastMovement?: string | null;
    lastMovementDate?: Date | null;
    plaintiff?: string | null;
    defendant?: string | null;
    nextHearingDate?: Date | null;
    nextHearingLocation?: string | null;
    nextHearingType?: string | null;
    lastSyncAt?: Date | null;
    syncStatus?: string | null;
  };
}

export default function TribunalSyncPanel({ caseId, courtData }: TribunalSyncPanelProps) {
  if (!courtData) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-gray-500">Nenhum dado de tribunal sincronizado</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Sync Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {courtData.syncStatus === "synced" ? (
              <CheckCircle2 className="w-5 h-5 text-green-600" />
            ) : (
              <AlertCircle className="w-5 h-5 text-yellow-600" />
            )}
            Status de Sincronização
          </CardTitle>
          <CardDescription>
            Última sincronização:{" "}
            {courtData.lastSyncAt
              ? new Date(courtData.lastSyncAt).toLocaleDateString("pt-BR", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "Nunca"}
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Court Information */}
      <Card>
        <CardHeader>
          <CardTitle>Informações do Tribunal</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Tribunal</p>
              <p className="font-semibold text-gray-900">{courtData.courtName || "—"}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Vara</p>
              <p className="font-semibold text-gray-900">{courtData.vara || "—"}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Juiz</p>
              <p className="font-semibold text-gray-900">{courtData.judge || "—"}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Status</p>
              <Badge variant="outline">{courtData.processStatus || "—"}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Parties */}
      <Card>
        <CardHeader>
          <CardTitle>Partes Envolvidas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm text-gray-600">Autor/Requerente</p>
            <p className="font-semibold text-gray-900">{courtData.plaintiff || "—"}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Réu/Requerido</p>
            <p className="font-semibold text-gray-900">{courtData.defendant || "—"}</p>
          </div>
        </CardContent>
      </Card>

      {/* Last Movement */}
      {courtData.lastMovement && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Última Movimentação
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-gray-900">{courtData.lastMovement}</p>
            {courtData.lastMovementDate && (
              <p className="text-sm text-gray-600">
                {new Date(courtData.lastMovementDate).toLocaleDateString("pt-BR")}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Next Hearing */}
      {courtData.nextHearingDate && (
        <Card>
          <CardHeader>
            <CardTitle>Próxima Audiência</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <p className="text-sm text-gray-600">Data</p>
              <p className="font-semibold text-gray-900">
                {new Date(courtData.nextHearingDate).toLocaleDateString("pt-BR", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
            {courtData.nextHearingLocation && (
              <div>
                <p className="text-sm text-gray-600">Local</p>
                <p className="font-semibold text-gray-900">{courtData.nextHearingLocation}</p>
              </div>
            )}
            {courtData.nextHearingType && (
              <div>
                <p className="text-sm text-gray-600">Tipo</p>
                <Badge variant="outline">{courtData.nextHearingType}</Badge>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
