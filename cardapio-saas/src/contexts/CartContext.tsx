"use client";

import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { toast } from "@/hooks/use-toast";
import { useStore } from "@/contexts/StoreContext";
import { supabase } from "@/lib/supabase/client";

// ✅ Importando as interfaces globais do seu banco
import { Product, ProductAddon } from "@/types";

export interface CartItem {
  cartItemId: string;
  product: Product;
  quantity: number;
  selectedAddons: { addon: ProductAddon; quantity: number }[];
  observations: string;
}

// ✅ Adaptado para bater 100% com as colunas do seu banco
export interface AppliedCoupon {
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  min_purchase: number | null;
}

interface CartContextType {
  items: CartItem[];
  coupon: AppliedCoupon | null;
  addToCart: (product: Product, quantity: number, addons: ProductAddon[], obs: string) => void;
  addItem: (product: Product, quantity: number, addons: ProductAddon[], obs: string) => void;
  removeFromCart: (cartItemId: string) => void;
  updateQuantity: (cartItemId: string, quantity: number) => void;
  addAddonToItem: (cartItemId: string, addon: ProductAddon) => void;
  removeItem: (cartItemId: string) => void;
  clearCart: () => void;
  getSubtotal: () => number;
  getDiscountAmount: () => number;
  getTotal: () => number;
  applyCoupon: (code: string) => Promise<{ success: boolean; message: string }>;
  removeCoupon: () => void;
  totalItems: number;
}

const CartContext = createContext<CartContextType>({} as CartContextType);

export function CartProvider({ children }: { children: ReactNode }) {
  const { store } = useStore();
  const storageKey = `cart-storage-${store?.id}`;

  const [items, setItems] = useState<CartItem[]>([]);
  const [coupon, setCoupon] = useState<AppliedCoupon | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  // Carrega o carrinho salvo no LocalStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedCart = localStorage.getItem(storageKey);
      if (savedCart) {
        try {
          setItems(JSON.parse(savedCart));
        } catch (e) {
          console.error("Erro ao carregar carrinho", e);
        }
      }
    }
    setIsHydrated(true);
  }, [storageKey]);

  // Salva o carrinho no LocalStorage sempre que houver alteração
  useEffect(() => {
    if (isHydrated) {
      localStorage.setItem(storageKey, JSON.stringify(items));
    }
  }, [items, isHydrated, storageKey]);

  // ✅ CORREÇÃO: O VIGIA DO CUPOM AGORA ESTÁ NA RAIZ DO COMPONENTE
  useEffect(() => {
    if (coupon && coupon.min_purchase) {
      // Recalcula o subtotal cru
      const currentSubtotal = items.reduce((total, item) => {
        const itemPrice = item.product?.promo_price || item.product?.price || 0;
        const addonsTotal = item.selectedAddons?.reduce((sum, acc) => {
          const addonPrice = acc.addon?.price || 0;
          return sum + (addonPrice * (acc.quantity || 1));
        }, 0) || 0;
        return total + (itemPrice + addonsTotal) * item.quantity;
      }, 0);

      // Se ficou menor que o mínimo exigido, arranca o cupom sem dó!
      if (currentSubtotal > 0 && currentSubtotal < coupon.min_purchase) {
        setCoupon(null);
        toast({
          title: "Cupom Removido",
          description: `O valor mínimo para usar o cupom é R$ ${coupon.min_purchase.toFixed(2)}.`,
          variant: "destructive",
          duration: 4000
        });
      }
    }
  }, [items, coupon]); // Roda automaticamente sempre que um item for alterado

  const addToCart = (product: Product, quantity: number, addonsReceived: ProductAddon[], observations: string) => {
    const formattedAddons = addonsReceived.map(addon => ({
      addon: addon,
      quantity: 1
    }));

    setItems((prev) => {
      const existingItemIndex = prev.findIndex(
        (item) =>
          item.product.id === product.id &&
          item.observations === observations &&
          JSON.stringify(item.selectedAddons) === JSON.stringify(formattedAddons)
      );

      if (existingItemIndex >= 0) {
        const newItems = [...prev];
        newItems[existingItemIndex].quantity += quantity;
        return newItems;
      }

      const newItem: CartItem = {
        cartItemId: crypto.randomUUID(),
        product,
        quantity,
        selectedAddons: formattedAddons,
        observations
      };

      return [...prev, newItem];
    });

    toast({ title: "Adicionado ao carrinho! 🛒", duration: 2000 });
  };

  const updateQuantity = (cartItemId: string, quantity: number) => {
    setItems((prev) =>
      prev.map((item) =>
        item.cartItemId === cartItemId ? { ...item, quantity: Math.max(0, quantity) } : item
      ).filter((item) => item.quantity > 0)
    );
  };

  const removeFromCart = (cartItemId: string) => {
    setItems((prev) => prev.filter((item) => item.cartItemId !== cartItemId));
  };

  const clearCart = () => {
    setItems([]);
    setCoupon(null);
    if (typeof window !== "undefined") {
      localStorage.removeItem(storageKey);
    }
  };

  const getSubtotal = () => {
    return items.reduce((total, item) => {
      const itemPrice = item.product?.promo_price || item.product?.price || 0; // ✅ Corrigido para suportar promo_price
      const addonsTotal = item.selectedAddons?.reduce((sum, acc) => {
        const addonPrice = acc.addon?.price || 0;
        return sum + (addonPrice * (acc.quantity || 1));
      }, 0) || 0;
      return total + (itemPrice + addonsTotal) * item.quantity;
    }, 0);
  };

  const getDiscountAmount = () => {
    if (!coupon) return 0;
    const subtotal = getSubtotal();

    // Calcula o desconto de acordo com o tipo (Porcentagem ou Fixo)
    if (coupon.type === 'percentage') {
      return subtotal * (coupon.value / 100);
    }
    return coupon.value;
  };

  const getTotal = () => {
    const subtotal = getSubtotal();
    const discount = getDiscountAmount();
    return Math.max(0, subtotal - discount); // Garante que nunca vai dar valor negativo
  };

  // ✅ Busca o cupom no Supabase burlando o TypeScript exigente
  const applyCoupon = async (code: string) => {
    if (!store?.id) return { success: false, message: "Erro de identificação da loja" };

    try {
      const { data, error } = await (supabase as any)
        .from('coupons')
        .select('*')
        .eq('store_id', store.id)
        .eq('code', code.toUpperCase())
        .eq('is_active', true)
        .single();

      if (error || !data) {
        return { success: false, message: "Cupom inválido ou expirado." };
      }

      if (data.min_purchase && getSubtotal() < data.min_purchase) {
        return { success: false, message: `O valor mínimo para este cupom é R$ ${data.min_purchase.toFixed(2)}` };
      }

      setCoupon({
        code: data.code,
        type: data.type,
        value: data.value,
        min_purchase: data.min_purchase
      });

      return { success: true, message: "Cupom aplicado com sucesso!" };
    } catch (err) {
      return { success: false, message: "Erro ao validar o cupom." };
    }
  };

  const removeCoupon = () => {
    setCoupon(null);
    toast({ title: "Cupom removido." });
  };

  const totalItems = items.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        coupon,
        addToCart,
        addItem: addToCart,
        removeFromCart,
        updateQuantity,
        addAddonToItem: () => { },
        removeItem: removeFromCart,
        clearCart,
        getSubtotal,
        getDiscountAmount,
        getTotal,
        applyCoupon,
        removeCoupon,
        totalItems,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);