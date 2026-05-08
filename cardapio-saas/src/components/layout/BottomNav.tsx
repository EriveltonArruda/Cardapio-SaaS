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
    <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border z-40 max-w-[480px] mx-auto pb-safe">
      <nav className="flex items-center justify-around h-16">
        <Link
          href={homePath}
          className={`flex flex-col items-center justify-center w-full h-full space-y-1 cursor-pointer transition-colors ${isActive(homePath) ? "text-primary" : "text-muted-foreground hover:text-primary"
            }`}
        >
          <Home className="w-6 h-6" />
          <span className="text-[10px] font-medium">Início</span>
        </Link>

        <Link
          href={cartPath}
          className={`relative flex flex-col items-center justify-center w-full h-full space-y-1 cursor-pointer transition-colors ${isActive(cartPath) ? "text-primary" : "text-muted-foreground hover:text-primary"
            }`}
        >
          <div className="relative">
            <ShoppingBag className="w-6 h-6" />
            {totalItems > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-primary text-primary-foreground text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                {totalItems}
              </span>
            )}
          </div>
          <span className="text-[10px] font-medium">Carrinho</span>
        </Link>
      </nav>
    </div>
  );
}