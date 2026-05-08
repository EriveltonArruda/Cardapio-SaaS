'use client';

import { useStore } from "@/contexts/StoreContext";
import { Sparkles, ShieldCheck } from "lucide-react";

export function PlanBadge() {
  const { store } = useStore();

  if (store?.plan_type === 'pro') {
    return (
      <div className="flex items-center gap-1.5 bg-gradient-to-r from-[#1caf08] to-emerald-600 text-white px-3 py-1 rounded-full shadow-lg border border-white/10 animate-in fade-in zoom-in duration-500">
        <Sparkles className="w-3 h-3 fill-white" />
        <span className="text-[9px] font-black uppercase tracking-wider">Plano PRO</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 bg-muted text-muted-foreground px-3 py-1 rounded-full border border-border">
      <ShieldCheck className="w-3 h-3" />
      <span className="text-[9px] font-black uppercase tracking-wider">Plano Starter</span>
    </div>
  );
}