'use client';

import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Pencil, Trash2, Loader2, Image as ImageIcon, Megaphone, Search, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { PromotionForm } from "./PromotionForm";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase/client";
import { useStore } from "@/contexts/StoreContext";

interface Promotion {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  is_active: boolean;
  sort_order: number;
}

export const PromotionsTab = () => {
  const { session } = useAuth();
  const { toast } = useToast();

  const [showForm, setShowForm] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState<Promotion | null>(null);
  const [deletingPromo, setDeletingPromo] = useState<Promotion | null>(null);

  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);

  // ESTRATÉGIA N2: Estado para busca reativa
  const [searchTerm, setSearchTerm] = useState("");
  const { store } = useStore();

  const loadPromotions = async () => {
    try {
      setIsLoading(true);
      if (!store?.id) return;
      
      const response = await supabase
        .from('promotions')
        .select('*')
        .eq('store_id', store.id)
        .order('sort_order', { ascending: true });

      if (response.error) throw new Error("Erro ao acessar banners");
      setPromotions(response.data || []);
    } catch (err: any) {
      toast({ title: "Erro ao carregar", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { loadPromotions(); }, [store?.id]);

  // Filtro de banners (useMemo evita re-processamento desnecessário)
  const filteredPromotions = useMemo(() => {
    return promotions.filter((promo) =>
      promo.title.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [promotions, searchTerm]);

  const handleDelete = async (id: string) => {
    setIsDeleting(true);
    try {
      // 1. BUSCAR PRODUTOS VINCULADOS
      const prodRes = await supabase
        .from('products')
        .select('id,name,original_price,price')
        .eq('promotion_id', id)
        .eq('store_id', store?.id);
        
      const linkedProducts = prodRes.data || [];

      // 2. REVERTER PREÇOS DOS PRODUTOS
      for (const p of linkedProducts) {
        const priceToRestore = p.original_price || p.price;

        await supabase
          .from('products')
          .update({
            price: priceToRestore,
            original_price: null,
            promotion_id: null
          })
          .eq('id', p.id)
          .eq('store_id', store?.id);
      }

      // 3. EXCLUIR O BANNER
      const response = await supabase
        .from('promotions')
        .delete()
        .eq('id', id)
        .eq('store_id', store?.id);

      if (response.error) throw new Error("Erro ao excluir banner");

      toast({
        title: "Banner removido!",
        description: `${linkedProducts.length} produtos retornaram aos preços originais.`
      });

      setDeletingPromo(null);
      loadPromotions();
    } catch (error) {
      console.error("Erro na exclusão:", error);
      toast({ title: "Erro ao excluir", variant: "destructive" });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold tracking-tight">
          Banners de Promoção <span className="text-muted-foreground font-normal text-sm">({filteredPromotions.length})</span>
        </h2>
        <Button
          onClick={() => { setEditingPromotion(null); setShowForm(true); }}
          className="bg-primary hover:bg-primary/90"
        >
          <Plus className="w-4 h-4 mr-2" /> Nova Promoção
        </Button>
      </div>

      {/* BARRA DE PESQUISA */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar banner pelo título..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9 pr-9"
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-xs font-mono uppercase">Carregando banners...</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredPromotions.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed rounded-xl text-muted-foreground/40">
              <Megaphone className="w-8 h-8 mx-auto mb-2 opacity-20" />
              <p>{searchTerm ? "Nenhum banner encontrado para esta busca." : "Nenhum banner ativo."}</p>
            </div>
          ) : (
            filteredPromotions.map((promo) => (
              <Card key={promo.id} className="hover:border-primary/40 transition-colors shadow-sm overflow-hidden">
                <CardContent className="py-3 px-4 flex items-center gap-4">
                  <div className="w-20 h-12 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 overflow-hidden border">
                    {promo.image_url ? (
                      <img src={promo.image_url} className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon className="text-muted-foreground/40 w-5 h-5" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h3 className="font-bold truncate text-sm">{promo.title}</h3>
                      <Badge className={promo.is_active ? "bg-green-500 text-[9px] h-4" : "bg-slate-400 text-[9px] h-4"}>
                        {promo.is_active ? "ATIVO" : "OFF"}
                      </Badge>
                    </div>
                    <p className="text-[11px] text-muted-foreground line-clamp-1">
                      {promo.description || "Sem descrição adicional"}
                    </p>
                  </div>

                  <div className="flex gap-1 ml-auto">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditingPromotion(promo); setShowForm(true); }}>
                      <Pencil className="w-4 h-4 text-primary" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setDeletingPromo(promo)}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {/* MODAL FORMULÁRIO */}
      {showForm && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-background rounded-2xl w-full max-w-lg shadow-2xl border max-h-[90vh] overflow-y-auto">
            <PromotionForm
              promotion={editingPromotion}
              onClose={() => {
                setShowForm(false);
                setEditingPromotion(null);
                loadPromotions();
              }}
            />
          </div>
        </div>
      )}

      {/* MODAL EXCLUSÃO */}
      {deletingPromo && (
        <div className="fixed inset-0 z-[110] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-background rounded-xl p-6 w-full max-w-sm border shadow-2xl">
            <h3 className="text-lg font-bold mb-2">Excluir banner?</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Tem certeza que deseja apagar <strong>"{deletingPromo.title}"</strong>? Ele deixará de aparecer no topo do cardápio.
            </p>
            <div className="flex gap-3">
              <Button variant="ghost" className="flex-1 font-bold" onClick={() => setDeletingPromo(null)}>Cancelar</Button>
              <Button variant="destructive" className="flex-1 font-bold" onClick={() => handleDelete(deletingPromo.id)} disabled={isDeleting}>
                {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Sim, Excluir"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};