'use client';

import React, { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Pencil, Trash2, Loader2, Image as ImageIcon, Search, X } from "lucide-react";
import { ProductForm } from "./ProductForm";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

// Importações SaaS
import { supabase } from "@/lib/supabase/client";
import { useStore } from "@/contexts/StoreContext";

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category_id: string | null;
  image_url: string | null;
  is_cold: boolean;
  is_alcoholic: boolean;
  has_container: boolean;
  is_active: boolean;
  is_suggestion: boolean;
  sort_order: number;
  is_available: boolean;
  store_id: string; // Coluna SaaS
  categories?: { name: string; } | null;
}

export const ProductsTab = () => {
  const { toast } = useToast();
  const { store } = useStore(); // Identifica a loja atual

  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const loadProducts = async () => {
    if (!store?.id) return;

    try {
      setIsLoading(true);

      // Query SaaS: Filtra apenas produtos desta loja
      const { data, error } = await supabase
        .from('products')
        .select('*, categories(name)')
        .eq('store_id', store.id) // <--- SEGURANÇA SAAS
        .order('name', { ascending: true });

      if (error) throw error;
      setProducts(data || []);
    } catch (err: any) {
      toast({
        title: "Erro ao carregar",
        description: err.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, [store?.id]);

  const filteredProducts = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return products.filter(product =>
      product.name.toLowerCase().includes(term) ||
      product.categories?.name?.toLowerCase().includes(term)
    );
  }, [products, searchTerm]);

  const handleDelete = async (productId: string) => {
    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId)
        .eq('store_id', store?.id); // Garante que não apague de outra loja

      if (error) throw error;

      toast({ title: "Produto removido!" });
      setDeletingProduct(null);
      loadProducts();
    } catch (err: any) {
      toast({ title: "Erro ao excluir", variant: "destructive" });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold tracking-tight">
          Produtos <span className="text-muted-foreground font-normal text-sm">({filteredProducts.length})</span>
        </h2>
        <Button
          onClick={() => { setEditingProduct(null); setShowForm(true); }}
          className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold"
        >
          <Plus className="w-4 h-4 mr-2" /> Novo Produto
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Pesquisar no seu estoque..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9 pr-9"
        />
        {searchTerm && (
          <button onClick={() => setSearchTerm("")} className="absolute right-3 top-1/2 -translate-y-1/2">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-xs font-mono uppercase">Filtrando dados da {store?.name}...</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {filteredProducts.map((product) => (
            <Card key={product.id} className={`${!product.is_available ? 'opacity-60 bg-slate-50' : ''}`}>
              <CardContent className="py-3 px-4 flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-white border flex items-center justify-center overflow-hidden">
                  {product.image_url ? (
                    <img src={product.image_url} alt={product.name} className="w-full h-full object-contain" />
                  ) : (
                    <ImageIcon className="w-5 h-5 text-muted-foreground/30" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-sm truncate">{product.name}</h3>
                    {!product.is_available && <Badge variant="destructive" className="text-[8px]">Falta</Badge>}
                  </div>
                  <p className="text-xs text-primary font-bold">R$ {product.price.toFixed(2)}</p>
                </div>

                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => { setEditingProduct(product); setShowForm(true); }}>
                    <Pencil className="w-4 h-4 text-primary" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => setDeletingProduct(product)}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* MODAL FORMULÁRIO */}
      {showForm && (
        <div className="fixed inset-0 z-100 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-background rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl border">
            <ProductForm
              product={editingProduct}
              onClose={() => {
                setShowForm(false);
                setEditingProduct(null);
                loadProducts();
              }}
            />
          </div>
        </div>
      )}

      {/* MODAL EXCLUSÃO (Omitido aqui por brevidade, mas pode manter o original) */}
    </div>
  );
};