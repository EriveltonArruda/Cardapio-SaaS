"use client";

import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { toast } from "@/hooks/use-toast";
import { useStore } from "@/contexts/StoreContext";

export interface CartProduct {
  id: string;
  name: string;
  price: number;
  image_url?: string | null;
  image?: string;
  categoryId: string;
}

export interface CartAddon {
  id: string;
  name: string;
  price: number;
}

export interface CartItem {
  product: CartProduct;
  quantity: number;
  // Estrutura mantida para compatibilidade
  selectedAddons: { addon: CartAddon; quantity: number }[];
  observations: string;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (product: any, quantity: number, addons: any[], obs: string) => void;
  addItem: (product: any, quantity: number, addons: any[], obs: string) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  addAddonToItem: (productId: string, addon: CartAddon) => void;
  removeItem: (productId: string) => void;
  clearCart: () => void;
  getTotal: () => number;
  totalItems: number;
}

const CartContext = createContext<CartContextType>({} as CartContextType);

export function CartProvider({ children }: { children: ReactNode }) {
  const { store } = useStore();
  const storageKey = `cart-storage-${store?.id}`;

  const [items, setItems] = useState<CartItem[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

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

  useEffect(() => {
    if (isHydrated) {
      localStorage.setItem(storageKey, JSON.stringify(items));
    }
  }, [items, isHydrated, storageKey]);

  const addToCart = (product: any, quantity: number, addonsReceived: any[], observations: string) => {
    // 🛡️ CORREÇÃO: Transforma o array simples do Modal na estrutura que o Contexto usa
    const formattedAddons = addonsReceived.map(addon => ({
      addon: addon,
      quantity: 1 // Adicionais de categoria geralmente são selecionados uma vez
    }));

    setItems((prev) => {
      // Verifica se já existe o mesmo produto com as mesmas observações E mesmos adicionais
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

      return [...prev, { product, quantity, selectedAddons: formattedAddons, observations }];
    });

    toast({
      title: "Adicionado ao carrinho!",
      duration: 2000,
    });
  };

  const updateQuantity = (productId: string, quantity: number) => {
    setItems((prev) =>
      prev.map((item) =>
        item.product.id === productId ? { ...item, quantity: Math.max(0, quantity) } : item
      ).filter((item) => item.quantity > 0)
    );
  };

  const removeFromCart = (productId: string) => {
    setItems((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const clearCart = () => {
    setItems([]);
    localStorage.removeItem(storageKey);
  };

  const getTotal = () => {
    return items.reduce((total, item) => {
      const itemPrice = item.product?.price || 0;

      // 🛡️ PROTEÇÃO: Verifica se acc (item do loop) e acc.addon existem antes de ler o price
      const addonsTotal = item.selectedAddons?.reduce((sum, acc) => {
        const addonPrice = acc.addon?.price || 0;
        return sum + (addonPrice * (acc.quantity || 1));
      }, 0) || 0;

      return total + (itemPrice + addonsTotal) * item.quantity;
    }, 0);
  };

  const totalItems = items.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        addItem: addToCart,
        removeFromCart,
        updateQuantity,
        addAddonToItem: () => { }, // Mantido por compatibilidade
        removeItem: removeFromCart,
        clearCart,
        getTotal,
        totalItems,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);