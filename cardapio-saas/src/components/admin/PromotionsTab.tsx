'use client';

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Pencil, Trash2, Loader2, Megaphone, Search, Ticket, LayoutDashboard } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { PromotionForm } from "./PromotionForm";
import { CouponForm } from "./CouponForm";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase/client";
import { useStore } from "@/contexts/StoreContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// ✅ IMPORTAÇÃO DOS TIPOS GLOBAIS
import { Promotion, Coupon } from "@/types";

export const PromotionsTab = () => {
  const { toast } = useToast();
  const { store, isLoading: isStoreLoading } = useStore();

  // Estados Comuns
  const [activeTab, setActiveTab] = useState("banners");
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Estados Banners
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [showPromoForm, setShowPromoForm] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState<Promotion | null>(null);
  const [deletingPromo, setDeletingPromo] = useState<Promotion | null>(null);

  // Estados Cupons
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [showCouponForm, setShowCouponForm] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null); // ✅ Estado de edição de Cupom

  const loadData = async () => {
    if (!store?.id) return;
    setIsLoading(true);
    try {
      if (activeTab === "banners") {
        const { data } = await supabase
          .from('promotions')
          .select('*')
          .eq('store_id', store.id)
          .order('sort_order', { ascending: true });
        setPromotions((data as Promotion[]) || []);
      } else {
        const { data } = await (supabase.from('coupons' as any) as any)
          .select('*')
          .eq('store_id', store.id)
          .order('created_at', { ascending: false });
        setCoupons((data as Coupon[]) || []);
      }
    } catch (err) {
      toast({ title: "Erro ao carregar dados", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isStoreLoading && store?.id) loadData();
  }, [store?.id, isStoreLoading, activeTab]);

  const filteredPromotions = promotions.filter(p => p.title.toLowerCase().includes(searchTerm.toLowerCase()));
  const filteredCoupons = coupons.filter(c => c.code.toLowerCase().includes(searchTerm.toLowerCase()));

  const handleDeletePromo = async (id: string) => {
    if (!store?.id) return;
    try {
      await supabase.from('promotions').delete().eq('id', id);
      toast({ title: "Banner removido!" });
      setDeletingPromo(null);
      loadData();
    } catch (error) {
      toast({ title: "Erro ao excluir", variant: "destructive" });
    }
  };

  const handleDeleteCoupon = async (id: string) => {
    if (!store?.id) return;
    try {
      await (supabase.from('coupons' as any) as any).delete().eq('id', id);
      toast({ title: "Cupom removido!" });
      loadData();
    } catch (error) {
      toast({ title: "Erro ao excluir cupom", variant: "destructive" });
    }
  };

  if (isStoreLoading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary" /></div>;

  return (
    <div className="space-y-4 animate-in fade-in duration-500">
      <Tabs defaultValue="banners" onValueChange={setActiveTab} className="w-full">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <TabsList className="bg-muted/50 p-1 rounded-xl">
            <TabsTrigger value="banners" className="gap-2 font-bold uppercase text-[10px] data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <LayoutDashboard className="w-4 h-4" /> Banners
            </TabsTrigger>
            <TabsTrigger value="coupons" className="gap-2 font-bold uppercase text-[10px] data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Ticket className="w-4 h-4" /> Cupons de Desconto
            </TabsTrigger>
          </TabsList>

          <Button
            onClick={() => {
              if (activeTab === "banners") {
                setEditingPromotion(null);
                setShowPromoForm(true);
              } else {
                setEditingCoupon(null); // ✅ Limpa a edição ao clicar em Novo
                setShowCouponForm(true);
              }
            }}
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase text-[10px] tracking-widest px-6 h-11 rounded-2xl shadow-lg active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4 mr-2" />
            Novo {activeTab === "banners" ? "Banner" : "Cupom"}
          </Button>
        </div>

        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder={`Buscar ${activeTab === "banners" ? "banner" : "cupom"}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-card border-border text-foreground rounded-xl h-11"
          />
        </div>

        <TabsContent value="banners" className="mt-0">
          {isLoading ? (
            <div className="flex justify-center py-10"><Loader2 className="animate-spin text-primary" /></div>
          ) : (
            <div className="grid gap-3">
              {filteredPromotions.length === 0 ? (
                <div className="text-center py-20 border-2 border-dashed rounded-3xl border-border opacity-40">
                  <Megaphone className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
                  <p className="font-bold">Nenhum banner cadastrado.</p>
                </div>
              ) : (
                filteredPromotions.map((promo) => (
                  <Card key={promo.id} className="overflow-hidden border-border bg-card hover:border-primary/40 transition-colors shadow-sm">
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className="w-20 h-12 bg-muted rounded-lg border border-border overflow-hidden shrink-0">
                        {promo.image_url ? (
                          <img src={promo.image_url} className="w-full h-full object-cover" alt={promo.title} />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center"><Megaphone className="w-4 h-4 text-muted-foreground/30" /></div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-sm truncate text-foreground">{promo.title}</h3>
                        <Badge variant={promo.is_active ? "default" : "secondary"} className={`text-[8px] font-black ${promo.is_active ? 'bg-primary' : ''}`}>
                          {promo.is_active ? "ATIVO" : "INATIVO"}
                        </Badge>
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-9 w-9 text-primary hover:bg-primary/10" onClick={() => { setEditingPromotion(promo); setShowPromoForm(true); }}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-9 w-9 text-destructive hover:bg-destructive/10" onClick={() => setDeletingPromo(promo)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="coupons" className="mt-0">
          {isLoading ? (
            <div className="flex justify-center py-10"><Loader2 className="animate-spin text-primary" /></div>
          ) : (
            <div className="grid gap-3">
              {filteredCoupons.length === 0 ? (
                <div className="text-center py-20 border-2 border-dashed rounded-3xl border-border opacity-40">
                  <Ticket className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
                  <p className="font-bold">Crie seu primeiro cupom de desconto!</p>
                </div>
              ) : (
                filteredCoupons.map((coupon) => (
                  <Card key={coupon.id} className="border-border bg-card hover:border-primary/40 transition-colors shadow-sm">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                          <Ticket className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="font-black text-primary tracking-tighter text-lg">{coupon.code}</p>
                          <p className="text-[10px] text-muted-foreground uppercase font-bold">
                            {coupon.type === 'percentage' ? `${coupon.value}% OFF` : `R$ ${coupon.value.toFixed(2).replace('.', ',')} OFF`}
                            {coupon.min_purchase > 0 && ` • Mín: R$ ${coupon.min_purchase.toFixed(2).replace('.', ',')}`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={coupon.is_active ? "bg-green-500 hover:bg-green-600 text-white font-black text-[9px]" : "bg-muted text-muted-foreground font-black text-[9px]"}>
                          {coupon.is_active ? "ATIVO" : "PAUSADO"}
                        </Badge>
                        {/* ✅ ADICIONADO BOTÃO DE EDITAR AQUI */}
                        <Button variant="ghost" size="icon" className="h-9 w-9 text-primary hover:bg-primary/10" onClick={() => { setEditingCoupon(coupon); setShowCouponForm(true); }}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-9 w-9 text-destructive hover:bg-destructive/10" onClick={() => handleDeleteCoupon(coupon.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* MODAL BANNERS */}
      {showPromoForm && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card rounded-3xl w-full max-w-lg shadow-2xl border border-border max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
            <PromotionForm
              promotion={editingPromotion}
              onClose={() => {
                setShowPromoForm(false);
                setEditingPromotion(null);
                loadData();
              }}
            />
          </div>
        </div>
      )}

      {/* MODAL CUPONS */}
      {showCouponForm && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card rounded-3xl w-full max-w-lg shadow-2xl border border-border animate-in zoom-in-95 duration-200 overflow-hidden">
            <CouponForm
              initialData={editingCoupon} // ✅ PASSANDO OS DADOS PARA EDIÇÃO
              onClose={() => {
                setShowCouponForm(false);
                setEditingCoupon(null); // ✅ LIMPA APÓS FECHAR
                loadData();
              }}
            />
          </div>
        </div>
      )}

      {/* MODAL DELETAR BANNER */}
      {deletingPromo && (
        <div className="fixed inset-0 z-[110] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card rounded-2xl p-6 w-full max-w-sm border border-border shadow-2xl animate-in fade-in duration-200">
            <h3 className="text-lg font-bold mb-4 text-foreground">Excluir banner?</h3>
            <div className="flex gap-3">
              <Button variant="ghost" className="flex-1 font-bold text-foreground" onClick={() => setDeletingPromo(null)}>Cancelar</Button>
              <Button variant="destructive" className="flex-1 font-bold shadow-lg" onClick={() => handleDeletePromo(deletingPromo.id)}>Excluir</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};