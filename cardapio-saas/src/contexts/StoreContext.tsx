'use client';

import React, { createContext, useContext, useState, useEffect, useRef, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext'; // ✅ Conectado ao seu AuthContext
import { Store } from '@/types';

interface StoreContextType {
  store: Store | null;
  isLoading: boolean;
  isOwner: boolean;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const { user, isLoading: authLoading } = useAuth(); // ✅ Pega o usuário e o loading do Auth
  const [store, setStore] = useState<Store | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const slug = params?.slug as string | undefined;
  const lastFetchedSlug = useRef<string | null>(null);

  // ✅ 1. Define se o usuário logado é o dono da loja carregada
  const isOwner = useMemo(() => {
    if (!user || !store) return false;
    // Comparação robusta para evitar problemas de tipagem UUID
    return String(store.user_id).toLowerCase() === String(user.id).toLowerCase();
  }, [user, store]);

  // 2. Gerencia o estado de loading quando o slug muda
  useMemo(() => {
    if (slug && slug !== lastFetchedSlug.current) {
      setIsLoading(true);
    }
  }, [slug]);

  useEffect(() => {
    let isMounted = true;

    async function loadStoreData() {
      if (!slug) {
        if (isMounted) {
          setStore(null);
          setIsLoading(false);
          lastFetchedSlug.current = null;
        }
        return;
      }

      if (slug === lastFetchedSlug.current && store) {
        if (isMounted) setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('stores')
          .select(`*, store_settings (*)`)
          .eq('slug', slug)
          .maybeSingle();

        if (!isMounted) return;
        if (error) throw error;

        if (!data || data.is_active === false) {
          setStore(null);
          lastFetchedSlug.current = slug;
          setIsLoading(false);
          return;
        }

        const storeRaw = data as any;
        const settingsData = storeRaw.store_settings;
        const activeSettings = Array.isArray(settingsData) ? settingsData[0] : settingsData || {};

        const mergedStore: Store = {
          id: storeRaw.id,
          user_id: storeRaw.user_id,
          slug: storeRaw.slug,
          plan_type: storeRaw.plan_type || 'starter',
          name: activeSettings.store_name || storeRaw.name,
          logo_url: activeSettings.logo_url || storeRaw.logo_url,
          primary_color: storeRaw.primary_color || activeSettings.primary_color || '#1caf08',
          secondary_color: activeSettings.secondary_color || storeRaw.secondary_color || '#F1F5F9',
          text_color: activeSettings.text_color || storeRaw.text_color || '#111111',
          is_active: storeRaw.is_active ?? true,
          is_open: activeSettings.is_open ?? true,
          address: activeSettings.address || storeRaw.address,
          whatsapp_number: activeSettings.phone,
          opening_hours_week: activeSettings.opening_hours_week,
          opening_hours_weekend: activeSettings.opening_hours_weekend,
          opening_hours_sunday: activeSettings.opening_hours_sunday,
          accept_pix: activeSettings.accept_pix ?? true,
          accept_card_credit: activeSettings.accept_card_credit ?? true,
          accept_card_debt: activeSettings.accept_card_debt ?? true,
          accept_cash: activeSettings.accept_cash ?? true,
          pix_key: activeSettings.pix_key || null
        };

        // Aplica as cores dinâmicas no CSS
        if (typeof document !== 'undefined') {
          const root = document.documentElement;
          root.style.setProperty('--primary', mergedStore.primary_color);
          root.style.setProperty('--primary-foreground', mergedStore.text_color);
        }

        setStore(mergedStore);
        lastFetchedSlug.current = slug;
      } catch (err) {
        console.error("Erro no StoreContext:", err);
        if (isMounted) setStore(null);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadStoreData();
    return () => { isMounted = false; };
  }, [slug]);

  // ✅ 3. O loading final só é falso quando AMBOS terminarem (Auth e Store)
  const combinedLoading = isLoading || authLoading;

  return (
    <StoreContext.Provider value={{ store, isLoading: combinedLoading, isOwner }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const context = useContext(StoreContext);
  if (!context) throw new Error('useStore deve ser usado dentro de um StoreProvider');
  return context;
}