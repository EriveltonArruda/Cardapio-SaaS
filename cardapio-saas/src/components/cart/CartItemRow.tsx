'use client';

import { Trash2, Minus, Plus } from "lucide-react";
// MUDANÇA 1: Importamos apenas formatPrice do mockData (função auxiliar), mas NÃO o tipo
import { formatPrice } from "@/lib/utils";
// MUDANÇA 2: Importamos o tipo CartItem do Contexto (Onde estão os dados reais)
import { useCart, CartItem } from "@/contexts/CartContext";

interface CartItemRowProps {
  item: CartItem;
}

export function CartItemRow({ item }: CartItemRowProps) {
  // Hooks do contexto do carrinho para atualizar estado global
  const { updateQuantity, removeItem } = useCart();

  // "Cast" forçado não é mais necessário se a tipagem estiver correta, 
  // mas mantemos a lógica de fallback da imagem
  const product = item.product;

  // Lógica de fallback da Imagem:
  // 1. Tenta usar 'image_url' (veio do Supabase)
  // 2. Se não tiver, tenta usar 'image' (veio do Mock antigo)
  const imageSource = product.image_url || (product.image !== "/placeholder.svg" ? product.image : null);

  // Cálculo do subtotal (Preço do Item + Preço dos Adicionais) * Quantidade
  const itemTotal =
    (item.product.price * item.quantity) +
    item.selectedAddons.reduce((sum, a) => sum + a.addon.price * a.quantity, 0);

  return (
    <div className="cart-item-row flex items-center gap-4 p-3 border-b last:border-0">

      {/* Container da Imagem */}
      <div className="w-14 h-14 rounded-xl bg-white flex-shrink-0 flex items-center justify-center overflow-hidden border p-1 shadow-sm">
        {imageSource ? (
          <img
            src={imageSource}
            alt={item.product.name}
            // 'object-contain' garante que a garrafa apareça inteira
            className="w-full h-full object-contain"
          />
        ) : (
          // Se não tiver imagem, mostra emoji baseado na categoria
          <span className="text-2xl opacity-40">
            {product.categoryId === "1" || product.categoryId === "2" ? "🍺" :
              product.categoryId === "3" ? "🥃" :
                "📦"}
          </span>
        )}
      </div>

      {/* Informações do Produto */}
      <div className="flex-1 min-w-0">
        <h3 className="font-bold text-sm leading-snug line-clamp-2">
          {item.quantity}x {item.product.name}
        </h3>

        {/* Lista os adicionais (ex: + Gelo) */}
        {item.selectedAddons && item.selectedAddons.filter((a) => a.quantity > 0).map((addon) => (
          <p key={addon.addon.id} className="text-[10px] text-muted-foreground font-medium">
            + {addon.quantity}x {addon.addon.name}
          </p>
        ))}

        {/* Observações do cliente */}
        {item.observations && (
          <p className="text-[10px] text-muted-foreground italic mt-0.5">📝 {item.observations}</p>
        )}

        {/* Preço formatado (R$ 0,00) */}
        <p className="text-primary font-black text-sm mt-1">{formatPrice(itemTotal)}</p>
      </div>

      {/* Botões de Ação (+ / - / Lixeira) */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => removeItem(item.product.id)}
          className="p-2 text-muted-foreground hover:text-destructive transition-colors active:scale-90"
        >
          <Trash2 className="w-4 h-4" />
        </button>

        <div className="flex items-center border border-border rounded-lg bg-muted/20">
          <button
            onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
            disabled={item.quantity <= 1}
            className="p-1.5 hover:bg-background transition-colors rounded-l-lg disabled:opacity-30"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>

          <span className="w-7 text-center text-xs font-bold">{item.quantity}</span>

          <button
            onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
            className="p-1.5 hover:bg-background transition-colors rounded-r-lg"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}