'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';

interface Store {
  id: string;
  name: string;
  slug: string;
  primary_color: string;
  secondary_color: string;
  logo_url: string;
  is_open: boolean;
  whatsapp_number?: string;
  address?: string;
  opening_hours_week?: string;
  opening_hours_weekend?: string;
  opening_hours_sunday?: string;
}

interface StoreContextType {
  store: Store | null;
  isLoading: boolean;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const [store, setStore] = useState<Store | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadStoreData() {
      // O slug vem da URL: /[slug]/admin
      const slug = params?.slug as string;

      if (!slug) {
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('stores')
          .select('*')
          .eq('slug', slug)
          .single();

        if (error) throw error;
        setStore(data);

        // SaasFix: Injetando cores primárias nas variáveis globais dinamicamente
        if (data?.primary_color) {
          document.documentElement.style.setProperty('--primary', data.primary_color);
          document.documentElement.style.setProperty('--category-card-bg', data.primary_color);
          document.documentElement.style.setProperty('--header-bg', data.primary_color);
          document.documentElement.style.setProperty('--ring', data.primary_color);
        }
      } catch (err) {
        console.error("Erro ao carregar contexto da loja:", err);
      } finally {
        setIsLoading(false);
      }
    }

    loadStoreData();
  }, [params?.slug]);

  return (
    <StoreContext.Provider value={{ store, isLoading }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const context = useContext(StoreContext);
  if (context === undefined) {
    throw new Error('useStore deve ser usado dentro de um StoreProvider');
  }
  return context;
}