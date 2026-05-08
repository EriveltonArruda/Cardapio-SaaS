'use client';

import { Share2, Moon, Sun } from "lucide-react";
import { useStore } from "@/contexts/StoreContext";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function Header() {
  const { store } = useStore();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Evita erro de hidratação do Next.js
  useEffect(() => setMounted(true), []);

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
    <header
      className="sticky top-0 z-50 text-white safe-area-top shadow-md transition-colors"
      style={{ backgroundColor: 'var(--primary)' }}
    >
      <div className="w-full flex items-center justify-between py-4 px-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center overflow-hidden border-2 border-white/30 shadow-sm">
            {store?.logo_url ? (
              <img src={store.logo_url} alt={store.name} className="w-full h-full object-cover" />
            ) : (
              <span className="font-black text-xl">{store?.name?.charAt(0) || "L"}</span>
            )}
          </div>

          <div>
            <h1 className="text-base font-black leading-tight uppercase tracking-tighter text-white">
              {store?.name || "Carregando..."}
            </h1>
            <p className="text-[10px] font-bold opacity-90 uppercase tracking-wide text-white">
              Gravatá - PE
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* BOTÃO DARK MODE */}
          {mounted && (
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 transition-all border border-white/10 cursor-pointer"
            >
              {theme === 'dark' ? (
                <Sun className="w-5 h-5 text-yellow-400" />
              ) : (
                <Moon className="w-5 h-5 text-white" />
              )}
            </button>
          )}

          <button
            onClick={handleShare}
            className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 transition-all border border-white/10 cursor-pointer"
          >
            <Share2 className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>
    </header>
  );
}