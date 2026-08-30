'use client';

import { useStore } from "@/contexts/StoreContext";
import { PLAN_PAYMENT_LINKS, SAAS_UPGRADE_WHATSAPP } from "@/lib/site";
import { Lock, Sparkles } from "lucide-react";

interface PlanGuardProps {
  children: React.ReactNode;
  featureName: string;
}

export function PlanGuard({ children, featureName }: PlanGuardProps) {
  const { store } = useStore();

  // Se for PRO, libera o acesso total
  if (store?.plan_type === 'pro') {
    return <>{children}</>;
  }

  // Se for Starter, aplica o bloqueio visual
  return (
    <div className="relative min-h-[200px] w-full overflow-hidden rounded-3xl border-2 border-dashed border-primary/20">
      {/* Camada de Bloqueio (Overlay) */}
      <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-background/60 backdrop-blur-[2px] p-6 text-center">
        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-3 shadow-inner">
          <Lock className="w-5 h-5 text-primary" />
        </div>

        <h3 className="text-sm font-black uppercase tracking-tighter text-foreground">
          {featureName} disponível no PRO
        </h3>

        <p className="text-[10px] text-muted-foreground font-bold uppercase mt-1 mb-5 max-w-[220px] leading-relaxed">
          Libere este recurso e aumente suas vendas por apenas + R$ 20,00 mensais
        </p>

        <button
          type="button"
          onClick={() => window.open(
            PLAN_PAYMENT_LINKS.pro || `https://wa.me/${SAAS_UPGRADE_WHATSAPP}?text=Olá! Gostaria de fazer o upgrade para o Plano Pro no meu cardápio.`,
            '_blank'
          )}
          className="bg-primary text-black font-black text-[10px] uppercase rounded-xl h-10 px-6 shadow-lg hover:scale-105 active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5" />
          Quero ser PRO
        </button>
      </div>

      {/* Conteúdo original (borrado e desativado) */}
      <div className="opacity-10 pointer-events-none select-none grayscale blur-[2px]">
        {children}
      </div>
    </div>
  );
}