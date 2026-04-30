"use client";

import { useState } from "react";
import { X, Minus, Plus, Snowflake, Wine, Package, ShoppingCart } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { useCart } from "@/contexts/CartContext";
import { useStore } from "@/contexts/StoreContext";
import { Label } from "@/components/ui/label";

interface ProductDetailModalProps {
  product: any;
  onClose: () => void;
}

export function ProductDetailModal({ product, onClose }: ProductDetailModalProps) {
  const [quantity, setQuantity] = useState(1);
  const [observations, setObservations] = useState("");
  const { addItem } = useCart();
  const { store } = useStore();

  const calculateTotal = () => {
    return product.price * quantity;
  };

  const handleAddToCart = () => {
    // ESTRATÉGIA N2: Centralizamos o feedback no CartContext.
    // O toast do Sonner foi removido para evitar avisos duplos na tela.
    addItem(product, quantity, [], observations || "");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop de fundo escuro com desfoque */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Container do Modal */}
      <div
        className="relative w-full max-w-lg bg-background rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl animate-in slide-in-from-bottom duration-300 flex flex-col"
        style={{ maxHeight: '90vh' }}
      >
        {/* Botão de Fechar flutuante */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 rounded-full bg-white/80 hover:bg-white shadow-md transition-all active:scale-90"
        >
          <X className="w-5 h-5 text-foreground" />
        </button>

        {/* Conteúdo com Scroll */}
        <div className="overflow-y-auto flex-1 pb-24">

          {/* Área da Imagem */}
          <div className="w-full h-64 bg-[#FFF] flex items-center justify-center relative overflow-hidden">
            {product.image_url ? (
              <img
                src={product.image_url}
                alt={product.name}
                className="w-full h-full object-contain p-4 drop-shadow-xl"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-amber-100 to-orange-100">
                <span className="text-7xl">
                  {String(product.category_id) === "1" || String(product.category_id) === "2" ? "🍺" :
                    String(product.category_id) === "3" ? "🥃" :
                      String(product.category_id) === "4" ? "🍸" :
                        String(product.category_id) === "6" ? "🥤" : "📦"}
                </span>
              </div>
            )}
          </div>

          {/* Detalhes do Produto */}
          <div className="p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold leading-tight">{product.name}</h2>
              <p className="text-2xl font-black text-primary mt-1">{formatPrice(product.price)}</p>
              {product.description && (
                <p className="text-sm text-muted-foreground mt-3 leading-relaxed">
                  {product.description}
                </p>
              )}
            </div>

            {/* Selos de Atributos */}
            {(product.is_cold || product.attributes?.cold || product.is_alcoholic || product.has_container) && (
              <div className="flex flex-wrap items-center gap-3 py-4 border-y border-border/50">
                {(product.is_cold || product.attributes?.cold) && (
                  <span className="product-badge product-badge-cold flex items-center gap-1.5 px-3 py-1">
                    <Snowflake className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-wider">Gelado</span>
                  </span>
                )}
                {(product.is_alcoholic || product.attributes?.alcoholic) && (
                  <span className="product-badge product-badge-alcoholic flex items-center gap-1.5 px-3 py-1">
                    <Wine className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-wider">Alcoólico</span>
                  </span>
                )}
                {(product.has_container || product.attributes?.container) && (
                  <span className="product-badge product-badge-container flex items-center gap-1.5 px-3 py-1">
                    <Package className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-wider">Vasilhame</span>
                  </span>
                )}
              </div>
            )}

            {/* Campo de Observações */}
            <div className="mt-6 space-y-3">
              <Label className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Observações</Label>
              <textarea
                value={observations}
                onChange={(e) => setObservations(e.target.value)}
                placeholder="Ex.: Sem gelo, copos descartáveis, etc."
                className="w-full p-4 bg-muted/30 border-none rounded-2xl resize-none h-28 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
              />
            </div>
          </div>
        </div>

        {/* Rodapé Fixo com Botão de Adicionar */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border bg-background/80 backdrop-blur-md">
          <div className="flex items-center justify-between mb-4">
            <span className="font-bold text-muted-foreground uppercase text-xs tracking-widest">Quantidade</span>
            <div className="flex items-center gap-4 bg-muted/20 p-1 rounded-full border shadow-inner">
              <button
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="w-10 h-10 rounded-full bg-background border flex items-center justify-center hover:bg-muted transition-all active:scale-90 disabled:opacity-30 shadow-sm"
                disabled={quantity <= 1}
              >
                <Minus className="w-5 h-5" />
              </button>
              <span className="w-6 text-center text-lg font-bold">{quantity}</span>
              <button
                onClick={() => setQuantity((q) => q + 1)}
                className="w-10 h-10 rounded-full bg-background border flex items-center justify-center hover:bg-muted transition-all active:scale-90 shadow-sm"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
          </div>

          <button
            onClick={handleAddToCart}
            className="w-full h-14 rounded-2xl font-bold text-lg transition-all active:scale-[0.97] flex items-center justify-between px-8 shadow-xl hover:brightness-105"
            style={{ backgroundColor: store?.primary_color || '#FFB800', color: '#000000' }}
          >
            <div className="flex items-center gap-3">
              <ShoppingCart className="w-5 h-5" />
              <span>Adicionar</span>
            </div>
            <span className="bg-black/10 px-4 py-1.5 rounded-xl text-sm font-black">
              {formatPrice(calculateTotal())}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}