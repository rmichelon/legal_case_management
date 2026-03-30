import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Input } from "@/components/ui/input";
import { Search, FileText, Users, Scale, Loader2 } from "lucide-react";

interface SearchResult {
  cases: Array<{ id: number; caseNumber: string; title: string }>;
  clients: Array<{ id: number; name: string; email: string }>;
  lawyers: Array<{ id: number; name: string; email: string }>;
  total: number;
}

export default function GlobalSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const [, navigate] = useLocation();

  const searchQuery = trpc.search.global.useQuery(
    { query },
    { enabled: query.length >= 2, staleTime: 5000 }
  );

  useEffect(() => {
    if (query.length >= 2) {
      setIsLoading(true);
    }
  }, [query]);

  useEffect(() => {
    if (searchQuery.data) {
      setResults(searchQuery.data);
      setIsLoading(false);
      setIsOpen(true);
    }
  }, [searchQuery.data]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Keyboard shortcut Ctrl+K
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        const input = searchRef.current?.querySelector("input");
        if (input) {
          input.focus();
          setIsOpen(true);
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleNavigate = (path: string) => {
    navigate(path);
    setIsOpen(false);
    setQuery("");
  };

  return (
    <div ref={searchRef} className="relative w-96">
      <div className="relative">
        <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar processos, clientes, advogados... (Ctrl+K)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.length >= 2 && setIsOpen(true)}
          className="pl-10 pr-10"
        />
        {isLoading && (
          <Loader2 className="absolute right-3 top-3 w-4 h-4 text-muted-foreground animate-spin" />
        )}
      </div>

      {/* Dropdown Results */}
      {isOpen && results && results.total > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-background border border-border rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
          {/* Cases Section */}
          {results.cases.length > 0 && (
            <div className="border-b border-border">
              <div className="px-4 py-2 bg-muted text-sm font-semibold flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Processos ({results.cases.length})
              </div>
              {results.cases.map((caseItem) => (
                <button
                  key={caseItem.id}
                  onClick={() => handleNavigate(`/management?caseId=${caseItem.id}`)}
                  className="w-full text-left px-4 py-2 hover:bg-muted transition-colors flex flex-col"
                >
                  <span className="font-medium text-sm">{caseItem.caseNumber}</span>
                  <span className="text-xs text-muted-foreground truncate">
                    {caseItem.title}
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Clients Section */}
          {results.clients.length > 0 && (
            <div className="border-b border-border">
              <div className="px-4 py-2 bg-muted text-sm font-semibold flex items-center gap-2">
                <Users className="w-4 h-4" />
                Clientes ({results.clients.length})
              </div>
              {results.clients.map((client) => (
                <button
                  key={client.id}
                  onClick={() => handleNavigate(`/clients?clientId=${client.id}`)}
                  className="w-full text-left px-4 py-2 hover:bg-muted transition-colors flex flex-col"
                >
                  <span className="font-medium text-sm">{client.name}</span>
                  <span className="text-xs text-muted-foreground truncate">
                    {client.email}
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Lawyers Section */}
          {results.lawyers.length > 0 && (
            <div>
              <div className="px-4 py-2 bg-muted text-sm font-semibold flex items-center gap-2">
                <Scale className="w-4 h-4" />
                Advogados ({results.lawyers.length})
              </div>
              {results.lawyers.map((lawyer) => (
                <button
                  key={lawyer.id}
                  onClick={() => handleNavigate(`/lawyers?lawyerId=${lawyer.id}`)}
                  className="w-full text-left px-4 py-2 hover:bg-muted transition-colors flex flex-col"
                >
                  <span className="font-medium text-sm">{lawyer.name}</span>
                  <span className="text-xs text-muted-foreground truncate">
                    {lawyer.email}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {isOpen && query.length >= 2 && results && results.total === 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-background border border-border rounded-lg shadow-lg p-4 text-center text-sm text-muted-foreground">
          Nenhum resultado encontrado para "{query}"
        </div>
      )}

      {/* Hint */}
      {isOpen && query.length === 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-background border border-border rounded-lg shadow-lg p-4 text-sm text-muted-foreground">
          Digite pelo menos 2 caracteres para buscar
        </div>
      )}
    </div>
  );
}
