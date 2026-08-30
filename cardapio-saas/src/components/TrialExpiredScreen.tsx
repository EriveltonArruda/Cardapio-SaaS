'use client';

import { Lock, Sparkles } from "lucide-react";
import { PLAN_PAYMENT_LINKS, SAAS_UPGRADE_WHATSAPP } from "@/lib/site";

interface TrialExpiredScreenProps {
  storeName: string;
}

// Tela mostrada tanto no cardápio público quanto no painel admin quando o
// trial de 7 dias venceu e a loja ainda não tem `subscription_active = true`.
// Reaproveita os mesmos links de pagamento do PlanGuard.tsx.
export function TrialExpiredScreen({ storeName }: TrialExpiredScreenProps) {
  const whatsappFallback = `https://wa.me/${SAAS_UPGRADE_WHATSAPP}?text=${encodeURIComponent(
    `Olá! O período grátis do meu cardápio (${storeName}) venceu e quero continuar. Como faço o pagamento?`
  )}`;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6 text-center">
      <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-4">
        <Lock className="w-8 h-8" />
      </div>
      <h1 className="text-xl font-black uppercase tracking-tighter text-foreground">
        Período grátis encerrado
      </h1>
      <p className="text-muted-foreground max-w-xs mt-2 text-sm">
        Os 7 dias grátis de <span className="font-bold text-foreground">{storeName}</span> terminaram.
        Escolha um plano para continuar usando o cardápio.
      </p>

      <div className="mt-8 w-full max-w-xs space-y-3">
        <a
          href={PLAN_PAYMENT_LINKS.starter || whatsappFallback}
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-center gap-2 w-full h-14 border-2 border-border rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-muted transition-all active:scale-95"
        >
          Assinar Starter — R$ 60/mês
        </a>
        <a
          href={PLAN_PAYMENT_LINKS.pro || whatsappFallback}
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-center gap-2 w-full h-14 bg-primary text-primary-foreground rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg hover:bg-primary/90 transition-all active:scale-95"
        >
          <Sparkles className="w-4 h-4" /> Assinar Pro — R$ 80/mês
        </a>
      </div>

      <p className="text-[10px] text-muted-foreground mt-6 max-w-xs">
        Já pagou? Fale com a gente pelo WhatsApp que liberamos na hora.
      </p>
    </div>
  );
}
