'use client';

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Trash2, ArrowRight, ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { BottomNav } from "@/components/layout/BottomNav";
import { CartItemRow } from "@/components/cart/CartItemRow";
import { SuggestionsSection } from "@/components/cart/SuggestionsSection";
import { CheckoutForm } from "@/components/checkout/CheckoutForm";
import { AppContainer } from "@/components/layout/AppContainer";
import { useCart } from "@/contexts/CartContext";
import { useStore } from "@/contexts/StoreContext";
import { formatPrice } from "@/lib/utils";

export default function Cart() {
  const router = useRouter();
  const params = useParams();
  const slug = params?.slug as string;
  const { store } = useStore();
  const { items, clearCart, getTotal } = useCart();
  const [showCheckout, setShowCheckout] = useState(false);

  if (showCheckout) {
    return (
      <AppContainer>
        <div className="min-h-screen bg-background pb-20">
          <div className="flex items-center px-4 py-3 border-b sticky top-0 bg-background z-10">
            <button onClick={() => setShowCheckout(false)} className="p-2 -ml-2 hover:bg-slate-100 rounded-full transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <PageHeader title="Identificação" showBack={false} />
          </div>
          <CheckoutForm />
          <BottomNav />
        </div>
      </AppContainer>
    );
  }

  return (
    <AppContainer>
      <div className="min-h-screen bg-background pb-36">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border sticky top-0 bg-background z-10">
          <PageHeader title={store?.name ? `Carrinho - ${store.name}` : "Carrinho"} showBack={false} />
          {items.length > 0 && (
            <button onClick={clearCart} className="flex items-center gap-1.5 text-destructive text-sm font-medium hover:bg-destructive/10 px-2 py-1 rounded transition-colors">
              <Trash2 className="w-4 h-4" />
              Limpar
            </button>
          )}
        </div>

        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-4 animate-in fade-in duration-500">
            <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-6">
              <span className="text-4xl">🛒</span>
            </div>
            <h2 className="text-xl font-bold mb-2">Seu carrinho está vazio</h2>
            <p className="text-muted-foreground text-center mb-8 max-w-[250px]">
              Que tal adicionar algumas bebidas geladas para animar o dia?
            </p>
            <button onClick={() => router.push(`/${slug || ''}`)} className="px-8 py-3 bg-primary text-primary-foreground font-bold rounded-xl shadow-lg active:scale-95">
              Ver Cardápio
            </button>
          </div>
        ) : (
          <>
            <div className="px-4 py-2 space-y-1">
              {items.map((item) => (
                <CartItemRow key={item.product.id} item={item} />
              ))}
            </div>

            <SuggestionsSection />

            <div className="px-4 py-6">
              <button onClick={() => router.push(`/${slug || ''}`)} className="w-full py-3 border-2 border-primary/20 text-primary font-bold rounded-xl hover:bg-primary/5 transition-colors uppercase text-xs tracking-widest">
                + Adicionar mais itens
              </button>
            </div>
          </>
        )}

        {items.length > 0 && (
          <div className="fixed bottom-[60px] left-0 right-0 p-4 z-20 pointer-events-none flex justify-center">
            <div className="w-full max-w-[480px] pointer-events-auto bg-gradient-to-t from-background via-background to-transparent pt-4 pb-2 px-4">
              <button onClick={() => setShowCheckout(true)} className="w-full h-14 bg-primary text-primary-foreground rounded-xl shadow-xl flex items-center justify-between px-6 active:scale-95 group">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-lg">Confirmar Pedido</span>
                  <ArrowRight className="w-5 h-5 opacity-70 group-hover:translate-x-1 transition-transform" />
                </div>
                <div className="flex flex-col items-end">
                  <span className="bg-black/20 px-3 py-1 rounded-lg font-mono font-bold text-sm">
                    {formatPrice(getTotal())}
                  </span>
                </div>
              </button>
            </div>
          </div>
        )}
        <BottomNav />
      </div>
    </AppContainer>
  );
}