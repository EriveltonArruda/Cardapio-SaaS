'use client';

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Trash2, Plus, Pencil, ImageIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AddonForm } from "./AddonForm";

// Importações SaaS
import { supabase } from "@/lib/supabase/client";
import { useStore } from "@/contexts/StoreContext";

export function AddonsTab() {
  const { toast } = useToast();
  const { store } = useStore(); // Identidade da loja SaaS

  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [deletingSuggestion, setDeletingSuggestion] = useState<any | null>(null);

  useEffect(() => {
    if (store?.id) {
      loadSuggestions();
    }
  }, [store?.id]);

  const loadSuggestions = async () => {
    if (!store?.id) return;

    setIsLoading(true);
    try {
      // Query SaaS com joins para pegar dados do produto e categoria
      const { data, error } = await supabase
        .from('cart_suggestions')
        .select(`
          *,
          products(name, price, image_url),
          categories(name)
        `)
        .eq('store_id', store.id) // <--- Filtro de segurança SaaS
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSuggestions(data || []);

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

  const handleDelete = async (id: string) => {
    if (!store?.id) return;

    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('cart_suggestions')
        .delete()
        .eq('id', id)
        .eq('store_id', store.id); // Garante que só apague da própria loja

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

  const handleEdit = (item: any) => {
    setEditingItem(item);
    setShowForm(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold tracking-tight">Sugestões de Venda</h2>
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
          <p className="text-xs font-mono uppercase">Sincronizando sugestões...</p>
        </div>
      ) : (
        <div className="space-y-3">
          {suggestions.length === 0 ? (
            <div className="col-span-full py-12 text-center border-2 border-dashed rounded-xl text-muted-foreground/40">
              Nenhuma sugestão configurada para esta loja.
            </div>
          ) : (
            suggestions.map((item) => (
              <Card key={item.id} className="hover:border-primary/40 transition-colors shadow-sm">
                <CardContent className="py-3 px-4 flex items-center gap-4">
                  {/* Thumbnail */}
                  <div className="w-12 h-12 rounded-lg bg-white border flex items-center justify-center shrink-0 overflow-hidden p-0.5">
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

                  {/* Detalhes */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold truncate text-sm">
                        {item.products?.name || "Produto Removido"}
                      </h3>
                      {(!item.category_id && (!item.category_ids || item.category_ids.length === 0)) ? (
                        <Badge className="bg-blue-500 text-[10px] px-2 py-0.5 font-normal">🌍 Global</Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px] px-2 py-0.5 font-normal text-muted-foreground">
                          🛒 {item.category_ids?.length || 1} Categorias
                        </Badge>
                      )}
                    </div>
                    <div className="text-xs text-primary font-bold">
                      R$ {item.products?.price ? item.products.price.toFixed(2).replace(".", ",") : "0,00"}
                    </div>
                  </div>

                  {/* Ações */}
                  <div className="flex gap-1 ml-auto">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(item)}>
                      <Pencil className="w-4 h-4 text-primary" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setDeletingSuggestion(item)}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {/* MODAL DO FORMULÁRIO */}
      {showForm && (
        <div className="fixed inset-0 z-100 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-background rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl border animate-in zoom-in-95 duration-200">
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

      {/* MODAL DE CONFIRMAÇÃO DE EXCLUSÃO */}
      {deletingSuggestion && (
        <div className="fixed inset-0 z-110 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-background rounded-xl p-6 w-full max-w-sm border shadow-2xl">
            <h3 className="text-lg font-bold mb-2">Remover Sugestão?</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Deseja realmente apagar a sugestão de <strong>"{deletingSuggestion.products?.name}"</strong>?
            </p>
            <div className="flex gap-3">
              <Button variant="ghost" className="flex-1 font-bold" onClick={() => setDeletingSuggestion(null)}>Cancelar</Button>
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