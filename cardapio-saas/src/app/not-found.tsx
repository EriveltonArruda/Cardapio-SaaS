'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { Store, ArrowLeft, Search } from "lucide-react";
import { AppContainer } from "@/components/layout/AppContainer";

export default function NotFound() {
  const pathname = usePathname();

  useEffect(() => {
    // Mantivemos a sua lógica de log para monitoramento!
    console.error("404 Error: Rota não encontrada:", pathname);
  }, [pathname]);

  return (
    <AppContainer>
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-500">

        <div className="w-24 h-24 bg-slate-50 rounded-[2rem] flex items-center justify-center mb-8 shadow-inner border-2 border-slate-100 -rotate-3">
          <Search className="w-10 h-10 text-slate-300" />
        </div>

        <h1 className="text-4xl font-black uppercase tracking-tighter mb-4 text-slate-900 leading-none">
          Ops! <br /> <span className="text-[#1caf08]">Não Encontrado</span>
        </h1>

        <p className="text-slate-500 font-bold mb-12 max-w-[280px] leading-relaxed text-sm">
          Parece que esse cardápio não existe ou o endereço foi digitado incorretamente.
        </p>

        <div className="space-y-4 w-full max-w-[300px]">
          <Link
            href="/"
            className="flex items-center justify-center gap-3 w-full h-16 bg-[#1caf08] hover:bg-green-600 text-white font-black uppercase tracking-[0.2em] text-[11px] rounded-2xl shadow-[0_10px_20px_-10px_rgba(28,175,8,0.5)] active:scale-95 transition-all"
          >
            <ArrowLeft className="w-4 h-4" /> Voltar ao Início
          </Link>

          <Link
            href="/register"
            className="flex items-center justify-center gap-3 w-full h-16 border-2 border-slate-100 text-slate-500 font-black uppercase tracking-[0.2em] text-[11px] rounded-2xl hover:bg-slate-50 transition-all active:scale-95"
          >
            <Store className="w-4 h-4" /> Criar Minha Loja
          </Link>
        </div>

        <p className="mt-16 text-[9px] font-black uppercase tracking-[0.3em] text-slate-300">
          SaaS Cardápio Digital © 2026
        </p>
      </div>
    </AppContainer>
  );
}