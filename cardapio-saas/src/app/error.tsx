'use client';

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw, ArrowLeft } from "lucide-react";
import { AppContainer } from "@/components/layout/AppContainer";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Loga o erro para monitoramento, seguindo o mesmo padrão do not-found.tsx
    console.error("Erro de runtime capturado pelo Error Boundary:", error);
  }, [error]);

  return (
    <AppContainer>
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-500">
        <div className="w-24 h-24 bg-red-50 rounded-[2rem] flex items-center justify-center mb-8 shadow-inner border-2 border-red-100 -rotate-3">
          <AlertTriangle className="w-10 h-10 text-red-300" />
        </div>

        <h1 className="text-4xl font-black uppercase tracking-tighter mb-4 text-slate-900 leading-none">
          Ops! <br /> <span className="text-red-500">Algo deu errado</span>
        </h1>

        <p className="text-slate-500 font-bold mb-12 max-w-[280px] leading-relaxed text-sm">
          Tivemos um problema inesperado ao carregar essa página. Você pode tentar novamente ou voltar ao início.
        </p>

        <div className="space-y-4 w-full max-w-[300px]">
          <button
            onClick={() => reset()}
            className="flex items-center justify-center gap-3 w-full h-16 bg-[#1caf08] hover:bg-green-600 text-white font-black uppercase tracking-[0.2em] text-[11px] rounded-2xl shadow-[0_10px_20px_-10px_rgba(28,175,8,0.5)] active:scale-95 transition-all cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" /> Tentar Novamente
          </button>

          <Link
            href="/"
            className="flex items-center justify-center gap-3 w-full h-16 border-2 border-slate-100 text-slate-500 font-black uppercase tracking-[0.2em] text-[11px] rounded-2xl hover:bg-slate-50 transition-all active:scale-95"
          >
            <ArrowLeft className="w-4 h-4" /> Voltar ao Início
          </Link>
        </div>
      </div>
    </AppContainer>
  );
}
