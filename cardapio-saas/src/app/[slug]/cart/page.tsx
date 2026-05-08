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
        <div className="min-h-screen bg-background pb-20 animate-in slide-in-from-right-8 duration-300">
          <div className="flex items-center px-4 py-3 border-b sticky top-0 bg-background/90 backdrop-blur-sm z-10">
            <button onClick={() => setShowCheckout(false)} className="p-2 -ml-2 hover:bg-muted rounded-full transition-colors cursor-pointer text-foreground">
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
      <div className="min-h-screen bg-background pb-36 animate-in fade-in duration-300 transition-colors">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border sticky top-0 bg-background/90 backdrop-blur-sm z-10">
          <PageHeader title={store?.name ? `Carrinho - ${store.name}` : "Carrinho"} showBack={false} />
          {items.length > 0 && (
            <button onClick={clearCart} className="flex items-center gap-1.5 text-destructive text-sm font-black uppercase tracking-widest hover:bg-destructive/10 px-3 py-1.5 rounded-lg transition-colors cursor-pointer">
              <Trash2 className="w-4 h-4" />
              Limpar
            </button>
          )}
        </div>

        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 px-4 animate-in zoom-in-95 duration-500">
            <div className="w-28 h-28 bg-muted rounded-full flex items-center justify-center mb-6 border-4 border-background shadow-lg">
              <span className="text-5xl">🛒</span>
            </div>
            <h2 className="text-2xl font-black mb-2 text-foreground">Carrinho Vazio</h2>
            <p className="text-muted-foreground text-center mb-8 max-w-[250px] font-medium leading-relaxed">
              Que tal adicionar algumas delícias para animar o seu dia?
            </p>
            <button onClick={() => router.push(`/${slug || ''}`)} className="px-10 py-4 bg-primary text-primary-foreground font-black uppercase tracking-widest text-sm rounded-2xl shadow-xl active:scale-95 transition-all cursor-pointer hover:bg-primary/90">
              Ver Cardápio
            </button>
          </div>
        ) : (
          <>
            <div className="px-4 py-2 space-y-1">
              {/* ✅ CORREÇÃO: Usando a cartItemId exclusiva gerada pelo CartContext */}
              {items.map((item) => (
                <CartItemRow key={item.cartItemId} item={item} />
              ))}
            </div>

            <SuggestionsSection />

            <div className="px-4 py-6">
              <button onClick={() => router.push(`/${slug || ''}`)} className="w-full py-4 border-2 border-primary/20 text-primary font-black rounded-2xl hover:bg-primary/5 transition-colors uppercase text-[11px] tracking-[0.2em] cursor-pointer">
                + Adicionar mais itens
              </button>
            </div>
          </>
        )}

        {items.length > 0 && (
          <div className="fixed bottom-[70px] left-0 right-0 p-4 z-20 pointer-events-none flex justify-center animate-in slide-in-from-bottom-10 duration-500">
            <div className="w-full max-w-md pointer-events-auto">
              <button onClick={() => setShowCheckout(true)} className="w-full h-16 bg-primary text-primary-foreground rounded-3xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.3)] flex items-center justify-between px-6 active:scale-[0.98] transition-all group cursor-pointer hover:brightness-105">
                <div className="flex items-center gap-3">
                  <span className="font-black text-sm uppercase tracking-widest">Confirmar</span>
                  <ArrowRight className="w-5 h-5 opacity-70 group-hover:translate-x-2 transition-transform" />
                </div>
                <div className="flex flex-col items-end">
                  <span className="bg-black/10 px-4 py-1.5 rounded-xl font-black text-lg">
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