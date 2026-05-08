'use client';

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Trash2, Plus, Pencil, ImageIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AddonForm } from "./AddonForm";

// ✅ IMPORTAÇÕES TIPO E SAAS
import { supabase } from "@/lib/supabase/client";
import { useStore } from "@/contexts/StoreContext";
import { CartSuggestion } from "@/types";

export function AddonsTab() {
  const { toast } = useToast();
  const { store, isLoading: isStoreLoading } = useStore();

  const [suggestions, setSuggestions] = useState<CartSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<CartSuggestion | null>(null);
  const [deletingSuggestion, setDeletingSuggestion] = useState<CartSuggestion | null>(null);

  const loadSuggestions = async () => {
    if (!store?.id) return;

    setIsLoading(true);
    try {
      // ✅ CORREÇÃO: Cast duplo (as any) para evitar erro ts(2769) quando a tabela não está no Schema local
      const { data, error } = await (supabase.from('cart_suggestions' as any) as any)
        .select(`
          *,
          products(name, price, image_url)
        `)
        .eq('store_id', store.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSuggestions((data as any) || []);

    } catch (err: any) {
      console.error("Erro ao carregar sugestões:", err);
      toast({
        title: "Erro de Conexão",
        description: "Não foi possível carregar as sugestões.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isStoreLoading && store?.id) {
      loadSuggestions();
    }
  }, [store?.id, isStoreLoading]);

  const handleDelete = async (id: string) => {
    if (!store?.id) return;

    setIsDeleting(true);
    try {
      // ✅ CORREÇÃO: Cast para ignorar validação rigorosa de tabela inexistente no types
      const { error } = await (supabase.from('cart_suggestions' as any) as any)
        .delete()
        .eq('id', id)
        .eq('store_id', store.id);

      if (error) throw error;

      toast({ title: "Sugestão removida!" });
      setDeletingSuggestion(null);
      loadSuggestions();
    } catch (err: any) {
      toast({
        title: "Erro ao excluir",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEdit = (item: CartSuggestion) => {
    setEditingItem(item);
    setShowForm(true);
  };

  if (isStoreLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-xs font-mono uppercase text-muted-foreground">Verificando loja...</p>
      </div>
    );
  }

  if (!store) return null;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold tracking-tight text-foreground">Sugestões de Venda</h2>
        <Button
          onClick={() => { setEditingItem(null); setShowForm(true); }}
          className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold"
        >
          <Plus className="w-4 h-4 mr-2" /> Nova Sugestão
        </Button>
      </div>

      {isLoading && suggestions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-xs font-mono uppercase text-muted-foreground">Sincronizando sugestões...</p>
        </div>
      ) : (
        <div className="space-y-3">
          {suggestions.length === 0 ? (
            <div className="col-span-full py-12 text-center border-2 border-dashed rounded-xl border-border text-muted-foreground/40">
              Nenhuma sugestão configurada para esta loja.
            </div>
          ) : (
            suggestions.map((item) => (
              <Card key={item.id} className="bg-card border-border hover:border-primary/40 transition-colors shadow-sm">
                <CardContent className="py-3 px-4 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-muted border border-border flex items-center justify-center shrink-0 overflow-hidden p-0.5">
                    {item.products?.image_url ? (
                      <img
                        src={item.products.image_url}
                        alt={item.products.name}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <ImageIcon className="w-5 h-5 text-muted-foreground/30" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold truncate text-sm text-foreground">
                        {item.products?.name || "Produto Removido"}
                      </h3>
                      {(!item.category_id && (!item.category_ids || item.category_ids.length === 0)) ? (
                        <Badge className="bg-blue-500 text-white text-[10px] px-2 py-0.5 font-normal border-none">🌍 Global</Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px] px-2 py-0.5 font-normal text-muted-foreground border-border">
                          🛒 {item.category_ids?.length || 1} Categorias
                        </Badge>
                      )}
                    </div>
                    <div className="text-xs text-primary font-bold">
                      R$ {item.products?.price ? item.products.price.toFixed(2).replace(".", ",") : "0,00"}
                    </div>
                  </div>

                  <div className="flex gap-1 ml-auto">
                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-muted" onClick={() => handleEdit(item)}>
                      <Pencil className="w-4 h-4 text-primary" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-destructive/10" onClick={() => setDeletingSuggestion(item)}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl border border-border animate-in zoom-in-95 duration-200">
            <AddonForm
              suggestionToEdit={editingItem}
              onClose={() => {
                setShowForm(false);
                setEditingItem(null);
                loadSuggestions();
              }}
            />
          </div>
        </div>
      )}

      {deletingSuggestion && (
        <div className="fixed inset-0 z-[110] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card rounded-xl p-6 w-full max-w-sm border border-border shadow-2xl">
            <h3 className="text-lg font-bold mb-2 text-foreground">Remover Sugestão?</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Deseja realmente apagar a sugestão de <strong>"{deletingSuggestion.products?.name}"</strong>?
            </p>
            <div className="flex gap-3">
              <Button variant="ghost" className="flex-1 font-bold text-foreground hover:bg-muted" onClick={() => setDeletingSuggestion(null)}>Cancelar</Button>
              <Button
                variant="destructive"
                className="flex-1 font-bold"
                onClick={() => handleDelete(deletingSuggestion.id)}
                disabled={isDeleting}
              >
                {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Sim, Excluir"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}