"use client";

import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { useStore } from "@/contexts/StoreContext";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";

// ✅ Importando a interface global que arrumamos na fase do Admin
import { Promotion } from "@/types";

interface BannerCarouselProps {
  promotions: Promotion[];
}

export const BannerCarousel = ({ promotions }: BannerCarouselProps) => {
  const router = useRouter();
  const { store } = useStore();

  if (!store || !promotions || promotions.length === 0) {
    return (
      <div className="px-4 py-2">
        <Card className="bg-primary/5 border-dashed border-primary/20">
          <CardContent className="flex items-center justify-center h-32 text-muted-foreground text-sm text-center font-medium">
            Novidades em breve! 🎭 <br /> Fique de olho em nossas ofertas.
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full px-4 py-2 animate-in fade-in duration-500">
      <Carousel
        opts={{
          align: "start",
          loop: true,
        }}
        className="w-full"
      >
        <CarouselContent>
          {promotions.map((promo) => (
            <CarouselItem key={promo.id}>
              <Card
                onClick={() => router.push(`/${store.slug}/promotion/${promo.id}`)}
                className="overflow-hidden border-none cursor-pointer hover:brightness-95 transition-all active:scale-[0.98] relative h-44"
              >
                <CardContent className="p-0 h-full">
                  {/* Imagem de Fundo Total */}
                  {promo.image_url && (
                    <img
                      src={promo.image_url}
                      alt={promo.title}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  )}

                  {/* Overlay Seguro para o Texto */}
                  <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/30 to-transparent p-6 flex flex-col justify-center">
                    <h3 className="text-xl font-black text-white uppercase tracking-tighter leading-none mb-2 drop-shadow-md">
                      {promo.title}
                    </h3>
                    {promo.description && (
                      <p className="text-xs font-bold text-white/90 line-clamp-2 max-w-[60%] drop-shadow-sm">
                        {promo.description}
                      </p>
                    )}
                    <div className="mt-4">
                      <span className="text-[10px] bg-yellow-400 text-black px-3 py-1.5 rounded-full font-black uppercase shadow-lg">
                        Ver Ofertas
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
    </div>
  );
};