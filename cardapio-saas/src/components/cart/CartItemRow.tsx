'use client';

import { Trash2, Minus, Plus } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { useCart, CartItem } from "@/contexts/CartContext";

interface CartItemRowProps {
  item: CartItem;
}

export function CartItemRow({ item }: CartItemRowProps) {
  const { updateQuantity, removeItem } = useCart();

  const product = item.product;
  const imageSource = product.image_url || (product.image !== "/placeholder.svg" ? product.image : null);

  // ✅ CORREÇÃO NA LÓGICA DE SOMA:
  // (Preço do Produto + Soma dos preços de cada Adicional) * Quantidade total de itens
  const itemTotal = useMemo(() => {
    const basePrice = product.price || 0;
    const addonsSum = item.selectedAddons?.reduce((sum, a) => {
      // Usamos acc.addon.price pois é a estrutura que definimos no CartContext
      return sum + (a.addon?.price || 0);
    }, 0) || 0;

    return (basePrice + addonsSum) * item.quantity;
  }, [item]);

  return (
    <div className="cart-item-row flex items-center gap-4 p-4 border-b border-border/50 last:border-0 animate-in fade-in duration-300">

      {/* Container da Imagem */}
      <div className="w-16 h-16 rounded-2xl bg-white shrink-0 flex items-center justify-center overflow-hidden border border-border shadow-sm">
        {imageSource ? (
          <img
            src={imageSource}
            alt={item.product.name}
            className="w-full h-full object-contain p-1"
          />
        ) : (
          <span className="text-2xl opacity-40">📦</span>
        )}
      </div>

      {/* Informações do Produto */}
      <div className="flex-1 min-w-0">
        <h3 className="font-black text-sm leading-tight text-foreground line-clamp-1">
          {item.product.name}
        </h3>

        {/* Lista os adicionais (PLANO PREMIUM) */}
        {item.selectedAddons && item.selectedAddons.length > 0 && (
          <div className="mt-1 flex flex-wrap gap-1">
            {item.selectedAddons.map((addon, idx) => (
              <span key={idx} className="text-[10px] text-primary font-bold bg-primary/5 px-1.5 py-0.5 rounded-md border border-primary/10">
                + {addon.addon.name}
              </span>
            ))}
          </div>
        )}

        {/* Observações do cliente */}
        {item.observations && (
          <p className="text-[10px] text-muted-foreground italic mt-1 bg-muted/30 p-1 rounded-lg px-2">
            " {item.observations} "
          </p>
        )}

        {/* Preço Total da Linha */}
        <p className="text-foreground font-black text-sm mt-2">{formatPrice(itemTotal)}</p>
      </div>

      {/* Botões de Ação */}
      <div className="flex flex-col items-end gap-2">
        <button
          onClick={() => removeItem(item.product.id)}
          className="p-2 text-muted-foreground hover:text-red-500 transition-colors active:scale-90 cursor-pointer"
        >
          <Trash2 className="w-4 h-4" />
        </button>

        <div className="flex items-center border border-border rounded-xl bg-muted/20 p-1">
          <button
            onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
            disabled={item.quantity <= 1}
            className="w-7 h-7 flex items-center justify-center hover:bg-background transition-colors rounded-lg disabled:opacity-30 cursor-pointer text-foreground"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>

          <span className="w-7 text-center text-xs font-black text-foreground">{item.quantity}</span>

          <button
            onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
            className="w-7 h-7 flex items-center justify-center hover:bg-background transition-colors rounded-lg cursor-pointer text-foreground"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

// Não esqueça de importar o useMemo no topo do arquivo se ele não estiver lá
import { useMemo } from "react";