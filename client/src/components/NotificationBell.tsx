import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Bell, ArrowRight } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useAuth } from "@/_core/hooks/useAuth";

export default function NotificationBell() {
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const [open, setOpen] = useState(false);

  const { data: unreadNotifications = [] } = trpc.notifications.unread.useQuery(undefined, {
    enabled: isAuthenticated,
    refetchInterval: 5000, // Poll every 5 seconds
  });

  const { data: recentNotifications = [] } = trpc.notifications.list.useQuery(
    { limit: 5 },
    { enabled: isAuthenticated && open, refetchInterval: 3000 }
  );

  const markAsReadMutation = trpc.notifications.markAsRead.useMutation();

  const handleMarkAsRead = async (id: number) => {
    try {
      await markAsReadMutation.mutateAsync({ id });
    } catch (error) {
      console.error("Error marking notification as read:", error);
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

  const unreadCount = (unreadNotifications as any[])?.length ?? 0;

  if (!isAuthenticated) {
    return null;
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          title="Notificações"
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <Badge
              className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 bg-accent text-accent-foreground text-xs font-bold"
              variant="default"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex flex-col max-h-96">
          {/* Header */}
          <div className="border-b border-border p-4 flex items-center justify-between">
            <h3 className="font-semibold text-foreground">Notificações</h3>
            {unreadCount > 0 && (
              <Badge className="bg-accent text-accent-foreground">
                {unreadCount} nova{unreadCount !== 1 ? "s" : ""}
              </Badge>
            )}
          </div>

          {/* Notifications List */}
          <div className="flex-1 overflow-y-auto">
            {(recentNotifications as any[])?.length === 0 ? (
              <div className="p-8 text-center">
                <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-2 opacity-50" />
                <p className="text-sm text-muted-foreground">Nenhuma notificação</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {(recentNotifications as any[]).map((notification: any) => (
                  <div
                    key={notification.id}
                    className={`p-3 hover:bg-accent/5 transition cursor-pointer ${
                      !notification.read ? "bg-accent/10" : ""
                    }`}
                    onClick={() => {
                      if (!notification.read) {
                        handleMarkAsRead(notification.id);
                      }
                    }}
                  >
                    <div className="flex gap-3">
                      <span className="text-xl flex-shrink-0">
                        {getNotificationIcon(notification.type)}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {notification.title}
                        </p>
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                          {notification.message}
                        </p>
                        <p className="text-xs text-muted-foreground mt-2">
                          {format(new Date(notification.createdAt), "HH:mm", {
                            locale: ptBR,
                          })}
                        </p>
                      </div>
                      {!notification.read && (
                        <div className="w-2 h-2 bg-accent rounded-full flex-shrink-0 mt-1" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-border p-3">
            <Button
              variant="ghost"
              className="w-full justify-between text-accent hover:text-accent hover:bg-accent/10"
              onClick={() => {
                setOpen(false);
                navigate("/notifications");
              }}
            >
              Ver todas as notificações
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
