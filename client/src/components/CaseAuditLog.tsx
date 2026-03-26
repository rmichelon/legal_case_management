import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";

interface CaseAuditLogProps {
  caseId: number;
}

export default function CaseAuditLog({ caseId }: CaseAuditLogProps) {
  const { data: auditLogs, isLoading } = trpc.caseManagement.getCaseAuditLog.useQuery({
    caseId,
    limit: 100,
  });

  const getActionLabel = (action: string) => {
    const labels: Record<string, string> = {
      case_created: "Processo Criado",
      case_updated: "Processo Atualizado",
      case_deleted: "Processo Deletado",
      case_synced_from_tribunal: "Sincronizado do Tribunal",
      deadline_created: "Prazo Criado",
      deadline_updated: "Prazo Atualizado",
      document_uploaded: "Documento Enviado",
      movement_added: "Movimentação Adicionada",
    };
    return labels[action] || action;
  };

  const getActionColor = (action: string) => {
    if (action.includes("created")) return "bg-green-100 text-green-800";
    if (action.includes("updated")) return "bg-blue-100 text-blue-800";
    if (action.includes("deleted")) return "bg-red-100 text-red-800";
    if (action.includes("synced")) return "bg-purple-100 text-purple-800";
    return "bg-gray-100 text-gray-800";
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-red-600" />
        </CardContent>
      </Card>
    );
  }

  if (!auditLogs || auditLogs.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-gray-500">Nenhuma auditoria registrada</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Log de Auditoria</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 px-2 font-semibold text-gray-700">Data/Hora</th>
                <th className="text-left py-2 px-2 font-semibold text-gray-700">Ação</th>
                <th className="text-left py-2 px-2 font-semibold text-gray-700">Usuário</th>
                <th className="text-left py-2 px-2 font-semibold text-gray-700">Campos Alterados</th>
              </tr>
            </thead>
            <tbody>
              {auditLogs.map((log: any, index: number) => (
                <tr key={log.id || index} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-2 text-gray-600">
                    {new Date(log.createdAt).toLocaleDateString("pt-BR", {
                      year: "numeric",
                      month: "2-digit",
                      day: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                  <td className="py-3 px-2">
                    <Badge className={getActionColor(log.action)}>
                      {getActionLabel(log.action)}
                    </Badge>
                  </td>
                  <td className="py-3 px-2 text-gray-900">
                    {log.userId ? `Usuário #${log.userId}` : "Sistema"}
                  </td>
                  <td className="py-3 px-2">
                    {log.changedFields ? (
                      <details className="cursor-pointer">
                        <summary className="text-blue-600 hover:text-blue-800">
                          Ver detalhes
                        </summary>
                        <div className="mt-2 p-2 bg-gray-50 rounded text-xs text-gray-600">
                          <div className="mb-2">
                            <strong>Campos:</strong>
                            <pre className="whitespace-pre-wrap break-words">
                              {typeof log.changedFields === "string"
                                ? log.changedFields
                                : JSON.stringify(log.changedFields, null, 2)}
                            </pre>
                          </div>
                          {log.oldValues && (
                            <div className="mb-2">
                              <strong>Valores Anteriores:</strong>
                              <pre className="whitespace-pre-wrap break-words">
                                {typeof log.oldValues === "string"
                                  ? log.oldValues
                                  : JSON.stringify(log.oldValues, null, 2)}
                              </pre>
                            </div>
                          )}
                          {log.newValues && (
                            <div>
                              <strong>Novos Valores:</strong>
                              <pre className="whitespace-pre-wrap break-words">
                                {typeof log.newValues === "string"
                                  ? log.newValues
                                  : JSON.stringify(log.newValues, null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>
                      </details>
                    ) : (
                      "—"
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
