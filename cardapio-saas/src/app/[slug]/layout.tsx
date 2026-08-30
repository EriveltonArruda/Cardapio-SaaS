'use client';

import { useStore } from "@/contexts/StoreContext";
import { TrialExpiredScreen } from "@/components/TrialExpiredScreen";

// Envolve TODAS as rotas de uma loja (vitrine pública, carrinho, e o
// /admin inteiro) para aplicar o bloqueio de trial vencido num único lugar,
// em vez de repetir a checagem em cada página. StoreProvider já cobre o app
// inteiro (ver Providers.tsx), então useStore() funciona aqui normalmente.
export default function StoreLayout({ children }: { children: React.ReactNode }) {
  const { store, isLoading, isBlocked } = useStore();

  if (!isLoading && store && isBlocked) {
    return <TrialExpiredScreen storeName={store.name} />;
  }

  return <>{children}</>;
}
