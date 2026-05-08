'use client';

import React, { useState, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabase/client";
import { useStore } from "@/contexts/StoreContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Search,
  PlusCircle,
  Layers
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ProductAddonForm } from "./ProductAddonForm";
import { Badge } from "@/components/ui/badge";
import { ProductAddon } from "@/types"; // ✅ Importando do index.ts

export function ProductAddonsTab() {
  const { store, isLoading: isStoreLoading } = useStore();
  const { toast } = useToast();

  const [addons, setAddons] = useState<ProductAddon[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingAddon, setEditingAddon] = useState<ProductAddon | null>(null);

  const loadAddons = async () => {
    if (!store?.id) return;
    try {
      setIsLoading(true);
      // ✅ Cast para any para evitar erro de tabela não mapeada
      const { data, error } = await (supabase.from('product_addons' as any) as any)
        .select(`
          *,
          categories (name)
        `)
        .eq('store_id', store.id)
        .order('name');

      if (error) throw error;
      setAddons((data as any) || []);
    } catch (err) {
      console.error(err);
      toast({ title: "Erro ao carregar adicionais", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isStoreLoading && store?.id) {
      loadAddons();
    }
  }, [store?.id, isStoreLoading]);

  const filteredAddons = useMemo(() => {
    return addons.filter(item =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.categories?.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [addons, searchTerm]);

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este adicional?")) return;

    try {
      const { error } = await (supabase.from('product_addons' as any) as any)
        .delete()
        .eq('id', id)
        .eq('store_id', store?.id);

      if (error) throw error;
      toast({ title: "Adicional excluído!" });
      loadAddons();
    } catch (err) {
      toast({ title: "Erro ao excluir", variant: "destructive" });
    }
  };

  if (isStoreLoading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold tracking-tight text-foreground">
          Complementos / Adicionais <span className="text-muted-foreground font-normal text-sm">({filteredAddons.length})</span>
        </h2>
        <Button onClick={() => { setEditingAddon(null); setShowForm(true); }} className="bg-primary hover:bg-primary/90 font-bold">
          <Plus className="w-4 h-4 mr-2" /> Novo Adicional
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome ou categoria..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9 bg-card border-border text-foreground"
        />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary" /></div>
      ) : filteredAddons.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed border-border rounded-3xl">
          <PlusCircle className="w-10 h-10 mx-auto mb-3 text-muted-foreground/20" />
          <p className="text-muted-foreground font-medium">Nenhum adicional cadastrado.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {filteredAddons.map((item) => (
            <Card key={item.id} className="bg-card border-border hover:border-primary/30 transition-all overflow-hidden">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-primary">
                    <Layers className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground leading-tight">{item.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-[9px] font-black uppercase border-primary/30 text-primary py-0">
                        {item.categories?.name || 'Sem categoria'}
                      </Badge>
                      <span className="text-sm font-black text-green-500">
                        {item.price > 0 ? `+ ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.price)}` : 'Grátis'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button variant="ghost" size="icon" onClick={() => { setEditingAddon(item); setShowForm(true); }} className="h-9 w-9 text-primary hover:bg-primary/10">
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)} className="h-9 w-9 text-destructive hover:bg-destructive/10">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card rounded-3xl w-full max-w-lg shadow-2xl border border-border animate-in zoom-in-95 duration-200 overflow-hidden">
            <ProductAddonForm
              addon={editingAddon}
              onClose={() => {
                setShowForm(false);
                setEditingAddon(null);
                loadAddons();
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}