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
    <header className="sticky top-0 z-50 header-gradient text-header-foreground safe-area-top bg-yellow-500">
      <div className="container flex items-center justify-between py-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-lg font-bold">
            {store?.logo_url ? (
               <img src={store.logo_url} alt={store.name} className="w-10 h-10 object-contain rounded-full" />
            ) : (
               <span className="truncate">{store?.name?.charAt(0) || "L"}</span>
            )}
           
          </div>
          <div>
            <h1 className="text-lg font-bold leading-tight">{store?.name || "Carregando..."}</h1>
          </div>
        </div>
        <button
          onClick={handleShare}
          className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
          aria-label="Compartilhar"
        >
          <Share2 className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
}