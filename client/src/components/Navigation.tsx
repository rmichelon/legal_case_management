import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { getLoginUrl } from "@/const";
import { FileText, Search, MessageSquare, Users, LogOut, Bell, Calendar, TrendingUp, BarChart3 } from "lucide-react";
import NotificationBell from "./NotificationBell";

export default function Navigation() {
  const { isAuthenticated, logout } = useAuth();
  const [location, navigate] = useLocation();

  if (!isAuthenticated) {
    return null;
  }

  const isActive = (path: string) => location === path;

  return (
    <nav className="border-b border-border bg-background sticky top-0 z-50">
      <div className="container flex items-center justify-between h-16">
        <div className="flex items-center gap-8">
          <button
            onClick={() => navigate("/dashboard")}
            className="text-2xl font-bold text-foreground hover:text-accent transition"
          >
            <span className="text-accent">⚖️</span> LCM
          </button>

          <div className="hidden md:flex items-center gap-1">
            <Button
              variant={isActive("/dashboard") ? "default" : "ghost"}
              onClick={() => navigate("/dashboard")}
              className="gap-2"
            >
              <FileText className="w-4 h-4" />
              Dashboard
            </Button>

            <Button
              variant={isActive("/search") ? "default" : "ghost"}
              onClick={() => navigate("/search")}
              className="gap-2"
            >
              <Search className="w-4 h-4" />
              Buscar
            </Button>

            <Button
              variant={isActive("/chat") ? "default" : "ghost"}
              onClick={() => navigate("/chat")}
              className="gap-2"
            >
              <MessageSquare className="w-4 h-4" />
              IA
            </Button>

            <Button
              variant={isActive("/clients") ? "default" : "ghost"}
              onClick={() => navigate("/clients")}
              className="gap-2"
            >
              <Users className="w-4 h-4" />
              Clientes
            </Button>

            <Button
              variant={isActive("/notifications") ? "default" : "ghost"}
              onClick={() => navigate("/notifications")}
              className="gap-2"
            >
              <Bell className="w-4 h-4" />
              Notificações
            </Button>

            <Button
              variant={isActive("/calendar") ? "default" : "ghost"}
              onClick={() => navigate("/calendar")}
              className="gap-2"
            >
              <Calendar className="w-4 h-4" />
              Agenda
            </Button>

            <Button
              variant={isActive("/monitoring") ? "default" : "ghost"}
              onClick={() => navigate("/monitoring")}
              className="gap-2"
            >
              <TrendingUp className="w-4 h-4" />
              Monitoramento
            </Button>

            <Button
              variant={isActive("/reports") ? "default" : "ghost"}
              onClick={() => navigate("/reports")}
              className="gap-2"
            >
              <BarChart3 className="w-4 h-4" />
              Relatórios
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <NotificationBell />
          <Button
            variant="outline"
            onClick={() => logout()}
            className="gap-2"
          >
            <LogOut className="w-4 h-4" />
            Sair
          </Button>
        </div>
      </div>
    </nav>
  );
}
