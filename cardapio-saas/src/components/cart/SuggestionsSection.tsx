'use client';

import { useEffect, useState } from "react";
import { useCart } from "@/contexts/CartContext";
import { formatPrice } from "@/lib/utils";
import { Plus } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { useStore } from "@/contexts/StoreContext";

export function SuggestionsSection() {
  const { items, addToCart } = useCart();
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { store } = useStore();

  useEffect(() => {
    let isMounted = true;
    async function fetchSuggestions() {
      try {
        if (!store?.id) return;

        const response = await supabase
          .from('cart_suggestions' as any)
          .select('*,products(id,name,price,image_url,category_id)')
          .eq('store_id', store.id)
          .eq('is_active', true);

        if (response.data && isMounted) {
          const data = response.data;
          setSuggestions(data || []);
          console.log("📦 Sugestões Brutas do Banco:", data);
        }
      } catch (err) {
        console.error("Erro ao buscar sugestões:", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    fetchSuggestions();
    return () => { isMounted = false; };
  }, [store?.id]);

  const cartCategoryIds = items.map(item => item.product.categoryId || (item.product as any).category_id);
  const cartProductIds = items.map(item => item.product.id);

  const relevantSuggestions = suggestions.filter(suggestion => {
    const product = suggestion.products;
    if (!product) return false;

    if (cartProductIds.includes(product.id)) return false;
    if (!suggestion.category_ids || suggestion.category_ids.length === 0) return true;

    return suggestion.category_ids.some((catId: string) => cartCategoryIds.includes(catId));
  });

  const handleAdd = (suggestion: any) => {
    const productToCart = {
      id: suggestion.products.id,
      name: suggestion.products.name,
      price: suggestion.products.price,
      image_url: suggestion.products.image_url,
      categoryId: suggestion.products.category_id
    };
    addToCart(productToCart, 1, [], "");
  };

  if (isLoading || relevantSuggestions.length === 0) return null;

  return (
    <div className="px-4 py-6 bg-muted/20 border-t border-b border-border mt-4 animate-in fade-in duration-500 transition-colors">
      <h3 className="font-bold text-[10px] text-muted-foreground uppercase tracking-widest mb-4 text-left flex items-center gap-2">
        <span className="text-sm">💡</span> Aproveite e leve também
      </h3>
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
        {relevantSuggestions.map((suggestion) => (
          <div
            key={suggestion.id}
            className="min-w-37.5 max-w-37.5 bg-card border border-border rounded-2xl p-3 shadow-sm flex flex-col justify-between transition-colors"
          >
            <div className="h-20 w-full bg-muted/50 rounded-xl flex items-center justify-center overflow-hidden mb-2">
              {suggestion.products.image_url ? (
                <img
                  src={suggestion.products.image_url}
                  className="w-full h-full object-contain p-2"
                  alt={suggestion.products.name}
                />
              ) : <span className="text-2xl opacity-20">📦</span>}
            </div>
            <div className="space-y-0.5 mb-3 text-left">
              <p className="text-[10px] font-bold text-foreground line-clamp-2 leading-tight min-h-8">
                {suggestion.products.name}
              </p>
              <p className="text-xs font-black text-primary">
                {formatPrice(suggestion.products.price)}
              </p>
            </div>
            <button
              onClick={() => handleAdd(suggestion)}
              className="w-full py-2 bg-foreground text-background text-[9px] font-bold rounded-lg shadow-md active:scale-95 transition-all flex items-center justify-center gap-1 uppercase"
            >
              <Plus className="w-3 h-3" /> Adicionar
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}