"use client";

import { ChevronLeft, Search, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";

interface PageHeaderProps {
  title: string;
  showBack?: boolean;
  showSearch?: boolean;
  searchTerm?: string;
  onSearchChange?: (value: string) => void;
}

export function PageHeader({
  title,
  showBack = true,
  showSearch = false,
  searchTerm = "",
  onSearchChange
}: PageHeaderProps) {
  const router = useRouter();
  const [isSearching, setIsSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Foca o input automaticamente ao abrir a busca
  useEffect(() => {
    if (isSearching && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isSearching]);

  const handleCloseSearch = () => {
    setIsSearching(false);
    if (onSearchChange) onSearchChange(""); // Limpa a busca ao fechar
  };

  return (
    <header className="sticky top-0 z-40 bg-card border-b border-border shadow-sm">
      <div className="container flex items-center justify-between py-2 h-14">
        <div className="flex items-center gap-2 flex-1">
          {/* Botão Voltar: Só aparece se não estiver buscando */}
          {showBack && !isSearching && (
            <button
              onClick={() => router.back()}
              className="p-2 -ml-2 rounded-full hover:bg-muted transition-colors"
              aria-label="Voltar"
            >
              <ChevronLeft className="w-6 h-6 text-foreground" />
            </button>
          )}

          {/* Alternância entre Título e Campo de Busca */}
          {isSearching ? (
            <div className="flex-1 relative animate-in fade-in slide-in-from-left-2 duration-200">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                ref={inputRef}
                placeholder="O que você procura?"
                value={searchTerm}
                onChange={(e) => onSearchChange?.(e.target.value)}
                className="pl-9 pr-9 h-10 w-full bg-muted/50 border-none focus-visible:ring-1 ring-primary"
              />
              <button
                onClick={handleCloseSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-muted"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
          ) : (
            <h1 className="text-lg font-bold truncate text-foreground animate-in fade-in duration-300">
              {title}
            </h1>
          )}
        </div>

        {/* Botão de Lupa: Só aparece se showSearch for true e não estiver buscando */}
        {showSearch && !isSearching && (
          <button
            onClick={() => setIsSearching(true)}
            className="p-2 rounded-full hover:bg-muted transition-colors"
            aria-label="Buscar"
          >
            <Search className="w-5 h-5 text-foreground" />
          </button>
        )}
      </div>
    </header>
  );
}