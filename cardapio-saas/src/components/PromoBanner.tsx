"use client";

import { Card } from "@/components/ui/card";
import { useStore } from "@/contexts/StoreContext";

// ✅ Importando a interface global
import { Promotion } from "@/types";

interface PromoBannerProps {
  promotions: Promotion[];
}

export const PromoBanner = ({ promotions }: PromoBannerProps) => {
  const { store } = useStore();

  if (promotions.length === 0) return null;

  return (
    <div className="w-full overflow-x-auto flex gap-4 pb-4 no-scrollbar px-4">
      {promotions.map((promo) => (
        <Card key={promo.id} className="min-w-[300px] md:min-w-[450px] overflow-hidden bg-primary/10 border-none shrink-0 cursor-pointer hover:brightness-95 transition-all">
          <div className="flex h-32">
            <div className="flex-1 p-4 flex flex-col justify-center">
              <h3 className="font-bold text-lg text-primary leading-tight">{promo.title}</h3>
              {promo.description && (
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{promo.description}</p>
              )}
            </div>
            {promo.image_url && (
              <div className="w-1/3">
                <img
                  src={promo.image_url}
                  alt={promo.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
};