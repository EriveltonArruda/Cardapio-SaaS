"use client";

import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { useParams } from "next/navigation";
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

  // ESTRATÉGIA N2: Hidratação (Evita erro de SSR e lê localStorage via Client-Side)
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

  // Salva no LocalStorage sempre que o carrinho mudar
  useEffect(() => {
    if (isHydrated) {
      localStorage.setItem(storageKey, JSON.stringify(items));
    }
  }, [items, isHydrated, storageKey]);

  const addToCart = (product: any, quantity: number, selectedAddons: any[], observations: string) => {
    setItems((prev) => {
      const existingItemIndex = prev.findIndex(
        (item) => item.product.id === product.id && item.observations === observations
      );

      if (existingItemIndex >= 0) {
        const newItems = [...prev];
        newItems[existingItemIndex].quantity += quantity;
        return newItems;
      }

      return [...prev, { product, quantity, selectedAddons, observations }];
    });

    // MELHORIA DE UX: Duração reduzida para 2 segundos (2000ms)
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

  const addAddonToItem = (productId: string, addon: CartAddon) => {
    setItems((prev) => {
      return prev.map((item) => {
        if (item.product.id === productId) {
          const existingAddonIndex = item.selectedAddons.findIndex(a => a.addon.id === addon.id);
          let newSelectedAddons;

          if (existingAddonIndex >= 0) {
            newSelectedAddons = [...item.selectedAddons];
            newSelectedAddons[existingAddonIndex].quantity += 1;
          } else {
            newSelectedAddons = [...item.selectedAddons, { addon: addon, quantity: 1 }];
          }
          return { ...item, selectedAddons: newSelectedAddons };
        }
        return item;
      });
    });
  };

  const clearCart = () => {
    setItems([]);
    localStorage.removeItem(storageKey);
  };

  const getTotal = () => {
    return items.reduce((total, item) => {
      const itemTotal = item.product.price * item.quantity;
      const addonsTotal = item.selectedAddons.reduce((sum, acc) => sum + (acc.addon.price * acc.quantity), 0);
      return total + itemTotal + addonsTotal;
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
        addAddonToItem,
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