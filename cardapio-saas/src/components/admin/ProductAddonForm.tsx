'use client';

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Loader2, Save, X, PlusCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useStore } from "@/contexts/StoreContext";

// ✅ IMPORTAÇÕES TIPO E SAAS
import { Category, ProductAddon } from "@/types";

interface ProductAddonFormProps {
  onClose: () => void;
  addon?: ProductAddon | null; // Tipado corretamente
}

export function ProductAddonForm({ onClose, addon }: ProductAddonFormProps) {
  const { store } = useStore();
  const { toast } = useToast();

  const [isSaving, setIsSaving] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoadingCats, setIsLoadingCats] = useState(true);

  const [formData, setFormData] = useState({
    name: addon?.name || "",
    price: addon?.price || 0,
    category_id: addon?.category_id || "",
    is_active: addon?.is_active ?? true,
  });

  // Carregar as categorias para o lojista escolher onde vincular o adicional
  useEffect(() => {
    async function loadCategories() {
      if (!store?.id) return;
      try {
        const { data, error } = await supabase
          .from('categories')
          .select('id, name')
          .eq('store_id', store.id)
          .order('name');

        if (error) throw error;
        setCategories((data as any) || []);

        // Se for novo e houver categorias, seleciona a primeira por padrão
        if (data && data.length > 0 && !formData.category_id && !addon) {
          setFormData(prev => ({ ...prev, category_id: data[0].id }));
        }
      } catch (err) {
        console.error("Erro ao carregar categorias:", err);
      } finally {
        setIsLoadingCats(false);
      }
    }
    loadCategories();
  }, [store?.id, addon]);

  const handleSave = async () => {
    if (!store?.id) {
      toast({ title: "Loja não identificada", variant: "destructive" });
      return;
    }

    if (!formData.name || !formData.category_id) {
      toast({ title: "Preencha o nome e a categoria!", variant: "destructive" });
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        store_id: store.id,
        name: formData.name,
        price: parseFloat(formData.price.toString()) || 0,
        category_id: formData.category_id,
        is_active: formData.is_active,
      };

      // ✅ Cast para any para contornar a falta da tabela no Schema local do TS
      const { error } = await (supabase
        .from('product_addons' as any)
        .upsert(addon?.id ? { id: addon.id, ...payload } : payload) as any);

      if (error) throw error;

      toast({ title: "Adicional salvo com sucesso! 🚀" });
      onClose();
    } catch (err: any) {
      toast({ title: "Erro ao salvar", description: err.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-6 space-y-6 bg-card text-foreground transition-colors">
      <div className="flex justify-between items-center border-b border-border pb-4">
        <div className="flex items-center gap-2">
          <PlusCircle className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-black uppercase tracking-tighter">
            {addon ? 'Editar Adicional' : 'Novo Adicional'}
          </h2>
        </div>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
          <X className="w-6 h-6" />
        </button>
      </div>

      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label className="text-[10px] font-black uppercase text-muted-foreground">Nome do Complemento</Label>
          <Input
            placeholder="Ex: Bacon Extra, Carne 180g..."
            value={formData.name}
            onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
            className="bg-background border-border font-bold h-12 rounded-xl text-foreground"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-[10px] font-black uppercase text-muted-foreground">Preço (R$)</Label>
            <Input
              type="number"
              step="0.01"
              value={formData.price}
              onChange={e => setFormData(prev => ({ ...prev, price: Number(e.target.value) }))}
              className="bg-background border-border font-bold h-12 rounded-xl text-foreground"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-[10px] font-black uppercase text-muted-foreground">Vincular à Categoria</Label>
            <select
              value={formData.category_id}
              onChange={e => setFormData(prev => ({ ...prev, category_id: e.target.value }))}
              className="w-full h-12 bg-background border-2 border-border rounded-xl px-3 text-sm font-bold text-foreground focus:border-primary outline-none transition-all"
            >
              {isLoadingCats ? (
                <option>Carregando...</option>
              ) : (
                categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))
              )}
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between p-4 bg-muted/20 rounded-xl border border-border">
          <div className="space-y-0.5">
            <Label className="text-sm font-bold">Disponível para venda</Label>
            <p className="text-[10px] text-muted-foreground uppercase font-bold">O cliente poderá ver este adicional</p>
          </div>
          <Switch
            checked={formData.is_active}
            onCheckedChange={val => setFormData(prev => ({ ...prev, is_active: val }))}
            className="data-[state=unchecked]:bg-slate-300 dark:data-[state=unchecked]:bg-slate-700"
          />
        </div>
      </div>

      <div className="flex gap-3 pt-4">
        <Button variant="ghost" onClick={onClose} className="flex-1 font-black uppercase text-xs h-12 rounded-xl text-foreground">
          Cancelar
        </Button>
        <Button onClick={handleSave} disabled={isSaving} className="flex-1 bg-primary text-primary-foreground font-black uppercase text-xs h-12 rounded-xl shadow-lg hover:bg-primary/90">
          {isSaving ? <Loader2 className="animate-spin w-4 h-4" /> : <><Save className="w-4 h-4 mr-2" /> Salvar Adicional</>}
        </Button>
      </div>
    </div>
  );
}