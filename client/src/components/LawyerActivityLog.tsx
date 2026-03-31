import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  FileText,
  UserPlus,
  CheckCircle2,
  AlertCircle,
  Clock,
  Trash2,
  Edit,
} from "lucide-react";

interface Activity {
  id: number;
  type: "assignment" | "completion" | "update" | "deadline_missed" | "case_closed" | "deletion";
  title: string;
  description?: string;
  caseNumber?: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

interface LawyerActivityLogProps {
  activities?: Activity[];
  isLoading?: boolean;
}

const activityIcons: Record<string, React.ReactNode> = {
  assignment: <UserPlus className="w-4 h-4" />,
  completion: <CheckCircle2 className="w-4 h-4" />,
  update: <Edit className="w-4 h-4" />,
  deadline_missed: <AlertCircle className="w-4 h-4" />,
  case_closed: <FileText className="w-4 h-4" />,
  deletion: <Trash2 className="w-4 h-4" />,
};

const activityColors: Record<string, string> = {
  assignment: "bg-blue-50 border-blue-200",
  completion: "bg-green-50 border-green-200",
  update: "bg-purple-50 border-purple-200",
  deadline_missed: "bg-amber-50 border-amber-200",
  case_closed: "bg-slate-50 border-slate-200",
  deletion: "bg-red-50 border-red-200",
};

const activityBadgeVariants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  assignment: "default",
  completion: "default",
  update: "secondary",
  deadline_missed: "destructive",
  case_closed: "outline",
  deletion: "destructive",
};

export function LawyerActivityLog({
  activities = [],
  isLoading = false,
}: LawyerActivityLogProps) {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Carregando histórico...
        </CardContent>
      </Card>
    );
  }

  if (!activities || activities.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Nenhuma atividade registrada
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Histórico de Atividades</CardTitle>
        <CardDescription>Últimas ações do advogado</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity) => (
            <div
              key={activity.id}
              className={`border rounded-lg p-4 ${
                activityColors[activity.type] || "bg-gray-50"
              }`}
            >
              <div className="flex items-start gap-3">
                {/* Icon */}
                <div className="mt-1 text-muted-foreground">
                  {activityIcons[activity.type] || <Clock className="w-4 h-4" />}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm">{activity.title}</p>
                    <Badge variant={activityBadgeVariants[activity.type] || "outline"}>
                      {activity.type.replace("_", " ")}
                    </Badge>
                  </div>

                  {activity.description && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {activity.description}
                    </p>
                  )}

                  {activity.caseNumber && (
                    <p className="text-xs text-muted-foreground mt-1">
                      <strong>Caso:</strong> {activity.caseNumber}
                    </p>
                  )}

                  {activity.metadata && Object.keys(activity.metadata).length > 0 && (
                    <div className="text-xs text-muted-foreground mt-2 space-y-1">
                      {Object.entries(activity.metadata).map(([key, value]) => (
                        <p key={key}>
                          <strong>{key}:</strong> {String(value)}
                        </p>
                      ))}
                    </div>
                  )}
                </div>

                {/* Timestamp */}
                <div className="text-right">
                  <p className="text-xs text-muted-foreground whitespace-nowrap">
                    {formatDistanceToNow(new Date(activity.timestamp), {
                      addSuffix: true,
                      locale: ptBR,
                    })}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
