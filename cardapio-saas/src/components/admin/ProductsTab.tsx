'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Pencil, Trash2, Loader2, Image as ImageIcon, Search, X, Sparkles } from "lucide-react";
import { ProductForm } from "./ProductForm";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase/client";
import { useStore } from "@/contexts/StoreContext";
import { Product } from "@/types"; // ✅ Importando do nosso novo index.ts

export const ProductsTab = () => {
  const { toast } = useToast();
  const { store, isLoading: isStoreLoading } = useStore();

  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const lastLoadedStoreId = useRef<string | null>(null);

  // ✅ LÓGICA DE LIMITE DE PLANO (100 ITENS)
  const isLimitReached = useMemo(() => {
    return store?.plan_type === 'starter' && products.length >= 100;
  }, [store?.plan_type, products.length]);

  const loadProducts = useCallback(async () => {
    if (!store?.id || isStoreLoading) return;

    if (lastLoadedStoreId.current === store.id && products.length > 0) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select('*, categories(name)')
        .eq('store_id', store.id)
        .order('name', { ascending: true });

      if (error) throw error;

      // Usamos 'as any' aqui apenas porque o retorno do Supabase com join 
      // de categorias traz um objeto extra que o tipo simples Product não prevê
      setProducts((data as any) || []);
      lastLoadedStoreId.current = store.id;
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [store?.id, isStoreLoading, products.length]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const filteredProducts = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return products.filter(product =>
      product.name.toLowerCase().includes(term) ||
      (product as any).categories?.name?.toLowerCase().includes(term)
    );
  }, [products, searchTerm]);

  const handleDelete = async (productId: string) => {
    if (!store?.id) return;

    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId)
        .eq('store_id', store.id);

      if (error) throw error;

      toast({ title: "Produto removido!" });
      setDeletingProduct(null);
      lastLoadedStoreId.current = null;
      loadProducts();
    } catch (err: any) {
      toast({ title: "Erro ao excluir", variant: "destructive" });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-start gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground">
            Produtos <span className="text-muted-foreground font-normal text-sm">({products.length})</span>
          </h2>
          {isLimitReached && (
            <p className="text-[10px] font-black text-red-500 uppercase mt-1 flex items-center gap-1 animate-pulse">
              <Sparkles className="w-3 h-3" /> Limite do Plano atingido
            </p>
          )}
        </div>

        <Button
          onClick={() => { setEditingProduct(null); setShowForm(true); }}
          disabled={isLimitReached}
          className={`font-black text-[11px] uppercase tracking-wider transition-all h-11 px-6 rounded-2xl ${isLimitReached
              ? "bg-muted text-muted-foreground border-border cursor-not-allowed"
              : "bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg active:scale-95 cursor-pointer"
            }`}
        >
          {isLimitReached ? "Limite de 100 Itens" : <><Plus className="w-4 h-4 mr-2" /> Novo Produto</>}
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Pesquisar no seu estoque..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9 pr-9 bg-background border-border text-foreground transition-colors focus-visible:ring-primary"
        />
        {searchTerm && (
          <button onClick={() => setSearchTerm("")} className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer">
            <X className="w-4 h-4 text-muted-foreground hover:text-foreground transition-colors" />
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-xs font-mono uppercase text-muted-foreground">Sincronizando dados...</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {filteredProducts.map((product) => (
            <Card
              key={product.id}
              className={`bg-card border-border transition-all ${!product.is_available ? 'opacity-50 grayscale bg-muted/20' : 'hover:border-primary/40 shadow-sm'}`}
            >
              <CardContent className="py-3 px-4 flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-muted border border-border flex items-center justify-center overflow-hidden shrink-0">
                  {product.image_url ? (
                    <img src={product.image_url} alt={product.name} className="w-full h-full object-contain p-1" />
                  ) : (
                    <ImageIcon className="w-5 h-5 text-muted-foreground/30" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-sm truncate text-foreground">{product.name}</h3>
                    {!product.is_available && <Badge variant="destructive" className="text-[8px] px-1 py-0 h-4">FALTA</Badge>}
                  </div>
                  <p className="text-xs text-primary font-bold">R$ {Number(product.price).toFixed(2).replace(".", ",")}</p>
                </div>

                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => { setEditingProduct(product); setShowForm(true); }} className="h-8 w-8 hover:bg-muted cursor-pointer">
                    <Pencil className="w-4 h-4 text-primary" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => setDeletingProduct(product)} className="h-8 w-8 hover:bg-destructive/10 cursor-pointer">
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* MODAL DO FORMULÁRIO */}
      {showForm && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl border border-border animate-in zoom-in-95 duration-300">
            <ProductForm
              product={editingProduct}
              onClose={() => {
                setShowForm(false);
                setEditingProduct(null);
                lastLoadedStoreId.current = null;
                loadProducts();
              }}
            />
          </div>
        </div>
      )}

      {/* MODAL DE CONFIRMAÇÃO DE EXCLUSÃO */}
      {deletingProduct && (
        <div className="fixed inset-0 z-[110] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="w-full max-w-md animate-in zoom-in-95 duration-200 bg-card border-border shadow-2xl">
            <CardContent className="pt-6">
              <h3 className="text-lg font-bold mb-2 text-foreground">Excluir Produto?</h3>
              <p className="text-sm text-muted-foreground mb-6">Você tem certeza que deseja remover <strong>{deletingProduct.name}</strong>?</p>
              <div className="flex justify-end gap-3">
                <Button variant="ghost" onClick={() => setDeletingProduct(null)} disabled={isDeleting} className="cursor-pointer">Cancelar</Button>
                <Button variant="destructive" onClick={() => handleDelete(deletingProduct.id)} disabled={isDeleting} className="font-bold">
                  {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Sim, Excluir"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};