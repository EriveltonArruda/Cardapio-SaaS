'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AppContainer } from "@/components/layout/AppContainer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase/client"; // Importação necessária
import { useToast } from "@/hooks/use-toast";     // Hook de alerta
import { Store, ArrowRight, Loader2, Lock, Sparkles, AlertCircle } from "lucide-react";

export default function WelcomePage() {
  const [slug, setSlug] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleNavigation = async (path: 'client' | 'admin' | 'register') => {
    // Para o registro, não precisamos validar slug
    if (path === 'register') {
      router.push('/register');
      return;
    }

    if (!slug.trim()) return;

    setIsValidating(true);
    const cleanSlug = slug.trim().toLowerCase();

    try {
      // VALIDACÃO: Verifica se a loja existe na tabela stores
      const { data, error } = await supabase
        .from('stores')
        .select('id')
        .eq('slug', cleanSlug)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        // Alerta caso o cardápio não seja encontrado
        toast({
          variant: "destructive",
          title: "Cardápio não encontrado",
          description: `A loja "${cleanSlug}" ainda não está cadastrada no nosso portal.`,
        });
        setIsValidating(false);
        return;
      }

      // Se existir, segue para a rota desejada
      const targetPath = path === 'admin' ? `/${cleanSlug}/admin` : `/${cleanSlug}`;
      router.push(targetPath);

    } catch (err) {
      toast({
        variant: "destructive",
        title: "Erro de conexão",
        description: "Não foi possível validar o nome da loja. Tente novamente.",
      });
      setIsValidating(false);
    }
  };

  return (
    <AppContainer>
      <div className="flex flex-col items-center justify-center min-h-screen px-6 py-12 text-center bg-white">

        <div className="w-20 h-20 bg-amber-400 rounded-3xl flex items-center justify-center shadow-xl mb-8 animate-in zoom-in duration-500">
          <Store className="w-10 h-10 text-slate-900" />
        </div>

        <h1 className="text-3xl font-black uppercase tracking-tighter text-slate-900 mb-2 leading-none">
          Portal do Cardápio
        </h1>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-10">
          Gravatá • Pernambuco
        </p>

        <div className="w-full space-y-3">
          <Input
            type="text"
            placeholder="Nome da loja (ex: expresso)"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            disabled={isValidating}
            className="h-16 px-6 rounded-2xl border-2 border-slate-200 font-bold text-lg focus:border-amber-400 transition-all outline-none"
          />

          <Button
            onClick={() => handleNavigation('client')}
            disabled={!slug.trim() || isValidating}
            className="w-full h-16 rounded-2xl bg-amber-400 text-slate-900 font-black uppercase tracking-widest text-sm shadow-lg active:scale-95 transition-all"
          >
            {isValidating ? (
              <Loader2 className="animate-spin w-5 h-5" />
            ) : (
              <>Ver Cardápio <ArrowRight className="ml-2 w-4 h-4" /></>
            )}
          </Button>
        </div>

        <div className="mt-6 w-full">
          <Button
            onClick={() => handleNavigation('register')}
            variant="ghost"
            disabled={isValidating}
            className="w-full h-14 rounded-2xl border-2 border-dashed border-amber-200 text-amber-700 font-black uppercase text-[10px] tracking-widest hover:bg-amber-50 flex gap-2 transition-colors"
          >
            <Sparkles className="w-4 h-4" /> Quero criar meu cardápio grátis
          </Button>
        </div>

        <div className="mt-12 pt-8 border-t border-dashed border-slate-200 w-full">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">
            Acesso Administrativo
          </p>
          <Button
            variant="outline"
            disabled={!slug.trim() || isValidating}
            onClick={() => handleNavigation('admin')}
            className="w-full h-14 rounded-2xl border-2 border-slate-200 font-black uppercase text-[11px] tracking-widest hover:bg-slate-50 text-slate-600 flex gap-2 shadow-sm"
          >
            <Lock className="w-4 h-4" /> Acessar Painel Admin
          </Button>
        </div>

        <footer className="mt-auto pt-10 text-[9px] font-bold text-slate-300 uppercase tracking-[0.2em]">
          Erivelton Rodrigues • 2026
        </footer>
      </div>
    </AppContainer>
  );
}