"use client";

import { useRouter } from "next/navigation";
import { Tag } from "lucide-react";
import { useStore } from "@/contexts/StoreContext";

// ✅ Importação da Interface Global
import { Category } from "@/types";

// ✅ Intersecção: Informa que o componente espera o campo dinâmico de promoção
interface CategoryWithPromo extends Category {
  has_promotion?: boolean;
}

interface CategoryCardProps {
  category: CategoryWithPromo;
}

export function CategoryCard({ category }: CategoryCardProps) {
  const router = useRouter();
  const { store } = useStore();

  return (
    <button
      // ✅ Fallback seguro: se não tiver slug, ele não quebra a rota
      onClick={() => store?.slug && router.push(`/${store.slug}/categoria/${category.slug || category.id}`)}
      className="relative aspect-square w-full rounded-xl overflow-hidden shadow-lg transition-transform active:scale-95 group cursor-pointer border border-border bg-card"
    >
      {category.has_promotion && (
        <div className="absolute top-2 right-2 z-10 bg-red-600 text-white px-2 py-1 rounded-lg flex items-center gap-1 shadow-md animate-pulse">
          <Tag className="w-2.5 h-2.5 fill-white" />
          <span className="text-[14px] font-black uppercase tracking-tighter">OFERTA</span>
        </div>
      )}

      <img
        src={category.icon || "/placeholder.svg"}
        alt={category.name}
        className="w-full h-full object-cover transition-transform group-hover:scale-110"
      />

      {/* Rodapé com inversão de cores: definida pela classe category-card-footer no globals.css */}
      <div className="absolute bottom-0 left-0 right-0 category-card-footer py-3 px-2 transition-all duration-300">
        <span className="text-[10px] font-black uppercase tracking-widest block text-center">
          {category.name}
        </span>
      </div>
    </button>
  );
}