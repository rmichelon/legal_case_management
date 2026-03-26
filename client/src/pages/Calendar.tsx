import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { Calendar, CheckCircle2, Link2, LogOut, AlertCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function CalendarPage() {
  const { user } = useAuth();
  const [isConnecting, setIsConnecting] = useState(false);
  const [authUrl, setAuthUrl] = useState<string>("");

  const integration = trpc.googleCalendar.getIntegration.useQuery();
  const upcomingEvents = trpc.googleCalendar.getUpcomingEvents.useQuery();
  const getAuthUrlQuery = trpc.googleCalendar.getAuthUrl.useQuery();

  const connectCalendarMutation = trpc.googleCalendar.connectCalendar.useMutation({
    onSuccess: () => {
      toast.success("Google Calendar conectado com sucesso!");
      integration.refetch();
      upcomingEvents.refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao conectar Google Calendar");
    },
  });

  const disconnectCalendarMutation = trpc.googleCalendar.disconnectCalendar.useMutation({
    onSuccess: () => {
      toast.success("Google Calendar desconectado");
      integration.refetch();
      upcomingEvents.refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao desconectar");
    },
  });

  const updateIntegrationMutation = trpc.googleCalendar.updateIntegration.useMutation({
    onSuccess: () => {
      toast.success("Preferências atualizadas");
      integration.refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao atualizar preferências");
    },
  });

  useEffect(() => {
    if (getAuthUrlQuery.data) {
      setAuthUrl(getAuthUrlQuery.data.authUrl);
    }
  }, [getAuthUrlQuery.data]);

  // Handle OAuth callback
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");

    if (code && !isConnecting) {
      setIsConnecting(true);
      connectCalendarMutation.mutate({ code });
    }
  }, []);

  const handleConnectClick = () => {
    if (authUrl) {
      window.location.href = authUrl;
    }
  };

  return (
    <div className="min-h-screen bg-white p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-4xl font-black text-black">Agenda</h1>
            <Calendar className="w-10 h-10 text-red-600" />
          </div>
          <p className="text-gray-600">Sincronize seus prazos processuais com Google Calendar</p>
        </div>

        {/* Integration Status */}
        {integration.isLoading ? (
          <div className="text-center py-12">
            <p className="text-gray-600">Carregando status da integração...</p>
          </div>
        ) : integration.data ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Integration Card */}
            <Card className="lg:col-span-2 border-l-4 border-l-red-600">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                      Google Calendar Conectado
                    </CardTitle>
                    <CardDescription className="mt-2">
                      {integration.data.googleAccountEmail}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                        <input
                          type="checkbox"
                          checked={integration.data.syncDeadlines}
                          onChange={(e) =>
                            updateIntegrationMutation.mutate({
                              syncDeadlines: e.target.checked,
                            })
                          }
                          className="w-4 h-4"
                        />
                        Sincronizar Prazos
                      </label>
                    </div>
                    <div>
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                        <input
                          type="checkbox"
                          checked={integration.data.syncMovements}
                          onChange={(e) =>
                            updateIntegrationMutation.mutate({
                              syncMovements: e.target.checked,
                            })
                          }
                          className="w-4 h-4"
                        />
                        Sincronizar Movimentações
                      </label>
                    </div>
                    <div>
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                        <input
                          type="checkbox"
                          checked={integration.data.syncHearings}
                          onChange={(e) =>
                            updateIntegrationMutation.mutate({
                              syncHearings: e.target.checked,
                            })
                          }
                          className="w-4 h-4"
                        />
                        Sincronizar Audiências
                      </label>
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <p className="text-xs text-gray-500 mb-3">
                      Última sincronização:{" "}
                      {integration.data.lastSyncAt
                        ? new Date(integration.data.lastSyncAt).toLocaleString("pt-BR")
                        : "Nunca"}
                    </p>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => disconnectCalendarMutation.mutate()}
                      disabled={disconnectCalendarMutation.isPending}
                      className="w-full"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Desconectar Google Calendar
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Stats Card */}
            <Card className="border-l-4 border-l-red-600">
              <CardHeader>
                <CardTitle className="text-lg">Estatísticas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <p className="text-3xl font-black text-red-600">
                      {upcomingEvents.data?.length || 0}
                    </p>
                    <p className="text-sm text-gray-600">Eventos próximos</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">
                      {integration.data.isActive ? (
                        <span className="text-green-600 font-medium">✓ Sincronização ativa</span>
                      ) : (
                        <span className="text-red-600 font-medium">✗ Sincronização inativa</span>
                      )}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <Card className="border-l-4 border-l-red-600 mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-amber-600" />
                Google Calendar não conectado
              </CardTitle>
              <CardDescription>
                Conecte seu Google Calendar para sincronizar automaticamente seus prazos processuais
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={handleConnectClick}
                disabled={!authUrl || isConnecting}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                <Link2 className="w-4 h-4 mr-2" />
                {isConnecting ? "Conectando..." : "Conectar Google Calendar"}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Upcoming Events */}
        {integration.data && upcomingEvents.data && upcomingEvents.data.length > 0 && (
          <div>
            <h2 className="text-2xl font-black text-black mb-4">Próximos Eventos</h2>
            <div className="space-y-3">
              {upcomingEvents.data.map((event: any, index: number) => (
                <Card key={index} className="border-l-4 border-l-red-600">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-bold text-black">{event.summary}</h3>
                        <p className="text-sm text-gray-600 mt-1">{event.description}</p>
                        <p className="text-xs text-gray-500 mt-2">
                          {event.start.dateTime
                            ? new Date(event.start.dateTime).toLocaleString("pt-BR")
                            : event.start.date}
                        </p>
                      </div>
                      {event.location && (
                        <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">
                          {event.location}
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {integration.data && (!upcomingEvents.data || upcomingEvents.data.length === 0) && (
          <Card className="border-l-4 border-l-red-600">
            <CardContent className="pt-6">
              <p className="text-center text-gray-600">
                Nenhum evento próximo. Crie prazos em seus processos para sincronizá-los com Google Calendar.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
