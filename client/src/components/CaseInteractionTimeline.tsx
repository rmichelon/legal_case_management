import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, FileText, CheckCircle2, AlertCircle, Clock } from "lucide-react";

interface Interaction {
  id?: number;
  type: string;
  title: string;
  description: string | null;
  createdAt: Date;
  metadata?: string | null;
}

interface CaseInteractionTimelineProps {
  interactions: Interaction[];
}

export default function CaseInteractionTimeline({ interactions }: CaseInteractionTimelineProps) {
  const getIcon = (type: string) => {
    switch (type) {
      case "status_change":
        return <CheckCircle2 className="w-5 h-5 text-blue-600" />;
      case "document_added":
        return <FileText className="w-5 h-5 text-green-600" />;
      case "comment":
        return <MessageSquare className="w-5 h-5 text-purple-600" />;
      case "alert":
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Clock className="w-5 h-5 text-gray-600" />;
    }
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      status_change: "Mudança de Status",
      document_added: "Documento Adicionado",
      comment: "Comentário",
      alert: "Alerta",
    };
    return labels[type] || type;
  };

  if (!interactions || interactions.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-gray-500">Nenhuma interação registrada</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Histórico de Interações</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {interactions.map((interaction, index) => (
            <div key={interaction.id || index} className="flex gap-4 pb-4 border-b last:border-b-0">
              {/* Icon */}
              <div className="flex-shrink-0 mt-1">
                {getIcon(interaction.type)}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-semibold text-gray-900">{interaction.title}</h4>
                  <Badge variant="outline" className="text-xs">
                    {getTypeLabel(interaction.type)}
                  </Badge>
                </div>
                <p className="text-gray-700 text-sm mb-2">{interaction.description}</p>
                <p className="text-xs text-gray-500">
                  {new Date(interaction.createdAt).toLocaleDateString("pt-BR", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>

                {/* Metadata if available */}
                {interaction.metadata && (
                  <div className="mt-2 p-2 bg-gray-50 rounded text-xs text-gray-600">
                    <pre className="whitespace-pre-wrap break-words">
                      {typeof interaction.metadata === "string"
                        ? interaction.metadata
                        : JSON.stringify(interaction.metadata, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
