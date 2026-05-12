"use client";

import { formatPrice } from "@/lib/utils";
import { Snowflake, Wine, Package, Image as ImageIcon, Tag } from "lucide-react";
import { useStore } from "@/contexts/StoreContext";
import { Product } from "@/types";

interface ProductWithPromo extends Product {
  original_price?: number | null;
}

interface ProductCardProps {
  product: ProductWithPromo;
  onClick: () => void;
}

export function ProductCard({ product, onClick }: ProductCardProps) {
  const { store } = useStore();

  const price = Number(product.price);
  const originalPrice = product.original_price ? Number(product.original_price) : 0;

  const isOnSale = originalPrice > price && store?.plan_type === 'pro';
  const isAvailable = product.is_available !== false;

  return (
    <button
      onClick={isAvailable ? onClick : undefined}
      className={`cart-item-row w-full text-left transition-all px-4 -mx-4 flex items-center gap-4 py-4 border-b border-border/50 relative 
        ${!isAvailable
          ? 'opacity-50 grayscale cursor-not-allowed'
          : 'hover:bg-muted/50 cursor-pointer active:scale-[0.99]'}`}
    >
      <div className="flex-1 min-w-0">
        <h3 className="font-medium text-foreground leading-snug line-clamp-2">
          {product.name}
        </h3>

        <div className="flex flex-wrap items-center gap-1.5 mt-1">
          {!isAvailable ? (
            <span className="bg-slate-700 text-white text-[9px] font-black px-1.5 py-0.5 rounded flex items-center gap-1">
              ESGOTADO
            </span>
          ) : isOnSale && (
            <span className="bg-red-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded flex items-center gap-1 animate-pulse">
              <Tag className="w-2.5 h-2.5" /> OFERTA
            </span>
          )}

          {/* ✅ Tags Padronizadas (Iguais ao Modal) */}
          {product.is_featured && <span className="bg-amber-100 text-amber-700 text-[9px] font-black px-1.5 py-0.5 rounded border border-amber-200 uppercase">🏆 Mais Pedido</span>}
          {product.is_artisanal && <span className="bg-red-100 text-red-700 text-[9px] font-black px-1.5 py-0.5 rounded border border-red-200 uppercase">🥩 Artesanal</span>}
          {product.is_new && <span className="bg-orange-100 text-orange-700 text-[9px] font-black px-1.5 py-0.5 rounded border border-orange-200 uppercase">🚀 Lançamento</span>}
          {product.is_veggie && <span className="bg-green-100 text-green-700 text-[9px] font-black px-1.5 py-0.5 rounded border border-green-200 uppercase">🌱 Veggie</span>}
          {product.is_wood_fire && <span className="bg-stone-100 text-stone-700 text-[9px] font-black px-1.5 py-0.5 rounded border border-stone-200 uppercase">🪵🔥 Fogão a Lenha</span>}
          {product.is_suggestion && <span className="bg-purple-100 text-purple-700 text-[9px] font-black px-1.5 py-0.5 rounded border border-purple-200 uppercase">💡 Sugestão</span>}

          {/* Badges de Bebidas */}
          {product.is_cold && <span className="product-badge product-badge-cold"><Snowflake className="w-3.5 h-3.5" /></span>}
          {product.is_alcoholic && <span className="product-badge product-badge-alcoholic"><Wine className="w-3.5 h-3.5" /></span>}
          {product.has_container && <span className="product-badge product-badge-container"><Package className="w-3.5 h-3.5" /></span>}
        </div>

        {product.description && (
          <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
            {product.description}
          </p>
        )}

        <div className="flex items-baseline gap-2 mt-1.5">
          <p className="price-tag text-base font-bold text-primary">
            {formatPrice(price)}
          </p>
          {isOnSale && (
            <span className="text-[10px] text-muted-foreground line-through decoration-destructive/50">
              {formatPrice(originalPrice)}
            </span>
          )}
        </div>
      </div>

      <div className="w-20 h-20 rounded-xl bg-white shrink-0 overflow-hidden border border-border/50 flex items-center justify-center p-1 relative">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="w-full h-full object-contain"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl bg-linear-to-br from-amber-50 to-orange-50">
            <ImageIcon className="w-8 h-8 text-primary opacity-20" />
          </div>
        )}
      </div>
    </button>
  );
}