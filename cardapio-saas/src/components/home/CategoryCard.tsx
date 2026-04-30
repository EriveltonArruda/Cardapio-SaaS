"use client";

import { useRouter } from "next/navigation";
import { Tag } from "lucide-react";
import { useStore } from "@/contexts/StoreContext";

interface Category {
  id: string;
  name: string;
  slug: string;
  icon?: string | null;
  has_promotion?: boolean; // Nova propriedade para detectar promoções
}

interface CategoryCardProps {
  category: Category;
}

export function CategoryCard({ category }: CategoryCardProps) {
  const router = useRouter();
  const { store } = useStore();

  return (
    <button
      onClick={() => store?.slug && router.push(`/${store.slug}/categoria/${category.slug}`)}
      className="relative aspect-square w-full rounded-xl overflow-hidden shadow-lg transition-transform active:scale-95 group"
    >
      {/* Selinho de Oferta (Canto Superior Direito) */}
      {category.has_promotion && (
        <div className="absolute top-2 right-2 z-10 bg-red-600 text-white px-2 py-1 rounded-lg flex items-center gap-1 shadow-md animate-pulse">
          <Tag className="w-2.5 h-2.5 fill-white" />
          <span className="text-[14px] font-black uppercase tracking-tighter">OFERTA</span>
        </div>
      )}

      {/* Imagem de Fundo vinda do Supabase */}
      <img
        src={category.icon || "/placeholder.svg"}
        alt={category.name}
        className="w-full h-full object-cover transition-transform group-hover:scale-110"
      />

      {/* Tarja Preta com Nome (Padrão Expresso Bebidas) */}
      <div className="absolute bottom-0 left-0 right-0 bg-black/90 py-3 px-2">
        <span className="text-white text-[10px] font-black uppercase tracking-widest block text-center">
          {category.name}
        </span>
      </div>
    </button>
  );
}