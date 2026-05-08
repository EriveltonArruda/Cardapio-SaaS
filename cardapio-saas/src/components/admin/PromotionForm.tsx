'use client';

import { useState, useEffect, useRef, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Save, X, Upload, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase/client";
import { useStore } from "@/contexts/StoreContext";
import { Promotion, Product } from "@/types";

interface PromotionFormProps {
  promotion: Promotion | null;
  onClose: () => void;
}

export function PromotionForm({ promotion, onClose }: PromotionFormProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { store } = useStore();

  const [title, setTitle] = useState(promotion?.title || "");
  const [description, setDescription] = useState(promotion?.description || "");
  const [imageUrl, setImageUrl] = useState(promotion?.image_url || "");
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [promoPrices, setPromoPrices] = useState<Record<string, string>>({});

  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    async function loadData() {
      if (!store?.id) return;
      setIsLoading(true);
      try {
        // ✅ Busca todos os produtos da loja
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('store_id', store.id)
          .order('name', { ascending: true });

        if (error) throw error;

        // ✅ Cast para any para contornar campos extras como promotion_id
        const allProducts = (data as any[]) || [];
        setProducts(allProducts);

        if (promotion) {
          const linkedProducts = allProducts.filter((p: any) => p.promotion_id === promotion.id);
          setSelectedProductIds(linkedProducts.map((p: any) => p.id));

          const prices: Record<string, string> = {};
          linkedProducts.forEach((p: any) => {
            prices[p.id] = Number(p.price).toFixed(2);
          });
          setPromoPrices(prices);
        }
      } catch (error) {
        console.error("Erro ao carregar dados da vitrine:", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [promotion, store?.id]);

  const filteredProducts = useMemo(() => {
    return products.filter(product =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [products, searchTerm]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !store?.slug) return;

    setIsUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${store.slug}/promo-${Date.now()}.${fileExt}`;

      const { error } = await supabase.storage
        .from('promotions')
        .upload(fileName, file, { upsert: true });

      if (error) throw error;

      const { data: publicUrlData } = supabase.storage
        .from('promotions')
        .getPublicUrl(fileName);

      setImageUrl(publicUrlData.publicUrl);
      toast({ title: "Banner carregado!" });
    } catch (error) {
      toast({ title: "Erro no upload", variant: "destructive" });
    } finally { setIsUploading(false); }
  };

  const handleSave = async () => {
    if (!store?.id) return;

    if (!title.trim() || !imageUrl) {
      toast({ title: "Título e Imagem são obrigatórios", variant: "destructive" });
      return;
    }

    setIsSaving(true);
    try {
      const isEdit = !!promotion;
      const payload = {
        store_id: store.id,
        title,
        description: description.trim() || null,
        image_url: imageUrl,
        is_active: true
      };

      let promoId: string | undefined;

      if (isEdit && promotion) {
        await supabase
          .from('promotions')
          .update(payload)
          .eq('id', promotion.id)
          .eq('store_id', store.id);
        promoId = promotion.id;
      } else {
        const { data, error } = await supabase
          .from('promotions')
          .insert([payload])
          .select()
          .single();
        if (error) throw error;
        promoId = data.id;
      }

      if (!promoId) throw new Error("Falha ao gerar ID da promoção");

      // 1. Atualizar produtos SELECIONADOS (Aplica Preço Promocional)
      for (const id of selectedProductIds) {
        const product = products.find(p => p.id === id);
        if (!product) continue;

        const currentPrice = Number(product.price);
        const currentOriginal = (product as any).original_price ? Number((product as any).original_price) : null;

        const priceToBackup = (currentOriginal && currentOriginal > currentPrice)
          ? currentOriginal
          : currentPrice;

        // ✅ Cast para any no update de produtos para salvar o promotion_id
        await (supabase.from('products') as any)
          .update({
            price: parseFloat(promoPrices[id] || "0"),
            original_price: priceToBackup,
            promotion_id: promoId
          })
          .eq('id', id)
          .eq('store_id', store.id);
      }

      // 2. Restaurar produtos DESELECIONADOS (Volta Preço Original)
      if (isEdit) {
        const removedProducts = products.filter(p => (p as any).promotion_id === promoId && !selectedProductIds.includes(p.id));
        for (const p of removedProducts) {
          await (supabase.from('products') as any)
            .update({
              price: (p as any).original_price || p.price,
              original_price: null,
              promotion_id: null
            })
            .eq('id', p.id)
            .eq('store_id', store.id);
        }
      }

      toast({ title: "Vitrine Atualizada! 🚀" });
      onClose();
    } catch (err) {
      console.error(err);
      toast({ title: "Erro ao salvar", variant: "destructive" });
    } finally { setIsSaving(false); }
  };

  return (
    <div className="p-6 space-y-6 bg-card text-foreground transition-colors">
      <div className="flex justify-between items-center border-b border-border pb-4">
        <h3 className="font-black uppercase tracking-tighter text-xl text-primary">Configurar Vitrine</h3>
        <Button variant="ghost" size="icon" className="rounded-full hover:bg-muted" onClick={onClose}><X className="w-5 h-5" /></Button>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label className="uppercase text-[10px] font-black text-muted-foreground tracking-widest">Banner da Promoção *</Label>
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-border rounded-2xl p-2 h-40 flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 transition-all relative overflow-hidden bg-muted/30"
          >
            {imageUrl ? (
              <>
                <img src={imageUrl} className="absolute inset-0 w-full h-full object-cover" alt="Preview" />
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                  <span className="text-white font-bold text-xs uppercase">Trocar Imagem</span>
                </div>
              </>
            ) : (
              <div className="text-center text-muted-foreground">
                {isUploading ? <Loader2 className="animate-spin w-8 h-8 mx-auto" /> : <Upload className="w-8 h-8 mx-auto mb-2 opacity-30" />}
                <span className="text-[10px] font-bold uppercase tracking-widest">Upload Banner (800x400)</span>
              </div>
            )}
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label className="uppercase text-[10px] font-black text-muted-foreground">Título em Destaque *</Label>
            <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Ex: Festival da Pizza" className="h-12 font-bold rounded-xl bg-background border-border text-foreground" />
          </div>

          <div className="space-y-1.5">
            <Label className="uppercase text-[10px] font-black text-muted-foreground">Chamada (Opcional)</Label>
            <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Ex: Aproveite nossos preços exclusivos por tempo limitado!" className="h-20 text-sm rounded-xl resize-none bg-background border-border text-foreground" />
          </div>
        </div>

        <div className="border border-border rounded-2xl p-4 bg-muted/20 space-y-4">
          <div className="flex items-center justify-between gap-4">
            <Label className="uppercase text-[10px] font-black text-primary tracking-widest">Vincular Produtos</Label>
            <div className="relative flex-1 max-w-[200px]">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input
                placeholder="Filtrar..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-8 pl-8 text-xs bg-background rounded-lg border-border text-foreground"
              />
            </div>
          </div>

          <ScrollArea className="h-52 pr-4">
            <div className="space-y-2">
              {isLoading ? (
                <div className="flex justify-center py-10"><Loader2 className="animate-spin w-6 h-6 text-primary" /></div>
              ) : filteredProducts.length > 0 ? (
                filteredProducts.map(product => {
                  const isSelected = selectedProductIds.includes(product.id);
                  return (
                    <div key={product.id} className={`p-3 rounded-xl border transition-all ${isSelected ? 'bg-background border-primary shadow-sm' : 'bg-background/40 border-transparent opacity-70 hover:opacity-100'}`}>
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={(checked: boolean) => {
                              if (checked) {
                                setSelectedProductIds(prev => [...prev, product.id]);
                                setPromoPrices(prev => ({ ...prev, [product.id]: Number(product.price).toFixed(2) }));
                              } else {
                                setSelectedProductIds(prev => prev.filter(id => id !== product.id));
                              }
                            }}
                            className="border-border data-[state=checked]:bg-primary"
                          />
                          <div className="min-w-0">
                            <p className="text-xs font-bold truncate text-foreground">{product.name}</p>
                            <p className="text-[10px] text-muted-foreground font-medium">Original: R$ {Number(product.price).toFixed(2).replace('.', ',')}</p>
                          </div>
                        </div>

                        {isSelected && (
                          <div className="relative w-24 shrink-0">
                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] font-black text-primary">R$</span>
                            <Input
                              type="text"
                              value={promoPrices[product.id] || ""}
                              onChange={e => {
                                const val = e.target.value.replace(",", ".");
                                setPromoPrices(p => ({ ...p, [product.id]: val }));
                              }}
                              className="h-9 pl-7 pr-2 text-xs font-bold border-primary/30 rounded-lg text-right focus-visible:ring-1 focus-visible:ring-primary bg-background text-foreground"
                              placeholder="0,00"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-10 text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Nenhum produto encontrado</div>
              )}
            </div>
          </ScrollArea>
        </div>

        <Button
          className="w-full h-12 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg bg-primary text-primary-foreground hover:bg-primary/90 active:scale-95 transition-all"
          onClick={handleSave}
          disabled={isSaving || isUploading}
        >
          {isSaving ? <Loader2 className="animate-spin mr-2 w-4 h-4" /> : <Save className="mr-2 w-4 h-4" />}
          Salvar Configurações
        </Button>
      </div>
    </div>
  );
}