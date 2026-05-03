"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
  const [isDataLoading, setIsDataLoading] = useState(true);

  // Pegamos os dados e o estado de carregamento do contexto global da loja
  const { store, isLoading: isStoreLoading } = useStore();
  const router = useRouter();

  // 🛡️ TRAVA DE SEGURANÇA: Redireciona se o slug for inválido ou não existir no banco
  useEffect(() => {
    if (!isStoreLoading && !store) {
      console.warn("⚠️ Loja não encontrada. Redirecionando para o portal...");
      router.replace('/');
    }
  }, [store, isStoreLoading, router]);

  // Efeito para carregar Categorias e Promoções vinculadas à loja encontrada
  useEffect(() => {
    let isMounted = true;

    const loadHomeData = async () => {
      try {
        if (!store?.id) return;

        setIsDataLoading(true);
        console.log("🔄 Sincronizando dados com o banco...");

        const [catRes, promoRes] = await Promise.all([
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
        if (isMounted) setIsDataLoading(false);
      }
    };

    loadHomeData();
    return () => { isMounted = false; };
  }, [store?.id]);

  // 1. Enquanto o Contexto valida a loja no Supabase
  if (isStoreLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-amber-400" />
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">
          Validando acesso...
        </p>
      </div>
    );
  }

  // 2. Se a loja não existe, não renderizamos nada (o useEffect fará o redirecionamento)
  if (!store) return null;

  // 3. Renderização do Cardápio real
  return (
    <AppContainer>
      <div className="min-h-screen bg-background pb-20">
        <Header />
        <StoreInfo />

        <BannerCarousel promotions={promotions} />

        <div className="p-4">
          <h2 className="text-lg font-black mb-4 uppercase tracking-tight text-slate-900">Categorias</h2>

          {isDataLoading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-primary/50" />
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest text-center">
                {store.name}: Atualizando...
              </p>
            </div>
          ) : categories.length === 0 ? (
            <div className="text-center py-12 px-6 border-2 border-dashed border-slate-100 rounded-3xl">
              <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">
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