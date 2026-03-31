import { useState } from "react";
import { useLocation } from "wouter";
import { TreeMenu, type TreeMenuItem } from "./TreeMenu";
import { Button } from "@/components/ui/button";
import {
  FileText,
  Search,
  MessageSquare,
  Users,
  LogOut,
  Bell,
  Calendar,
  TrendingUp,
  BarChart3,
  Briefcase,
  Scale,
  Gavel,
  Menu,
  X,
  Trash2,
  LayoutDashboard,
  Settings,
} from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";

export default function Sidebar() {
  const { isAuthenticated, logout } = useAuth();
  const [, navigate] = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  if (!isAuthenticated) {
    return null;
  }

  const menuItems: TreeMenuItem[] = [
    {
      label: "Dashboard",
      path: "/dashboard",
      icon: <LayoutDashboard className="w-4 h-4" />,
    },
    {
      label: "Processos",
      icon: <Briefcase className="w-4 h-4" />,
      children: [
        {
          label: "Gestão de Processos",
          path: "/management",
          icon: <Briefcase className="w-4 h-4" />,
        },
        {
          label: "Buscar Processos",
          path: "/search",
          icon: <Search className="w-4 h-4" />,
        },
        {
          label: "Monitoramento",
          path: "/monitoring",
          icon: <TrendingUp className="w-4 h-4" />,
        },
        {
          label: "Lixeira",
          path: "/trash",
          icon: <Trash2 className="w-4 h-4" />,
        },
      ],
    },
    {
      label: "Pessoas",
      icon: <Users className="w-4 h-4" />,
      children: [
        {
          label: "Clientes",
          path: "/clients",
          icon: <Users className="w-4 h-4" />,
        },
        {
          label: "Advogados",
          path: "/lawyers",
          icon: <Scale className="w-4 h-4" />,
        },
      ],
    },
    {
      label: "Operações",
      icon: <Calendar className="w-4 h-4" />,
      children: [
        {
          label: "Agenda",
          path: "/calendar",
          icon: <Calendar className="w-4 h-4" />,
        },
        {
          label: "Notificações",
          path: "/notifications",
          icon: <Bell className="w-4 h-4" />,
        },
        {
          label: "Controladoria",
          path: "/controladoria",
          icon: <Gavel className="w-4 h-4" />,
        },
      ],
    },
    {
      label: "Relatórios",
      path: "/reports",
      icon: <BarChart3 className="w-4 h-4" />,
    },
    {
      label: "Ferramentas",
      icon: <MessageSquare className="w-4 h-4" />,
      children: [
        {
          label: "Chat IA",
          path: "/chat",
          icon: <MessageSquare className="w-4 h-4" />,
        },
      ],
    },
  ];

  const handleNavigate = (path: string) => {
    navigate(path);
    setIsOpen(false);
  };

  return (
    <>
      {/* Mobile Toggle Button */}
      <div className="md:hidden fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setIsOpen(!isOpen)}
          className="rounded-lg"
        >
          {isOpen ? (
            <X className="w-5 h-5" />
          ) : (
            <Menu className="w-5 h-5" />
          )}
        </Button>
      </div>

      {/* Sidebar */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-40 w-64 bg-background border-r border-border
          transition-transform duration-300 ease-in-out
          md:translate-x-0 md:static md:inset-auto
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
          flex flex-col
        `}
      >
        {/* Header */}
        <div className="p-4 border-b border-border">
          <button
            onClick={() => {
              navigate("/dashboard");
              setIsOpen(false);
            }}
            className="flex items-center gap-2 text-xl font-bold text-foreground hover:text-accent transition w-full"
          >
            <span className="text-2xl">⚖️</span>
            <span>LCM</span>
          </button>
        </div>

        {/* Menu */}
        <nav className="flex-1 overflow-y-auto p-4">
          <TreeMenu
            items={menuItems}
            onNavigate={handleNavigate}
            defaultExpanded={["Processos", "Pessoas", "Operações"]}
          />
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-border space-y-2">
          <Button
            variant="outline"
            className="w-full justify-start gap-2"
            onClick={() => {
              navigate("/dashboard");
              setIsOpen(false);
            }}
          >
            <Settings className="w-4 h-4" />
            Configurações
          </Button>
          <Button
            variant="outline"
            className="w-full justify-start gap-2 text-destructive hover:text-destructive"
            onClick={() => logout()}
          >
            <LogOut className="w-4 h-4" />
            Sair
          </Button>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
