import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { useEffect, useRef, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { ArrowLeft, Send, Loader2 } from "lucide-react";
import { Streamdown } from "streamdown";

interface Message {
  role: "user" | "assistant" | string;
  content: string | any;
}

export default function ChatBot() {
  const { isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();
  const [topic, setTopic] = useState("petition_draft");
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const sendMessageMutation = trpc.chat.sendMessage.useMutation();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage = inputValue;
    setInputValue("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);

    try {
      const response = await sendMessageMutation.mutateAsync({
        topic: topic as any,
        userMessage,
        conversationHistory: messages as any,
      });

      setMessages((response.conversationHistory as any) || messages);
    } catch (error: any) {
      toast.error(error.message || "Erro ao enviar mensagem");
      // Remove the user message if there was an error
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
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
    <div className="min-h-screen bg-background flex flex-col">
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
          <h1 className="text-4xl font-bold text-foreground">Assistente Jurídico IA</h1>
          <p className="text-muted-foreground mt-2">
            Converse com nosso assistente inteligente para redação de petições, análise de documentos e jurisprudência
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="container py-8 flex-1 flex flex-col">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-full">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="text-lg">Tópicos</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  variant={topic === "petition_draft" ? "default" : "outline"}
                  onClick={() => {
                    setTopic("petition_draft");
                    setMessages([]);
                  }}
                  className="w-full justify-start text-left"
                >
                  ✍️ Redação de Petições
                </Button>
                <Button
                  variant={topic === "document_analysis" ? "default" : "outline"}
                  onClick={() => {
                    setTopic("document_analysis");
                    setMessages([]);
                  }}
                  className="w-full justify-start text-left"
                >
                  📄 Análise de Documentos
                </Button>
                <Button
                  variant={topic === "jurisprudence" ? "default" : "outline"}
                  onClick={() => {
                    setTopic("jurisprudence");
                    setMessages([]);
                  }}
                  className="w-full justify-start text-left"
                >
                  ⚖️ Jurisprudência
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Chat Area */}
          <div className="lg:col-span-3 flex flex-col">
            <Card className="flex-1 flex flex-col">
              <CardHeader className="border-b border-border">
                <CardTitle>
                  {topic === "petition_draft"
                    ? "Redação de Petições"
                    : topic === "document_analysis"
                    ? "Análise de Documentos"
                    : "Jurisprudência"}
                </CardTitle>
                <CardDescription>
                  {topic === "petition_draft"
                    ? "Receba ajuda para redigir petições claras e bem fundamentadas"
                    : topic === "document_analysis"
                    ? "Analise documentos jurídicos e identifique pontos importantes"
                    : "Encontre jurisprudência relevante para seu caso"}
                </CardDescription>
              </CardHeader>

              {/* Messages */}
              <CardContent className="flex-1 overflow-y-auto p-6 space-y-4">
                {messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center text-muted-foreground">
                      <p className="mb-2">Comece uma conversa com o assistente</p>
                      <p className="text-sm">
                        {topic === "petition_draft"
                          ? "Descreva o tipo de petição que precisa redigir"
                          : topic === "document_analysis"
                          ? "Compartilhe detalhes sobre o documento a analisar"
                          : "Descreva seu caso para encontrar jurisprudência relevante"}
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    {messages.map((message, index) => (
                      <div
                        key={index}
                        className={`flex ${
                          message.role === "user"
                            ? "justify-end"
                            : "justify-start"
                        }`}
                      >
                        <div
                          className={`max-w-xs lg:max-w-md px-4 py-3 rounded ${
                            message.role === "user"
                              ? "bg-accent text-accent-foreground"
                              : "bg-muted text-foreground border border-border"
                          }`}
                        >
                          {message.role === "assistant" ? (
                            <Streamdown>{message.content}</Streamdown>
                          ) : (
                            <p className="text-sm whitespace-pre-wrap">
                              {message.content}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                    {isLoading && (
                      <div className="flex justify-start">
                        <div className="bg-muted text-foreground border border-border px-4 py-3 rounded flex items-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span className="text-sm">Pensando...</span>
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </>
                )}
              </CardContent>

              {/* Input */}
              <div className="border-t border-border p-6">
                <div className="flex gap-2">
                  <Input
                    placeholder="Digite sua mensagem..."
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === "Enter" && !isLoading) {
                        handleSendMessage();
                      }
                    }}
                    disabled={isLoading}
                    className="flex-1"
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={isLoading || !inputValue.trim()}
                    className="bg-accent text-accent-foreground hover:bg-accent/90"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
