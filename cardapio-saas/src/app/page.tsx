'use client';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppContainer } from "@/components/layout/AppContainer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Store, ArrowRight, Loader2, Lock, Sparkles } from "lucide-react";

export default function WelcomePage() {
  const [slug, setSlug] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  // Evita erros de hidratação
  useEffect(() => setMounted(true), []);

  const handleNavigation = async (path: 'client' | 'admin' | 'register') => {
    if (path === 'register') {
      router.push('/register');
      return;
    }

    if (!slug.trim()) return;

    setIsValidating(true);
    const cleanSlug = slug.trim().toLowerCase();

    try {
      const { data, error } = await supabase
        .from('stores')
        .select('id')
        .eq('slug', cleanSlug)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        toast({
          variant: "destructive",
          title: "Cardápio não encontrado",
          description: `A loja "${cleanSlug}" ainda não está cadastrada no nosso portal.`,
        });
        setIsValidating(false);
        return;
      }

      const targetPath = path === 'admin' ? `/${cleanSlug}/admin` : `/${cleanSlug}`;
      router.push(targetPath);
      setIsValidating(false);

    } catch (err) {
      toast({
        variant: "destructive",
        title: "Erro de conexão",
        description: "Não foi possível validar o nome da loja. Tente novamente.",
      });
      setIsValidating(false);
    }
  };

  if (!mounted) return null;

  return (
    <AppContainer>
      <div className="flex flex-col items-center justify-center min-h-screen px-6 py-12 text-center bg-background transition-colors duration-300">

        {/* Logo Container com cor de destaque do Portal */}
        <div className="w-20 h-20 bg-[#1caf08] rounded-3xl flex items-center justify-center shadow-xl mb-8 animate-in zoom-in duration-500">
          <Store className="w-10 h-10 text-black" />
        </div>

        <h1 className="text-3xl font-black uppercase tracking-tighter text-foreground mb-2 leading-none">
          Portal do Cardápio
        </h1>
        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] mb-10">
          Gravatá • Pernambuco
        </p>

        <div className="w-full space-y-3 max-w-sm">
          <Input
            type="text"
            placeholder="Nome da loja (ex: expresso)"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            disabled={isValidating}
            onKeyDown={(e) => e.key === 'Enter' && handleNavigation('client')}
            className="h-16 px-6 rounded-2xl border-2 border-border bg-card font-bold text-lg focus:border-[#1caf08] transition-all outline-none text-foreground placeholder:text-muted-foreground/50"
          />

          <Button
            onClick={() => handleNavigation('client')}
            disabled={!slug.trim() || isValidating}
            className="w-full h-16 rounded-2xl bg-[#1caf08] text-black hover:bg-[#1caf08] font-black uppercase tracking-widest text-sm shadow-lg active:scale-95 transition-all cursor-pointer"
          >
            {isValidating ? (
              <Loader2 className="animate-spin w-5 h-5" />
            ) : (
              <>Ver Cardápio <ArrowRight className="ml-2 w-4 h-4" /></>
            )}
          </Button>
        </div>

        <div className="mt-6 w-full max-w-sm">
          <Button
            onClick={() => handleNavigation('register')}
            variant="ghost"
            disabled={isValidating}
            className="w-full h-14 rounded-2xl border-2 border-dashed border-amber-400/30 text-[#1caf08] font-black uppercase text-[10px] tracking-widest hover:bg-amber-400/10 flex gap-2 transition-colors cursor-pointer"
          >
            <Sparkles className="w-4 h-4" /> Quero criar meu cardápio grátis
          </Button>
        </div>

        <div className="mt-12 pt-8 border-t border-dashed border-border w-full max-w-sm">
          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-4">
            Acesso Administrativo
          </p>
          <Button
            variant="outline"
            disabled={!slug.trim() || isValidating}
            onClick={() => handleNavigation('admin')}
            className="w-full h-14 rounded-2xl border-2 border-border font-black uppercase text-[11px] tracking-widest hover:bg-muted text-foreground flex gap-2 shadow-sm cursor-pointer"
          >
            <Lock className="w-4 h-4" /> Acessar Painel Admin
          </Button>
        </div>

        <footer className="mt-auto pt-10 text-[9px] font-bold text-muted-foreground/40 uppercase tracking-[0.2em]">
          Erivelton Rodrigues • 2026
        </footer>
      </div>
    </AppContainer>
  );
}