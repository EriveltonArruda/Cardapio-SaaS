'use client';

import { useState, useEffect, useRef, useMemo } from "react"; // Adicionei useMemo
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Save, X, Upload, Search } from "lucide-react"; // Adicionei Search
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase/client";
import { useStore } from "@/contexts/StoreContext";

export function PromotionForm({ promotion, onClose }: { promotion: any, onClose: () => void }) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState(promotion?.title || "");
  const [description, setDescription] = useState(promotion?.description || "");
  const [imageUrl, setImageUrl] = useState(promotion?.image_url || "");
  const [products, setProducts] = useState<any[]>([]);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [promoPrices, setPromoPrices] = useState<Record<string, string>>({});

  // ESTRATÉGIA N2: Estado para busca interna de produtos
  const [searchTerm, setSearchTerm] = useState("");

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const { store } = useStore();

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        if (!store?.id) return;
        
        const res = await supabase
          .from('products')
          .select('*')
          .eq('store_id', store.id)
          .order('name', { ascending: true });
          
        const allProducts = res.data || [];
        setProducts(allProducts);

        if (promotion) {
          const linkedProducts = allProducts.filter((p: any) => p.promotion_id === promotion.id);
          setSelectedProductIds(linkedProducts.map((p: any) => p.id));
          const prices: Record<string, string> = {};
          linkedProducts.forEach((p: any) => {
            prices[p.id] = p.price.toFixed(2);
          });
          setPromoPrices(prices);
        }
      } catch (error) { console.error(error); }
      finally { setIsLoading(false); }
    }
    loadData();
  }, [promotion, store?.id]);

  // FILTRAGEM PERFORMANCE: Filtra os 300+ produtos em tempo real
  const filteredProducts = useMemo(() => {
    return products.filter(product =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [products, searchTerm]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}.${fileExt}`;
      
      const { error } = await supabase.storage
        .from('promotions')
        .upload(fileName, file);

      if (error) throw new Error("Falha no upload");

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
    if (!title.trim() || !imageUrl) {
      toast({ title: "Título e Imagem são obrigatórios", variant: "destructive" });
      return;
    }

    setIsSaving(true);
    try {
      const isEdit = !!promotion;
      const payload = { store_id: store?.id, title, description, image_url: imageUrl, is_active: true };

      let promoId;

      if (isEdit) {
        await supabase
          .from('promotions')
          .update(payload)
          .eq('id', promotion.id)
          .eq('store_id', store?.id);
        promoId = promotion.id;
      } else {
        const insertRes = await supabase
          .from('promotions')
          .insert(payload)
          .select();
        promoId = insertRes.data?.[0]?.id;
      }

      for (const id of selectedProductIds) {
        const product = products.find(p => p.id === id);
        const currentPrice = Number(product.price);
        const currentOriginal = product.original_price ? Number(product.original_price) : null;
        const priceToBackup = (currentOriginal && currentOriginal > currentPrice)
          ? currentOriginal
          : currentPrice;

        await supabase
          .from('products')
          .update({
            price: parseFloat(promoPrices[id] || "0"),
            original_price: priceToBackup,
            promotion_id: promoId
          })
          .eq('id', id)
          .eq('store_id', store?.id);
      }

      if (isEdit) {
        const removedProducts = products.filter(p => p.promotion_id === promoId && !selectedProductIds.includes(p.id));
        for (const p of removedProducts) {
          await supabase
            .from('products')
            .update({
              price: p.original_price || p.price,
              original_price: null,
              promotion_id: null
            })
            .eq('id', p.id)
            .eq('store_id', store?.id);
        }
      }

      toast({ title: "Vitrine Atualizada!" });
      onClose();
    } catch (err) {
      console.error(err);
      toast({ title: "Erro ao salvar", variant: "destructive" });
    }
    finally { setIsSaving(false); }
  };

  return (
    <div className="p-5 space-y-5 max-h-[90vh] overflow-y-auto scrollbar-hide">
      <div className="flex justify-between items-center border-b pb-3">
        <h3 className="font-black uppercase tracking-tighter text-xl text-primary leading-none">Configurar Vitrine</h3>
        <Button variant="ghost" size="icon" className="h-9 w-9" onClick={onClose}><X className="w-5 h-5" /></Button>
      </div>

      <div className="space-y-4">
        {/* Banner */}
        <div className="space-y-1.5">
          <Label className="uppercase text-[11px] font-black text-slate-500">Imagem do Banner</Label>
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed rounded-2xl p-2 h-36 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 transition-all relative overflow-hidden bg-slate-50/50"
          >
            {imageUrl ? (
              <>
                <img src={imageUrl} className="absolute inset-0 w-full h-full object-cover" alt="Banner preview" />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                  <span className="text-white font-bold text-xs uppercase">Trocar</span>
                </div>
              </>
            ) : (
              <div className="text-center text-slate-400">
                {isUploading ? <Loader2 className="animate-spin w-8 h-8 mx-auto" /> : <Upload className="w-8 h-8 mx-auto mb-1 opacity-50" />}
                <span className="text-[11px] font-bold uppercase">Upload Banner</span>
              </div>
            )}
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
          </div>
        </div>

        <div className="space-y-3">
          <div className="space-y-1">
            <Label className="uppercase text-[11px] font-black text-slate-500">Título</Label>
            <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Título da oferta" className="h-10 text-sm font-bold rounded-xl" />
          </div>

          <div className="space-y-1">
            <Label className="uppercase text-[11px] font-black text-slate-500">Descrição</Label>
            <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Descrição curta..." className="h-20 text-sm rounded-xl resize-none" />
          </div>
        </div>

        {/* BUSCA E LISTA DE PRODUTOS */}
        <div className="border rounded-2xl p-3 bg-slate-50 space-y-3">
          <div className="flex flex-col gap-2">
            <Label className="uppercase text-[11px] font-black text-primary text-center block leading-none">Produtos & Preços</Label>

            {/* INPUT DE BUSCA ESTRATÉGICO */}
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input
                placeholder="Filtrar por nome..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-8 pl-8 text-xs bg-white rounded-lg border-primary/10"
              />
            </div>
          </div>

          <ScrollArea className="h-48 pr-2">
            <div className="space-y-2">
              {isLoading ? (
                <div className="flex justify-center py-10"><Loader2 className="animate-spin w-5 h-5 text-primary" /></div>
              ) : filteredProducts.length > 0 ? (
                filteredProducts.map(product => {
                  const isSelected = selectedProductIds.includes(product.id);
                  return (
                    <div key={product.id} className={`p-2.5 rounded-xl border transition-all ${isSelected ? 'bg-white border-primary shadow-sm' : 'bg-slate-100/50 opacity-60'}`}>
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={(checked: boolean) => {
                              if (checked) {
                                setSelectedProductIds(prev => [...prev, product.id]);
                                setPromoPrices(prev => ({ ...prev, [product.id]: product.price.toFixed(2) }));
                              } else {
                                setSelectedProductIds(prev => prev.filter(id => id !== product.id));
                              }
                            }}
                          />
                          <div className="min-w-0">
                            <p className="text-xs font-bold truncate leading-tight">{product.name}</p>
                            <p className="text-[10px] text-muted-foreground italic">Atual: R$ {product.price.toFixed(2)}</p>
                          </div>
                        </div>

                        {isSelected && (
                          <div className="relative w-[72px] shrink-0">
                            <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-[9px] font-black text-black">R$</span>
                            <Input
                              type="text"
                              value={promoPrices[product.id] || ""}
                              onChange={e => {
                                const val = e.target.value.replace(",", ".");
                                setPromoPrices(p => ({ ...p, [product.id]: val }));
                              }}
                              className="h-8 pl-6 pr-1.5 text-[11px] font-bold border-primary/30 text-black text-right rounded-lg focus-visible:ring-1"
                              placeholder="0.00"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-10 text-[10px] text-muted-foreground uppercase font-bold">Nenhum produto encontrado</div>
              )}
            </div>
          </ScrollArea>
        </div>

        <Button
          className="w-full h-11 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg active:scale-95 transition-all"
          onClick={handleSave}
          disabled={isSaving || isUploading}
        >
          {isSaving ? <Loader2 className="animate-spin mr-2 w-4 h-4" /> : <Save className="mr-2 w-4 h-4" />}
          Salvar Vitrine
        </Button>
      </div>
    </div>
  );
}