import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";

interface CartItem {
  product: {
    id: string;
    categoryId: string;
  };
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface SuggestedProduct {
  id: string;
  name: string;
  price: number;
  category_id: string | null;
  image_url: string | null;
  is_cold: boolean | null;
  is_alcoholic: boolean | null;
  has_container: boolean | null;
  category: Category | null;
}

function categoryMatches(categoryName: string | undefined, patterns: string[]): boolean {
  if (!categoryName) return false;
  const lowerName = categoryName.toLowerCase();
  return patterns.some(pattern => lowerName.includes(pattern.toLowerCase()));
}

export function useSuggestedProducts(cartItems: CartItem[], storeId: string) {
  const { data: categories = [] } = useQuery({
    queryKey: ["categories-suggestions", storeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("id, slug, name")
        .eq("is_active", true)
        .eq("store_id", storeId);

      if (error) throw error;
      return data as Category[];
    },
    enabled: !!storeId,
  });

  const cartCategoryNames = useMemo(() => {
    return cartItems
      .map(item => categories.find(c => c.id === item.product.categoryId)?.name)
      .filter(Boolean) as string[];
  }, [cartItems, categories]);

  const cartAnalysis = useMemo(() => {
    const hasDestilados = cartCategoryNames.some(name =>
      categoryMatches(name, ["whisky", "whiskey", "vodka", "gin", "destilado"])
    );
    const hasCervejas = cartCategoryNames.some(name => categoryMatches(name, ["cerveja", "beer"]));
    const hasChurrasco = cartCategoryNames.some(name => categoryMatches(name, ["churrasco", "carvão"]));

    return { hasDestilados, hasCervejas, hasChurrasco };
  }, [cartCategoryNames]);

  const suggestionPatterns = useMemo(() => {
    if (cartAnalysis.hasDestilados) return ["energético", "gelo", "água", "coco"];
    if (cartAnalysis.hasChurrasco) return ["cerveja", "refrigerante", "carvão"];
    if (cartAnalysis.hasCervejas) return ["gelo", "saco"];
    return [];
  }, [cartAnalysis]);

  const suggestionCategoryIds = useMemo(() => {
    return categories
      .filter(cat => categoryMatches(cat.name, suggestionPatterns))
      .map(cat => cat.id);
  }, [categories, suggestionPatterns]);

  const { data: rawProducts = [], isLoading } = useQuery({
    queryKey: ["suggested-products", storeId, suggestionCategoryIds],
    queryFn: async () => {
      const query = supabase
        .from("products")
        .select(`
          id, name, price, category_id, image_url, 
          is_cold, is_alcoholic, has_container,
          category:categories(id, name, slug)
        `)
        .eq("is_active", true)
        .eq("store_id", storeId);

      if (suggestionCategoryIds.length > 0) {
        query.in("category_id", suggestionCategoryIds).limit(10);
      } else {
        query.eq("is_suggestion", true).limit(6);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Sanitização para garantir que 'category' seja um objeto, não um array
      const sanitizedData = (data || []).map(p => ({
        ...p,
        category: Array.isArray(p.category) ? p.category[0] : p.category
      }));

      return sanitizedData as unknown as SuggestedProduct[];
    },
    enabled: !!storeId && categories.length > 0,
  });

  const cartProductIds = cartItems.map(item => item.product.id);
  const suggestedProducts = useMemo(() => {
    let list = rawProducts.filter(p => !cartProductIds.includes(p.id));
    if (cartAnalysis.hasDestilados) {
      list = list.filter(p => !p.name.toLowerCase().includes("cerveja"));
    }
    return list.slice(0, 6);
  }, [rawProducts, cartProductIds, cartAnalysis.hasDestilados]);

  return {
    suggestedProducts,
    isLoading,
    hasSuggestions: suggestedProducts.length > 0,
  };
}