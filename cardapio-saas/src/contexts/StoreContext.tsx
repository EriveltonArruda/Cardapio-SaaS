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
  text_color: string;
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
      const slug = params?.slug as string;

      // Se não houver slug, resetamos o estado e paramos o loading
      if (!slug) {
        setStore(null);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);

      try {
        const { data, error } = await supabase
          .from('stores')
          .select(`*, store_settings (*)`)
          .eq('slug', slug)
          .maybeSingle(); // Usamos maybeSingle para não disparar erro no console se não achar nada

        if (error) throw error;

        // Se a loja não existir no banco
        if (!data) {
          setStore(null);
          return;
        }

        const settings = Array.isArray(data.store_settings) ? data.store_settings[0] : data.store_settings;
        const activeSettings = settings || {};

        const mergedStore: Store = {
          id: data.id,
          slug: data.slug,
          name: activeSettings.store_name || data.name,
          logo_url: activeSettings.logo_url || data.logo_url,
          primary_color: activeSettings.primary_color || '#FFB800',
          secondary_color: activeSettings.secondary_color || '#F1F5F9',
          text_color: activeSettings.text_color || '#111111',
          address: activeSettings.address,
          whatsapp_number: activeSettings.phone,
          opening_hours_week: activeSettings.opening_hours_week,
          opening_hours_weekend: activeSettings.opening_hours_weekend,
          opening_hours_sunday: activeSettings.opening_hours_sunday,
          is_open: activeSettings.is_open ?? true
        };

        setStore(mergedStore);

        // Aplicação das variáveis CSS Dinâmicas
        const root = document.documentElement;
        root.style.setProperty('--primary', mergedStore.primary_color);
        root.style.setProperty('--secondary', mergedStore.secondary_color);
        root.style.setProperty('--primary-foreground', mergedStore.text_color);
        root.style.setProperty('--header-bg', mergedStore.primary_color);
        root.style.setProperty('--header-foreground', mergedStore.text_color);
        root.style.setProperty('--price-color', mergedStore.primary_color);
        root.style.setProperty('--accent', mergedStore.primary_color);
        root.style.setProperty('--ring', mergedStore.primary_color);

      } catch (err) {
        console.error("Erro ao carregar dados da loja:", err);
        setStore(null);
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
  if (!context) throw new Error('useStore deve ser usado dentro de um StoreProvider');
  return context;
}