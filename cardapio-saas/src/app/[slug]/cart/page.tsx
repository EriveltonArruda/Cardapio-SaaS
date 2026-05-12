'use client';

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Trash2, ArrowRight, ArrowLeft, Ticket, Loader2, X } from "lucide-react";
import { BottomNav } from "@/components/layout/BottomNav";
import { CartItemRow } from "@/components/cart/CartItemRow";
import { SuggestionsSection } from "@/components/cart/SuggestionsSection";
import { CheckoutForm } from "@/components/checkout/CheckoutForm";
import { AppContainer } from "@/components/layout/AppContainer";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";
import { formatPrice } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

export default function Cart() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const slug = params?.slug as string;

  const { items, clearCart, getSubtotal, getDiscountAmount, getTotal, coupon, applyCoupon, removeCoupon } = useCart();

  const [showCheckout, setShowCheckout] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setIsApplyingCoupon(true);

    const result = await applyCoupon(couponCode.trim());
    if (result.success) {
      toast({ title: "Tudo certo! 🎉", description: result.message });
      setCouponCode("");
    } else {
      toast({ title: "Ops!", description: result.message, variant: "destructive" });
    }

    setIsApplyingCoupon(false);
  };

  if (showCheckout) {
    return (
      <AppContainer>
        <div className="min-h-screen bg-background pb-20 animate-in slide-in-from-right-8 duration-300">
          {/* ✅ FIX DO CABEÇALHO (Checkout) */}
          <div className="flex items-center px-4 py-3 border-b sticky top-0 bg-background/90 backdrop-blur-sm z-10">
            <button onClick={() => setShowCheckout(false)} className="p-2 -ml-2 hover:bg-muted rounded-full transition-colors cursor-pointer text-foreground">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-lg font-black uppercase tracking-tighter ml-2 text-foreground">Identificação</h1>
          </div>
          <CheckoutForm />
          <BottomNav />
        </div>
      </AppContainer>
    );
  }

  return (
    <AppContainer>
      <div className="min-h-screen bg-background pb-52 animate-in fade-in duration-300 transition-colors">
        {/* ✅ FIX DO CABEÇALHO (Carrinho) */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border sticky top-0 bg-background/90 backdrop-blur-sm z-10">
          <h1 className="text-xl font-black uppercase tracking-tighter text-foreground">Carrinho</h1>
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

            <div className="px-4 py-6 border-t border-border/50 bg-muted/10">
              <div className="mb-6">
                <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2 mb-3">
                  <Ticket className="w-4 h-4" /> Cupom de Desconto
                </label>

                {coupon ? (
                  <div className="flex items-center justify-between bg-green-500/10 border border-green-500/30 p-3 rounded-xl animate-in fade-in">
                    <div className="flex flex-col">
                      <span className="text-sm font-black text-green-600 uppercase tracking-widest">{coupon.code}</span>
                      <span className="text-xs text-green-600/80 font-medium">Cupom Aplicado!</span>
                    </div>
                    <button onClick={removeCoupon} className="p-2 bg-green-500/20 text-green-700 rounded-full hover:bg-green-500/30 transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Input
                      placeholder="Ex: PROMO10"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      className="h-12 uppercase font-bold tracking-widest bg-background"
                    />
                    <Button
                      onClick={handleApplyCoupon}
                      disabled={isApplyingCoupon || !couponCode.trim()}
                      className="h-12 px-6 bg-secondary text-secondary-foreground font-black uppercase tracking-widest hover:bg-secondary/80"
                    >
                      {isApplyingCoupon ? <Loader2 className="w-4 h-4 animate-spin" /> : "Aplicar"}
                    </Button>
                  </div>
                )}
              </div>

              <div className="space-y-3 pt-2">
                <div className="flex justify-between items-center text-sm font-bold text-muted-foreground">
                  <span>Subtotal</span>
                  <span>{formatPrice(getSubtotal())}</span>
                </div>

                {coupon && (
                  <div className="flex justify-between items-center text-sm font-black text-green-500 animate-in slide-in-from-right-4">
                    <span>Desconto</span>
                    <span>- {formatPrice(getDiscountAmount())}</span>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {items.length > 0 && (
          /* ✅ FIX DO VAZAMENTO DO GRADIENTE */
          <div className="fixed bottom-[70px] left-0 right-0 z-20 pointer-events-none flex justify-center animate-in slide-in-from-bottom-10 duration-500">
            <div className="w-full max-w-md pointer-events-auto bg-gradient-to-t from-background via-background/95 to-transparent pt-12 pb-4 px-4">
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