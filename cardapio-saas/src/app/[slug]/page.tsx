"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { BottomNav } from "@/components/layout/BottomNav";
import { BannerCarousel } from "@/components/home/BannerCarousel";
import { StoreInfo } from "@/components/home/StoreInfo";
import { CategoryCard } from "@/components/home/CategoryCard";
import { AppContainer } from "@/components/layout/AppContainer";
import { Loader2 } from "lucide-react";
import { supabase } from '@/lib/supabase/client';
import { useStore } from "@/contexts/StoreContext";

// Interfaces mantidas conforme seu original
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

  const { store, isLoading: isStoreLoading } = useStore();
  const router = useRouter();
  const params = useParams();

  // 🛡️ TRAVA DE SEGURANÇA REFORÇADA: Evita o "bate e volta" indevido
  useEffect(() => {
    // Só tentamos validar o redirecionamento se o contexto NÃO estiver carregando
    // e se a loja for nula, mas houver um slug na URL.
    if (!isStoreLoading && !store && params?.slug) {

      // Adicionamos um pequeno delay de 500ms. 
      // Isso garante que não é apenas um "atraso" de transição do Next.js.
      const timer = setTimeout(() => {
        // Se após o delay a loja continua nula, aí sim redirecionamos.
        console.warn("⚠️ Loja não encontrada após tempo de espera. Redirecionando...");
        router.replace('/');
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [store, isStoreLoading, router, params?.slug]);

  // Memorizamos a função de carga para evitar que ela mude a cada renderização
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
      setIsDataLoading(false);
    }
  }, []);

  useEffect(() => {
    // Só dispara o fetch se tivermos o ID e o contexto NÃO estiver em loading
    if (store?.id && !isStoreLoading) {
      loadHomeData(store.id);
    }
  }, [store?.id, isStoreLoading, loadHomeData]);

  // 1. Tela de Splash (Respeitando o Dark Mode padrão)
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

  // 2. Prevenção de renderização sem dados enquanto o redirecionamento não acontece
  if (!store) return null;

  // 3. Renderização do Cardápio real
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