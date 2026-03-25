import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { getLoginUrl } from "@/const";
import { FileText, Calendar, Users, MessageSquare, Shield, Zap } from "lucide-react";

export default function Home() {
  const { user, isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!loading && isAuthenticated) {
      navigate("/dashboard");
    }
  }, [loading, isAuthenticated, navigate]);

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
        <div className="container py-6 flex justify-between items-center">
          <div className="text-2xl font-bold text-foreground">
            <span className="text-accent">⚖️</span> Legal Case Manager
          </div>
          <Button
            onClick={() => window.location.href = getLoginUrl()}
            className="bg-accent text-accent-foreground hover:bg-accent/90"
          >
            Entrar
          </Button>
        </div>
      </div>

      {/* Hero Section */}
      <div className="container py-20">
        <div className="max-w-4xl">
          <h1 className="text-6xl font-bold text-foreground mb-6 leading-tight">
            Sistema Inteligente de Gestão de Processos Judiciais
          </h1>
          <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
            Organize seus processos, controle prazos e aumente sua produtividade com nossa plataforma moderna e intuitiva. Desenvolvida especificamente para advogados que buscam eficiência.
          </p>
          <div className="flex gap-4">
            <Button
              onClick={() => window.location.href = getLoginUrl()}
              className="bg-accent text-accent-foreground hover:bg-accent/90 px-8 py-6 text-lg"
            >
              Começar Agora
            </Button>
            <Button
              variant="outline"
              className="px-8 py-6 text-lg border-border"
            >
              Conhecer Mais
            </Button>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="border-t border-border">
        <div className="container py-20">
          <h2 className="text-4xl font-bold text-foreground mb-12">
            Funcionalidades Principais
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="border-l-4 border-l-accent pl-6">
              <div className="flex items-center gap-3 mb-4">
                <FileText className="w-6 h-6 text-accent" />
                <h3 className="text-xl font-semibold text-foreground">
                  Gestão de Processos
                </h3>
              </div>
              <p className="text-muted-foreground">
                Cadastre e organize todos os seus processos judiciais em um único lugar com informações completas e estruturadas.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="border-l-4 border-l-accent pl-6">
              <div className="flex items-center gap-3 mb-4">
                <Calendar className="w-6 h-6 text-accent" />
                <h3 className="text-xl font-semibold text-foreground">
                  Controle de Prazos
                </h3>
              </div>
              <p className="text-muted-foreground">
                Nunca perca um prazo importante. Receba alertas automáticos e mantenha seu calendário sempre atualizado.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="border-l-4 border-l-accent pl-6">
              <div className="flex items-center gap-3 mb-4">
                <Users className="w-6 h-6 text-accent" />
                <h3 className="text-xl font-semibold text-foreground">
                  Gestão de Clientes
                </h3>
              </div>
              <p className="text-muted-foreground">
                Mantenha informações detalhadas de seus clientes e partes, vinculadas aos seus processos.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="border-l-4 border-l-accent pl-6">
              <div className="flex items-center gap-3 mb-4">
                <Shield className="w-6 h-6 text-accent" />
                <h3 className="text-xl font-semibold text-foreground">
                  Armazenamento Seguro
                </h3>
              </div>
              <p className="text-muted-foreground">
                Upload e armazenamento seguro de documentos processuais na nuvem com acesso rápido.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="border-l-4 border-l-accent pl-6">
              <div className="flex items-center gap-3 mb-4">
                <MessageSquare className="w-6 h-6 text-accent" />
                <h3 className="text-xl font-semibold text-foreground">
                  Assistente Jurídico IA
                </h3>
              </div>
              <p className="text-muted-foreground">
                Receba sugestões inteligentes para redação de petições, análise de documentos e jurisprudência.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="border-l-4 border-l-accent pl-6">
              <div className="flex items-center gap-3 mb-4">
                <Zap className="w-6 h-6 text-accent" />
                <h3 className="text-xl font-semibold text-foreground">
                  Dashboard Inteligente
                </h3>
              </div>
              <p className="text-muted-foreground">
                Visualize em tempo real estatísticas, prazos próximos e atividades recentes do seu escritório.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="border-t border-border">
        <div className="container py-20 text-center">
          <h2 className="text-4xl font-bold text-foreground mb-6">
            Pronto para transformar sua prática jurídica?
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Junte-se a advogados que já estão aumentando sua produtividade com nosso sistema.
          </p>
          <Button
            onClick={() => window.location.href = getLoginUrl()}
            className="bg-accent text-accent-foreground hover:bg-accent/90 px-8 py-6 text-lg"
          >
            Comece Gratuitamente
          </Button>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-border">
        <div className="container py-8">
          <p className="text-center text-muted-foreground">
            © 2026 Legal Case Manager. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </div>
  );
}
