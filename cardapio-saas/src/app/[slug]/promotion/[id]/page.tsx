"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Loader2, ShoppingBag, Plus, ImageIcon } from "lucide-react";
import { AppContainer } from "@/components/layout/AppContainer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useCart } from "@/contexts/CartContext";
import { formatPrice } from "@/lib/utils";
import { BottomNav } from "@/components/layout/BottomNav";
import { supabase } from '@/lib/supabase/client';
import { useStore } from "@/contexts/StoreContext";

export default function PromotionPage() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();
  const { addToCart } = useCart();
  const { store } = useStore();

  const [promo, setPromo] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchPromoData() {
      if (!store?.id || !id) return;
      try {
        const { data: promoData } = await supabase
          .from('promotions') // ✅ Agora o TS vai reconhecer
          .select('*')
          .eq('store_id', store.id)
          .eq('id', id)
          .single();

        setPromo(promoData);

        const { data: prodData } = await supabase
          .from('products')
          .select('*')
          .eq('store_id', store.id)
          .eq('promotion_id', id)
          .order('name', { ascending: true });

        setProducts(prodData || []);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchPromoData();
  }, [id, store?.id]);

  if (isLoading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin" /></div>;

  return (
    <AppContainer>
      <div className="min-h-screen bg-background pb-32">
        <div className="relative h-60 w-full overflow-hidden bg-slate-100">
          {promo?.image_url && <img src={promo.image_url} className="w-full h-full object-cover" alt="" />}
          <button onClick={() => router.back()} className="absolute top-4 left-4 p-2 bg-white/40 rounded-full"><ArrowLeft /></button>
          <div className="absolute bottom-6 left-6"><h1 className="text-2xl font-black text-white uppercase">{promo?.title}</h1></div>
        </div>
        <div className="p-4 grid grid-cols-2 gap-3">
          {products.map((product) => (
            <Card key={product.id} className="rounded-2xl">
              <CardContent className="p-3">
                <img src={product.image_url || "/placeholder.svg"} className="h-32 w-full object-contain" alt="" />
                <h3 className="font-bold text-xs mt-2">{product.name}</h3>
                <p className="text-primary font-black">{formatPrice(product.price)}</p>
                <Button onClick={() => addToCart(product, 1, [], "")} className="w-full mt-2"><Plus size={12} /> Adicionar</Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
      <BottomNav />
    </AppContainer>
  );
}