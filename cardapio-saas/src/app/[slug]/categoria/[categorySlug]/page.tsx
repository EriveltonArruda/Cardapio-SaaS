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

export default function CategoryPage() {
  const params = useParams();
  const categorySlug = params?.categorySlug as string;
  const { toast } = useToast();
  const { store } = useStore();

  const [category, setCategory] = useState<any>(null);
  const [categoryProducts, setCategoryProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
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
        setCategory(catData);

        const { data: prodData, error: prodError } = await supabase
          .from('products')
          .select('*')
          .eq('store_id', store.id)
          .eq('category_id', catData.id)
          .eq('is_active', true)
          .order('name', { ascending: true });

        if (prodError) throw prodError;

        setCategoryProducts((prodData || []).map((p: any) => ({
          ...p,
          price: Number(p.price),
          attributes: {
            cold: !!p.is_cold,
            alcoholic: !!p.is_alcoholic,
            container: !!p.has_container
          }
        })));

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

  if (loading) return <div className="flex h-screen items-center justify-center">Carregando...</div>;

  return (
    <AppContainer>
      <div className="min-h-screen bg-background pb-20">
        <PageHeader title={category?.name || "Categoria"} showSearch searchTerm={searchTerm} onSearchChange={setSearchTerm} />
        <div className="px-4 divide-y divide-border">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} onClick={() => setSelectedProduct(product)} />
          ))}
        </div>
        {selectedProduct && <ProductDetailModal product={selectedProduct} onClose={() => setSelectedProduct(null)} />}
        <BottomNav />
      </div>
    </AppContainer>
  );
}