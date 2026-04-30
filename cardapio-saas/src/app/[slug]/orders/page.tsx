"use client";

import { PageHeader } from "@/components/layout/PageHeader";
import { BottomNav } from "@/components/layout/BottomNav";
import { AppContainer } from "@/components/layout/AppContainer";

export default function OrdersPage() {
  return (
    <AppContainer>
      <div className="min-h-screen bg-background pb-20">
        <PageHeader title="Pedidos" showBack={false} />
        <div className="flex flex-col items-center justify-center py-16 px-4">
          <span className="text-6xl mb-4">📋</span>
          <h2 className="text-xl font-bold mb-2">Histórico de Pedidos</h2>
          <p className="text-muted-foreground text-center">Em breve você poderá consultar seus pedidos anteriores aqui!</p>
        </div>
        <BottomNav />
      </div>
    </AppContainer>
  );
}