import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { ArrowLeft, Bell, Trash2, Check, Settings } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function Notifications() {
  const { isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();
  const [preferencesOpen, setPreferencesOpen] = useState(false);

  const { data: notificationsData = [], refetch: refetchNotifications } = trpc.notifications.list.useQuery(
    { limit: 50 },
    { enabled: isAuthenticated }
  );

  const notifications = (notificationsData as any[]) ?? [];

  const { data: unreadNotifications = [] } = trpc.notifications.unread.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const unreadCount = unreadNotifications?.length ?? 0;

  const { data: preferences } = trpc.notifications.getPreferences.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const markAsReadMutation = trpc.notifications.markAsRead.useMutation();
  const markAllAsReadMutation = trpc.notifications.markAllAsRead.useMutation();
  const deleteNotificationMutation = trpc.notifications.delete.useMutation();
  const updatePreferencesMutation = trpc.notifications.updatePreferences.useMutation();

  const handleMarkAsRead = async (id: number) => {
    try {
      await markAsReadMutation.mutateAsync({ id });
      refetchNotifications();
    } catch (error: any) {
      toast.error(error.message || "Erro ao marcar como lido");
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsReadMutation.mutateAsync();
      refetchNotifications();
      toast.success("Todas as notificações marcadas como lidas");
    } catch (error: any) {
      toast.error(error.message || "Erro ao marcar como lido");
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteNotificationMutation.mutateAsync({ id });
      refetchNotifications();
      toast.success("Notificação deletada");
    } catch (error: any) {
      toast.error(error.message || "Erro ao deletar");
    }
  };

  const handleUpdatePreferences = async (updates: any) => {
    try {
      await updatePreferencesMutation.mutateAsync(updates);
      toast.success("Preferências atualizadas");
    } catch (error: any) {
      toast.error(error.message || "Erro ao atualizar preferências");
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "deadline_alert":
        return "⏰";
      case "case_update":
        return "📋";
      case "new_movement":
        return "📝";
      case "document_uploaded":
        return "📄";
      case "system":
        return "ℹ️";
      default:
        return "🔔";
    }
  };

  const getNotificationColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "bg-red-100 text-red-900 border-red-300";
      case "high":
        return "bg-orange-100 text-orange-900 border-orange-300";
      case "medium":
        return "bg-yellow-100 text-yellow-900 border-yellow-300";
      case "low":
        return "bg-blue-100 text-blue-900 border-blue-300";
      default:
        return "bg-gray-100 text-gray-900 border-gray-300";
    }
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
        <div className="container py-6">
          <Button
            variant="ghost"
            onClick={() => navigate("/dashboard")}
            className="mb-4 -ml-2"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-4xl font-bold text-foreground">Notificações</h1>
              <p className="text-muted-foreground mt-2">
                Gerencie seus alertas e preferências de notificações
              </p>
            </div>
            <Dialog open={preferencesOpen} onOpenChange={setPreferencesOpen}>
              <DialogTrigger asChild>
                <Button className="bg-accent text-accent-foreground hover:bg-accent/90 gap-2">
                  <Settings className="w-4 h-4" />
                  Preferências
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Preferências de Notificações</DialogTitle>
                  <DialogDescription>
                    Customize como você recebe notificações
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="deadline-alerts">Alertas de Prazos</Label>
                      <Switch
                        id="deadline-alerts"
                        checked={preferences?.deadlineAlerts ?? true}
                        onCheckedChange={(checked) =>
                          handleUpdatePreferences({ deadlineAlerts: checked })
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label htmlFor="case-updates">Atualizações de Processos</Label>
                      <Switch
                        id="case-updates"
                        checked={preferences?.caseUpdates ?? true}
                        onCheckedChange={(checked) =>
                          handleUpdatePreferences({ caseUpdates: checked })
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label htmlFor="new-movements">Novas Movimentações</Label>
                      <Switch
                        id="new-movements"
                        checked={preferences?.newMovements ?? true}
                        onCheckedChange={(checked) =>
                          handleUpdatePreferences({ newMovements: checked })
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label htmlFor="document-uploads">Documentos Enviados</Label>
                      <Switch
                        id="document-uploads"
                        checked={preferences?.documentUploads ?? true}
                        onCheckedChange={(checked) =>
                          handleUpdatePreferences({ documentUploads: checked })
                        }
                      />
                    </div>
                  </div>

                  <div className="border-t border-border pt-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="email-notifications">Notificações por Email</Label>
                      <Switch
                        id="email-notifications"
                        checked={preferences?.emailNotifications ?? true}
                        onCheckedChange={(checked) =>
                          handleUpdatePreferences({ emailNotifications: checked })
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label htmlFor="push-notifications">Push Notifications</Label>
                      <Switch
                        id="push-notifications"
                        checked={preferences?.pushNotifications ?? true}
                        onCheckedChange={(checked) =>
                          handleUpdatePreferences({ pushNotifications: checked })
                        }
                      />
                    </div>
                  </div>

                  <div className="border-t border-border pt-6">
                    <Label htmlFor="days-before">Alertar com quantos dias de antecedência?</Label>
                    <Select
                      value={String(preferences?.daysBeforeDeadline ?? 3)}
                      onValueChange={(value) =>
                        handleUpdatePreferences({ daysBeforeDeadline: parseInt(value) })
                      }
                    >
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 dia antes</SelectItem>
                        <SelectItem value="3">3 dias antes</SelectItem>
                        <SelectItem value="7">7 dias antes</SelectItem>
                        <SelectItem value="14">14 dias antes</SelectItem>
                        <SelectItem value="30">30 dias antes</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container py-8">
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="all">
              Todas ({notifications.length})
            </TabsTrigger>
            <TabsTrigger value="unread">
              Não Lidas ({unreadNotifications?.length ?? 0})
            </TabsTrigger>
          </TabsList>

          {/* All Notifications */}
          <TabsContent value="all">
            <Card>
              <CardHeader className="border-b border-border flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Todas as Notificações</CardTitle>
                  <CardDescription>Histórico completo de notificações</CardDescription>
                </div>
                {(notifications as any[]).some((n: any) => !n.read) && (
                  <Button
                    variant="outline"
                    onClick={handleMarkAllAsRead}
                    className="gap-2"
                  >
                    <Check className="w-4 h-4" />
                    Marcar Tudo como Lido
                  </Button>
                )}
              </CardHeader>
              <CardContent className="pt-6">
                {(notifications as any[]).length === 0 ? (
                  <div className="text-center py-12">
                    <Bell className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                    <p className="text-muted-foreground">Nenhuma notificação</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {(notifications as any[]).map((notification: any) => (
                      <div
                        key={notification.id}
                        className={`p-4 border rounded-lg flex items-start justify-between ${
                          notification.read
                            ? "bg-background border-border"
                            : "bg-accent/5 border-accent"
                        }`}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="text-2xl">
                              {getNotificationIcon(notification.type)}
                            </span>
                            <div className="flex-1">
                              <h4 className="font-semibold text-foreground">
                                {notification.title}
                              </h4>
                              <p className="text-sm text-muted-foreground">
                                {format(new Date(notification.createdAt), "dd 'de' MMMM 'às' HH:mm", {
                                  locale: ptBR,
                                })}
                              </p>
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground mb-3">
                            {notification.message}
                          </p>
                          <div className="flex gap-2">
                            <Badge
                              className={getNotificationColor(notification.priority)}
                            >
                              {notification.priority}
                            </Badge>
                            <Badge variant="outline">{notification.type}</Badge>
                          </div>
                        </div>
                        <div className="flex gap-2 ml-4">
                          {!notification.read && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleMarkAsRead(notification.id)}
                              className="gap-1"
                            >
                              <Check className="w-4 h-4" />
                              Ler
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(notification.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Unread Notifications */}
          <TabsContent value="unread">
            <Card>
              <CardHeader>
                <CardTitle>Notificações Não Lidas</CardTitle>
                <CardDescription>
                  {unreadCount} notificação{unreadCount !== 1 ? "s" : ""} aguardando sua atenção
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                {unreadCount === 0 ? (
                  <div className="text-center py-12">
                    <Bell className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                    <p className="text-muted-foreground">Você está em dia! Nenhuma notificação não lida.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {(notifications as any[])
                      .filter((n: any) => !n.read)
                      .map((notification: any) => (
                        <div
                          key={notification.id}
                          className="p-4 border border-accent rounded-lg bg-accent/5 flex items-start justify-between"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-2">
                              <span className="text-2xl">
                                {getNotificationIcon(notification.type)}
                              </span>
                              <div className="flex-1">
                                <h4 className="font-semibold text-foreground">
                                  {notification.title}
                                </h4>
                                <p className="text-sm text-muted-foreground">
                                  {format(new Date(notification.createdAt), "dd 'de' MMMM 'às' HH:mm", {
                                    locale: ptBR,
                                  })}
                                </p>
                              </div>
                            </div>
                            <p className="text-sm text-muted-foreground mb-3">
                              {notification.message}
                            </p>
                            <div className="flex gap-2">
                              <Badge
                                className={getNotificationColor(notification.priority)}
                              >
                                {notification.priority}
                              </Badge>
                              <Badge variant="outline">{notification.type}</Badge>
                            </div>
                          </div>
                          <div className="flex gap-2 ml-4">
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => handleMarkAsRead(notification.id)}
                              className="gap-1 bg-accent text-accent-foreground hover:bg-accent/90"
                            >
                              <Check className="w-4 h-4" />
                              Ler
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(notification.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
