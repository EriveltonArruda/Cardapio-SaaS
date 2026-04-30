"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/layout/Header";
import { BottomNav } from "@/components/layout/BottomNav";
import { BannerCarousel } from "@/components/home/BannerCarousel";
import { StoreInfo } from "@/components/home/StoreInfo";
import { CategoryCard } from "@/components/home/CategoryCard";
import { AppContainer } from "@/components/layout/AppContainer";
import { Loader2 } from "lucide-react";
import { supabase } from '@/lib/supabase/client';
import { useStore } from "@/contexts/StoreContext";

interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  sort_order: number | null;
  is_active: boolean | null;
  has_promotion?: boolean;
}

interface Promotion {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
}

export default function Home() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { store } = useStore();

  useEffect(() => {
    let isMounted = true;

    const loadHomeData = async () => {
      try {
        console.log("🔄 Sincronizando dados com o banco...");
        if (!store?.id) return;

        const [catRes, promoRes] = await Promise.all([
          // AJUSTE N2: Mudado de sort_order.asc para name.asc para ordem alfabética
          supabase
            .from('categories')
            .select('*,products(promotion_id)')
            .eq('store_id', store.id)
            .eq('is_active', true)
            .order('name', { ascending: true }),
          supabase
            .from('promotions')
            .select('*')
            .eq('store_id', store.id)
            .eq('is_active', true)
            .order('sort_order', { ascending: true })
        ]);

        if (!isMounted) return;

        if (catRes.data) {
          const categoriesWithPromo = (catRes.data || []).map((cat: any) => ({
            ...cat,
            has_promotion: cat.products?.some((p: any) => p.promotion_id !== null)
          }));

          setCategories(categoriesWithPromo);
        }

        if (promoRes.data) {
          setPromotions(promoRes.data || []);
        }

      } catch (err) {
        console.error("Erro na conexão com o Supabase:", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadHomeData();
    return () => { isMounted = false; };
  }, [store?.id]);

  return (
    <AppContainer>
      <div className="min-h-screen bg-background pb-20">
        <Header />
        <StoreInfo />

        <BannerCarousel promotions={promotions} />

        <div className="p-4">
          <h2 className="text-lg font-bold mb-4 uppercase tracking-tight text-slate-900">Categorias</h2>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-primary/50" />
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                {store?.name || 'Sua Loja'}: Atualizando...
              </p>
            </div>
          ) : categories.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">Nenhuma categoria disponível.</p>
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