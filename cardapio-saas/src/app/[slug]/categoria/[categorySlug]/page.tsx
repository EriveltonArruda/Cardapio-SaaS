"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { BottomNav } from "@/components/layout/BottomNav";
import { ProductCard } from "@/components/product/ProductCard";
import { ProductDetailModal } from "@/components/product/ProductDetailModal";
import { AppContainer } from "@/components/layout/AppContainer";
import { useToast } from "@/hooks/use-toast";
import { supabase } from '@/lib/supabase/client';
import { useStore } from "@/contexts/StoreContext";
import { Loader2 } from "lucide-react"; // ✅ Importando o spinner padrão

// ✅ Importações Globais
import { Product, Category } from "@/types";

export default function CategoryPage() {
  const params = useParams();
  const categorySlug = params?.categorySlug as string;
  const { toast } = useToast();
  const { store } = useStore();

  const [category, setCategory] = useState<Category | null>(null);
  const [categoryProducts, setCategoryProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    async function fetchCategoryData() {
      if (!categorySlug || !store?.id) return;

      try {
        setLoading(true);

        const { data: catData, error: catError } = await supabase
          .from('categories')
          .select('*')
          .eq('store_id', store.id)
          .eq('slug', categorySlug)
          .single();

        if (catError || !catData) throw new Error("Categoria não encontrada");
        setCategory(catData as Category);

        const { data: prodData, error: prodError } = await supabase
          .from('products')
          .select('*')
          .eq('store_id', store.id)
          .eq('category_id', catData.id)
          .eq('is_active', true)
          .order('name', { ascending: true });

        if (prodError) throw prodError;

        // ✅ Cast direto: Removemos a gambiarra de "attributes" porque o nosso ProductCard já está refatorado para ler direto da raiz do objeto!
        setCategoryProducts((prodData as unknown as Product[]) || []);

      } catch (error: any) {
        toast({
          variant: "destructive",
          title: "Erro",
          description: error.message
        });
      } finally {
        setLoading(false);
      }
    }

    fetchCategoryData();
  }, [categorySlug, store?.id]);

  const filteredProducts = useMemo(() => {
    return categoryProducts.filter((p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [categoryProducts, searchTerm]);

  if (loading) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-background gap-3 animate-in fade-in duration-300">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Buscando produtos...</p>
      </div>
    );
  }

  return (
    <AppContainer>
      <div className="min-h-screen bg-background pb-20 animate-in fade-in duration-300">
        <PageHeader
          title={category?.name || "Categoria"}
          showSearch
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
        />

        {filteredProducts.length === 0 ? (
          <div className="text-center py-24 px-4 text-muted-foreground animate-in zoom-in-95 duration-300">
            <span className="text-5xl block mb-4 opacity-50">🔍</span>
            <p className="font-bold text-lg text-foreground mb-1">Nenhum produto aqui</p>
            <p className="text-sm">Tente buscar por outro termo ou volte mais tarde.</p>
          </div>
        ) : (
          <div className="px-4 divide-y divide-border">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onClick={() => setSelectedProduct(product)}
              />
            ))}
          </div>
        )}

        {selectedProduct && (
          <ProductDetailModal
            product={selectedProduct}
            onClose={() => setSelectedProduct(null)}
          />
        )}
        <BottomNav />
      </div>
    </AppContainer>
  );
}