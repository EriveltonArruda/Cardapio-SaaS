"use client";

import { useState, useEffect, useMemo } from "react";
import { X, Minus, Plus, Snowflake, Wine, Package, ShoppingCart, Check, Loader2 } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { useCart } from "@/contexts/CartContext";
import { useStore } from "@/contexts/StoreContext";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase/client";

interface ProductDetailModalProps {
  product: any;
  onClose: () => void;
}

export function ProductDetailModal({ product, onClose }: ProductDetailModalProps) {
  const [quantity, setQuantity] = useState(1);
  const [observations, setObservations] = useState("");
  const [availableAddons, setAvailableAddons] = useState<any[]>([]);
  const [selectedAddons, setSelectedAddons] = useState<any[]>([]);
  const [isLoadingAddons, setIsLoadingAddons] = useState(false);

  const { addItem } = useCart();
  const { store } = useStore();

  // Busca os adicionais vinculados à categoria deste produto
  useEffect(() => {
    async function fetchAddons() {
      if (!product?.category_id) return;

      setIsLoadingAddons(true);
      try {
        const { data, error } = await supabase
          .from('product_addons' as any)
          .select('*')
          .eq('category_id', product.category_id)
          .eq('is_active', true)
          .order('name');

        if (error) throw error;
        setAvailableAddons(data || []);
      } catch (err) {
        console.error("Erro ao carregar complementos:", err);
      } finally {
        setIsLoadingAddons(false);
      }
    }

    fetchAddons();
  }, [product?.category_id]);

  // Cálculo do total dinâmico (Preço base + adicionais) * quantidade
  const calculateTotal = useMemo(() => {
    const addonsSum = selectedAddons.reduce((acc, curr) => acc + curr.price, 0);
    return (product.price + addonsSum) * quantity;
  }, [product.price, selectedAddons, quantity]);

  const toggleAddon = (addon: any) => {
    setSelectedAddons(prev =>
      prev.find(a => a.id === addon.id)
        ? prev.filter(a => a.id !== addon.id)
        : [...prev, addon]
    );
  };

  const handleAddToCart = () => {
    // Enviamos o produto, quantidade, a lista de adicionais selecionados e as observações
    addItem(product, quantity, selectedAddons, observations || "");
    onClose();
  };

  const hasAnyBadge =
    product.is_cold ||
    product.is_alcoholic ||
    product.has_container ||
    product.is_featured ||
    product.is_artisanal ||
    product.is_new ||
    product.is_veggie ||
    product.is_wood_fire;

  return (
    <div className="fixed inset-0 z-[150] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-in fade-in duration-300 cursor-pointer"
        onClick={onClose}
      />

      <div
        className="relative w-full max-w-lg bg-background rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl animate-in slide-in-from-bottom-full duration-500 ease-out flex flex-col"
        style={{ maxHeight: '90vh' }}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 rounded-full bg-white/80 hover:bg-white shadow-md transition-all active:scale-90 cursor-pointer"
        >
          <X className="w-5 h-5 text-foreground" />
        </button>

        <div className="overflow-y-auto flex-1 pb-24 scrollbar-hide">
          {/* Imagem do Produto */}
          <div className="w-full h-64 bg-[#FFF] flex items-center justify-center relative overflow-hidden">
            {product.image_url ? (
              <img
                src={product.image_url}
                alt={product.name}
                className="w-full h-full object-contain p-4 drop-shadow-xl"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-amber-100 to-orange-100">
                <span className="text-7xl">📦</span>
              </div>
            )}
          </div>

          <div className="p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold leading-tight text-foreground">{product.name}</h2>
              <p className="text-2xl font-black text-primary mt-1">{formatPrice(product.price)}</p>

              {/* Tags */}
              {hasAnyBadge && (
                <div className="flex flex-wrap items-center gap-2 mt-4">
                  {product.is_featured && <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-700 text-[10px] font-black uppercase">🏆 Mais Pedido</span>}
                  {product.is_artisanal && <span className="px-3 py-1 rounded-full bg-red-100 text-red-700 text-[10px] font-black uppercase">🥩 Artesanal</span>}
                  {product.is_veggie && <span className="px-3 py-1 rounded-full bg-green-100 text-green-700 text-[10px] font-black uppercase">🌱 Veggie</span>}
                </div>
              )}

              {product.description && (
                <p className="text-sm text-muted-foreground mt-4 leading-relaxed">
                  {product.description}
                </p>
              )}
            </div>

            {/* SEÇÃO DE ADICIONAIS (PLANO PREMIUM) */}
            {isLoadingAddons ? (
              <div className="flex items-center gap-2 py-4">
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
                <span className="text-xs font-bold uppercase text-muted-foreground">Carregando complementos...</span>
              </div>
            ) : availableAddons.length > 0 && (
              <div className="mt-8 space-y-4 animate-in fade-in slide-in-from-top-4 duration-500">
                <div className="flex flex-col">
                  <h3 className="font-black uppercase text-[11px] tracking-widest text-primary">
                    Turbine seu pedido
                  </h3>
                  <p className="text-[10px] text-muted-foreground font-bold uppercase">
                    Adicione complementos à sua escolha
                  </p>
                </div>

                <div className="grid gap-2">
                  {availableAddons.map((addon) => (
                    <label
                      key={addon.id}
                      className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all cursor-pointer active:scale-[0.98] ${selectedAddons.find(a => a.id === addon.id)
                        ? "border-primary bg-primary/5"
                        : "border-border bg-card"
                        }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          className="hidden"
                          checked={selectedAddons.some(a => a.id === addon.id)}
                          onChange={() => toggleAddon(addon)}
                        />
                        <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors ${selectedAddons.some(a => a.id === addon.id)
                          ? "bg-primary border-primary"
                          : "border-muted-foreground/30"
                          }`}>
                          {selectedAddons.some(a => a.id === addon.id) && <Check className="w-3 h-3 text-black stroke-[4px]" />}
                        </div>
                        <span className="font-bold text-sm text-foreground">{addon.name}</span>
                      </div>
                      <span className="font-black text-xs text-primary">
                        + {formatPrice(addon.price)}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-8 space-y-3">
              <Label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">Alguma observação?</Label>
              <textarea
                value={observations}
                onChange={(e) => setObservations(e.target.value)}
                placeholder="Ex.: Sem cebola, ponto da carne mal passado, etc."
                className="w-full p-4 bg-muted/30 border-none rounded-2xl resize-none h-24 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all text-foreground"
              />
            </div>
          </div>
        </div>

        {/* Footer com Preço e Quantidade */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border bg-background/80 backdrop-blur-md">
          <div className="flex items-center justify-between mb-4 px-2">
            <span className="font-bold text-muted-foreground uppercase text-[10px] tracking-widest">Quantidade</span>
            <div className="flex items-center gap-4 bg-muted/20 p-1 rounded-full border border-border shadow-inner">
              <button
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="w-10 h-10 rounded-full bg-background border border-border flex items-center justify-center hover:bg-muted transition-all active:scale-90 disabled:opacity-30 cursor-pointer"
                disabled={quantity <= 1}
              >
                <Minus className="w-4 h-4 text-foreground" />
              </button>
              <span className="w-4 text-center text-md font-black text-foreground">{quantity}</span>
              <button
                onClick={() => setQuantity((q) => q + 1)}
                className="w-10 h-10 rounded-full bg-background border border-border flex items-center justify-center hover:bg-muted transition-all active:scale-90 cursor-pointer"
              >
                <Plus className="w-4 h-4 text-foreground" />
              </button>
            </div>
          </div>

          <button
            onClick={handleAddToCart}
            className="w-full h-14 rounded-2xl font-black text-md transition-all active:scale-[0.97] flex items-center justify-between px-8 shadow-xl hover:brightness-105 cursor-pointer"
            style={{ backgroundColor: store?.primary_color || '#FFB800', color: '#000' }}
          >
            <div className="flex items-center gap-3">
              <ShoppingCart className="w-5 h-5" />
              <span className="uppercase tracking-tighter">Adicionar ao Carrinho</span>
            </div>
            <span className="bg-black/10 px-4 py-1.5 rounded-xl text-sm font-black">
              {formatPrice(calculateTotal)}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}