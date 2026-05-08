"use client";

import { PageHeader } from "@/components/layout/PageHeader";
import { BottomNav } from "@/components/layout/BottomNav";
import { AppContainer } from "@/components/layout/AppContainer";

export default function OrdersPage() {
  return (
    <AppContainer>
      <div className="min-h-screen bg-background pb-20 animate-in fade-in duration-300">
        <PageHeader title="Meus Pedidos" showBack={false} />

        <div className="flex flex-col items-center justify-center py-24 px-4 animate-in zoom-in-95 duration-500">
          <div className="w-28 h-28 bg-muted rounded-full flex items-center justify-center mb-6 border-4 border-background shadow-lg">
            <span className="text-5xl">📋</span>
          </div>

          <h2 className="text-2xl font-black mb-2 text-foreground uppercase tracking-tight">
            Histórico de Pedidos
          </h2>

          <p className="text-muted-foreground text-center mb-8 max-w-[280px] font-medium leading-relaxed">
            Em breve você poderá consultar todos os seus pedidos anteriores e repeti-los com um clique!
          </p>
        </div>

        <BottomNav />
      </div>
    </AppContainer>
  );
}