import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { getLoginUrl } from "@/const";
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
  ChevronDown,
} from "lucide-react";
import NotificationBell from "./NotificationBell";
import { useState } from "react";

interface MenuGroup {
  label: string;
  icon: React.ReactNode;
  items: Array<{
    label: string;
    path: string;
    icon: React.ReactNode;
  }>;
}

export default function Navigation() {
  const { isAuthenticated, logout } = useAuth();
  const [location, navigate] = useLocation();
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  if (!isAuthenticated) {
    return null;
  }

  const isActive = (path: string) => location === path;
  const isGroupActive = (items: Array<{ path: string }>) =>
    items.some((item) => location === item.path);

  const menuGroups: MenuGroup[] = [
    {
      label: "Dashboard",
      icon: <FileText className="w-4 h-4" />,
      items: [
        {
          label: "Dashboard",
          path: "/dashboard",
          icon: <FileText className="w-4 h-4" />,
        },
      ],
    },
    {
      label: "Processos",
      icon: <Briefcase className="w-4 h-4" />,
      items: [
        {
          label: "Gestão",
          path: "/management",
          icon: <Briefcase className="w-4 h-4" />,
        },
        {
          label: "Buscar",
          path: "/search",
          icon: <Search className="w-4 h-4" />,
        },
        {
          label: "Monitoramento",
          path: "/monitoring",
          icon: <TrendingUp className="w-4 h-4" />,
        },
      ],
    },
    {
      label: "Pessoas",
      icon: <Users className="w-4 h-4" />,
      items: [
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
      items: [
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
      icon: <BarChart3 className="w-4 h-4" />,
      items: [
        {
          label: "Relatórios",
          path: "/reports",
          icon: <BarChart3 className="w-4 h-4" />,
        },
      ],
    },
    {
      label: "Ferramentas",
      icon: <MessageSquare className="w-4 h-4" />,
      items: [
        {
          label: "Chat IA",
          path: "/chat",
          icon: <MessageSquare className="w-4 h-4" />,
        },
      ],
    },
  ];

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
            {menuGroups.map((group) => {
              const isOpen = openMenu === group.label;
              const groupActive = isGroupActive(group.items);

              // Se o grupo tem apenas um item, renderizar como botão simples
              if (group.items.length === 1) {
                const item = group.items[0];
                return (
                  <Button
                    key={item.path}
                    variant={isActive(item.path) ? "default" : "ghost"}
                    onClick={() => navigate(item.path)}
                    className="gap-2"
                  >
                    {item.icon}
                    {item.label}
                  </Button>
                );
              }

              // Se o grupo tem múltiplos itens, renderizar com dropdown
              return (
                <div key={group.label} className="relative group">
                  <Button
                    variant={groupActive ? "default" : "ghost"}
                    onClick={() =>
                      setOpenMenu(isOpen ? null : group.label)
                    }
                    className="gap-2"
                  >
                    {group.icon}
                    {group.label}
                    <ChevronDown className="w-4 h-4 transition-transform group-hover:rotate-180" />
                  </Button>

                  {/* Dropdown Menu */}
                  <div
                    className={`absolute left-0 mt-0 w-48 bg-background border border-border rounded-md shadow-lg transition-all duration-200 ${
                      isOpen
                        ? "opacity-100 visible"
                        : "opacity-0 invisible group-hover:opacity-100 group-hover:visible"
                    }`}
                  >
                    <div className="py-1">
                      {group.items.map((item) => (
                        <button
                          key={item.path}
                          onClick={() => {
                            navigate(item.path);
                            setOpenMenu(null);
                          }}
                          className={`w-full text-left px-4 py-2 flex items-center gap-2 text-sm transition-colors ${
                            isActive(item.path)
                              ? "bg-accent text-accent-foreground"
                              : "hover:bg-muted text-foreground"
                          }`}
                        >
                          {item.icon}
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
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
