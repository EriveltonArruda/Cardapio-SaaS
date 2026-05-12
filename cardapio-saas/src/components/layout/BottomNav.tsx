'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, ShoppingBag } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useStore } from "@/contexts/StoreContext";

export function BottomNav() {
  const pathname = usePathname();
  const { totalItems } = useCart();
  const { store } = useStore();

  const homePath = store?.slug ? `/${store.slug}` : "/";
  const cartPath = store?.slug ? `/${store.slug}/cart` : "/cart";

  const isActive = (path: string) => pathname === path;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-md border-t border-border z-40 max-w-[480px] mx-auto pb-safe shadow-[0_-5px_15px_-10px_rgba(0,0,0,0.1)]">
      <nav className="flex items-center justify-around h-[68px]">
        <Link
          href={homePath}
          className={`flex flex-col items-center justify-center w-full h-full space-y-1 cursor-pointer transition-all active:scale-95 ${isActive(homePath) ? "text-primary" : "text-muted-foreground hover:text-primary"
            }`}
        >
          <Home className={`w-[22px] h-[22px] ${isActive(homePath) ? "stroke-[2.5px]" : "stroke-2"}`} />
          <span className="text-[10px] font-black uppercase tracking-widest">Início</span>
        </Link>

        <Link
          href={cartPath}
          className={`relative flex flex-col items-center justify-center w-full h-full space-y-1 cursor-pointer transition-all active:scale-95 ${isActive(cartPath) ? "text-primary" : "text-muted-foreground hover:text-primary"
            }`}
        >
          <div className="relative">
            <ShoppingBag className={`w-[22px] h-[22px] ${isActive(cartPath) ? "stroke-[2.5px]" : "stroke-2"}`} />
            {totalItems > 0 && (
              <span className="absolute -top-1.5 -right-2 bg-red-500 text-white text-[9px] font-black w-[18px] h-[18px] rounded-full flex items-center justify-center shadow-sm border-2 border-background animate-in zoom-in duration-300">
                {totalItems}
              </span>
            )}
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest">Carrinho</span>
        </Link>
      </nav>
    </div>
  );
}