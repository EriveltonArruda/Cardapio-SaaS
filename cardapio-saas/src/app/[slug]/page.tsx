"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, notFound } from "next/navigation"; // ✅ IMPORTADO o notFound
import { Header } from "@/components/layout/Header";
import { BottomNav } from "@/components/layout/BottomNav";
import { BannerCarousel } from "@/components/home/BannerCarousel";
import { StoreInfo } from "@/components/home/StoreInfo";
import { CategoryCard } from "@/components/home/CategoryCard";
import { AppContainer } from "@/components/layout/AppContainer";
import { Loader2 } from "lucide-react";
import { supabase } from '@/lib/supabase/client';
import { useStore } from "@/contexts/StoreContext";

// Importando as interfaces globais
import { Category, Promotion } from "@/types";

interface CategoryWithPromo extends Category {
  has_promotion?: boolean;
}

export default function Home() {
  const [categories, setCategories] = useState<CategoryWithPromo[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(true);

  const { store, isLoading: isStoreLoading } = useStore();
  const params = useParams();

  // ✅ REDIRECIONAMENTO CORRETO PARA A TELA 404
  // Se terminou de carregar, não achou a loja e tem um slug na URL, dispara o erro.
  if (!isStoreLoading && !store && params?.slug) {
    notFound();
  }

  const loadHomeData = useCallback(async (storeId: string) => {
    try {
      setIsDataLoading(true);

      const [catRes, promoRes] = await Promise.all([
        supabase
          .from('categories')
          .select('*,products(promotion_id)')
          .eq('store_id', storeId)
          .eq('is_active', true)
          .order('name', { ascending: true }),
        supabase
          .from('promotions')
          .select('*')
          .eq('store_id', storeId)
          .eq('is_active', true)
          .order('sort_order', { ascending: true })
      ]);

      if (catRes.data) {
        const categoriesWithPromo = (catRes.data as any[]).map((cat) => ({
          ...(cat as Category),
          has_promotion: cat.products?.some((p: any) => p.promotion_id !== null)
        }));
        setCategories(categoriesWithPromo);
      }

      if (promoRes.data) {
        setPromotions((promoRes.data as unknown as Promotion[]) || []);
      }
    } catch (err) {
      console.error("Erro na conexão com o Supabase:", err);
    } finally {
      setIsDataLoading(false);
    }
  }, []);

  useEffect(() => {
    if (store?.id && !isStoreLoading) {
      loadHomeData(store.id);
    }
  }, [store?.id, isStoreLoading, loadHomeData]);

  // Tela de Splash
  if (isStoreLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em]">
          Validando acesso...
        </p>
      </div>
    );
  }

  // Prevenção de renderização (Opcional agora, pois o notFound já interrompe o fluxo, mas é bom manter)
  if (!store) return null;

  return (
    <AppContainer>
      <div className="min-h-screen bg-background pb-20 transition-colors duration-300">
        <Header />
        <StoreInfo />
        <BannerCarousel promotions={promotions} />

        <div className="p-4">
          <h2 className="text-lg font-black mb-4 uppercase tracking-tight text-foreground transition-colors">
            Categorias
          </h2>

          {isDataLoading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-primary/50" />
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest text-center">
                {store.name}: Atualizando...
              </p>
            </div>
          ) : categories.length === 0 ? (
            <div className="text-center py-12 px-6 border-2 border-dashed border-border rounded-3xl">
              <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest">
                Nenhuma categoria disponível no momento.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {categories.map((category) => (
                <CategoryCard key={category.id} category={category} />
              ))}
            </div>
          )}
        </div>
        <BottomNav />
      </div>
    </AppContainer>
  );
}