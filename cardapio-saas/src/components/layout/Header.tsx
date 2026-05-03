'use client';

import { Share2 } from "lucide-react";
import { useStore } from "@/contexts/StoreContext";

export function Header() {
  const { store } = useStore();

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: store?.name || "Cardápio Digital",
        text: "Confira nosso cardápio!",
        url: window.location.href,
      });
    }
  };

  return (
    <header className="sticky top-0 z-50 text-white safe-area-top shadow-md" style={{ backgroundColor: 'var(--primary)' }}>
      {/* py-4 e px-6 garantem o distanciamento da borda do container de 480px */}
      <div className="w-full flex items-center justify-between py-4 px-6">
        <div className="flex items-center gap-4">
          {/* Círculo da logo com borda mais visível e sombra */}
          <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center overflow-hidden border-2 border-white/30 shadow-sm">
            {store?.logo_url ? (
              <img src={store.logo_url} alt={store.name} className="w-full h-full object-cover" />
            ) : (
              <span className="font-black text-xl">{store?.name?.charAt(0) || "L"}</span>
            )}
          </div>

          <div>
            <h1 className="text-base font-black leading-tight uppercase tracking-tighter">
              {store?.name || "Carregando..."}
            </h1>
            <p className="text-[10px] font-bold opacity-90 uppercase tracking-wide">
              Gravatá - PE
            </p>
          </div>
        </div>

        <button
          onClick={handleShare}
          className="p-2.5 rounded-full bg-white/20 hover:bg-white/30 transition-all active:scale-90 border border-white/10"
          aria-label="Compartilhar"
        >
          <Share2 className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
}