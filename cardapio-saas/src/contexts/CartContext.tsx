"use client";

import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { toast } from "@/hooks/use-toast";
import { useStore } from "@/contexts/StoreContext";

// ✅ Importando as interfaces globais do seu banco
import { Product, ProductAddon } from "@/types";

export interface CartItem {
  cartItemId: string; // ✅ ID único da "linha" do carrinho (resolve o bug de itens iguais com obs diferentes)
  product: Product;
  quantity: number;
  selectedAddons: { addon: ProductAddon; quantity: number }[];
  observations: string;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (product: Product, quantity: number, addons: ProductAddon[], obs: string) => void;
  addItem: (product: Product, quantity: number, addons: ProductAddon[], obs: string) => void;
  removeFromCart: (cartItemId: string) => void; // ✅ Agora usa o ID do carrinho, não do produto
  updateQuantity: (cartItemId: string, quantity: number) => void;
  addAddonToItem: (cartItemId: string, addon: ProductAddon) => void;
  removeItem: (cartItemId: string) => void;
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

  const addToCart = (product: Product, quantity: number, addonsReceived: ProductAddon[], observations: string) => {
    const formattedAddons = addonsReceived.map(addon => ({
      addon: addon,
      quantity: 1 // Adicionais geralmente vêm com qtd 1 da modal
    }));

    setItems((prev) => {
      // Verifica se já existe um item EXATAMENTE IGUAL (mesmo produto, addons e obs)
      const existingItemIndex = prev.findIndex(
        (item) =>
          item.product.id === product.id &&
          item.observations === observations &&
          JSON.stringify(item.selectedAddons) === JSON.stringify(formattedAddons)
      );

      // Se for idêntico, apenas soma a quantidade
      if (existingItemIndex >= 0) {
        const newItems = [...prev];
        newItems[existingItemIndex].quantity += quantity;
        return newItems;
      }

      // Se for diferente (ex: com e sem cebola), cria um novo registro independente
      const newItem: CartItem = {
        cartItemId: crypto.randomUUID(), // Gera um ID único para esta entrada no carrinho
        product,
        quantity,
        selectedAddons: formattedAddons,
        observations
      };

      return [...prev, newItem];
    });

    toast({
      title: "Adicionado ao carrinho! 🛒",
      duration: 2000,
    });
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
    if (typeof window !== "undefined") {
      localStorage.removeItem(storageKey);
    }
  };

  const getTotal = () => {
    return items.reduce((total, item) => {
      const itemPrice = item.product?.price || 0;

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
        addAddonToItem: () => { }, // Mantido para retrocompatibilidade
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