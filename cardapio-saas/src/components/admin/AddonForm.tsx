'use client';

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Save, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Importações SaaS
import { supabase } from "@/lib/supabase/client";
import { useStore } from "@/contexts/StoreContext";

interface AddonFormProps {
  onClose: () => void;
  suggestionToEdit?: any;
}

interface Product { id: string; name: string; price: number; }
interface Category { id: string; name: string; }

export function AddonForm({ onClose, suggestionToEdit }: AddonFormProps) {
  const { toast } = useToast();
  const { store } = useStore(); // Contexto da loja ativa

  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  const [selectedProduct, setSelectedProduct] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [isGlobal, setIsGlobal] = useState(false);

  useEffect(() => {
    async function loadData() {
      if (!store?.id) return;

      setIsLoading(true);
      try {
        // Busca produtos e categorias APENAS desta loja
        const [resP, resC] = await Promise.all([
          supabase.from('products').select('id, name, price').eq('store_id', store.id).order('name'),
          supabase.from('categories').select('id, name').eq('store_id', store.id).order('name')
        ]);

        if (resP.data) setProducts(resP.data);
        if (resC.data) setCategories(resC.data);

        if (suggestionToEdit) {
          setSelectedProduct(suggestionToEdit.product_id);
          const cats = suggestionToEdit.category_ids || [];
          setSelectedCategories(cats);
          setIsGlobal(cats.length === 0);
        }

      } catch (error) {
        console.error("❌ Erro ao carregar dados:", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [store?.id, suggestionToEdit]);

  const toggleCategory = (id: string) => {
    setIsGlobal(false);
    setSelectedCategories(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleSave = async () => {
    if (!selectedProduct || !store?.id) {
      toast({ title: "Selecione um produto", variant: "destructive" });
      return;
    }

    setIsSaving(true);
    try {
      const suggestionData = {
        store_id: store.id, // <--- Garantia SaaS
        product_id: selectedProduct,
        category_ids: isGlobal ? [] : selectedCategories,
        category_id: isGlobal ? null : selectedCategories[0],
        is_active: true
      };

      if (suggestionToEdit) {
        const { error } = await supabase
          .from('cart_suggestions')
          .update(suggestionData)
          .eq('id', suggestionToEdit.id)
          .eq('store_id', store.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('cart_suggestions')
          .insert([suggestionData]);
        if (error) throw error;
      }

      toast({ title: suggestionToEdit ? "Sugestão atualizada!" : "Sugestão salva!" });
      onClose();

    } catch (err: any) {
      toast({ title: "Erro ao salvar", description: err.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center border-b pb-4">
        <h3 className="font-bold text-lg text-slate-800 uppercase tracking-tight">
          {suggestionToEdit ? "Editar Sugestão" : "Nova Sugestão"}
        </h3>
        <Button variant="ghost" size="icon" onClick={onClose}><X className="w-5 h-5" /></Button>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label className="text-xs font-bold uppercase text-slate-500">1. Produto a ser sugerido:</Label>
          <Select value={selectedProduct} onValueChange={setSelectedProduct} disabled={isLoading}>
            <SelectTrigger className="h-12 rounded-xl">
              <SelectValue placeholder={isLoading ? "Buscando estoque..." : "Selecione um produto..."} />
            </SelectTrigger>
            <SelectContent className="z-120">
              {products.map(p => (
                <SelectItem key={p.id} value={p.id} className="text-sm">{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-3">
          <Label className="text-xs font-bold uppercase text-slate-500">2. Gatilho da sugestão:</Label>

          <div className="flex items-center space-x-3 p-4 bg-primary/5 rounded-xl border border-primary/10 transition-colors hover:bg-primary/10">
            <Checkbox
              id="global"
              checked={isGlobal}
              onCheckedChange={(checked: boolean | "indeterminate") => {
                setIsGlobal(!!checked);
                if (checked) setSelectedCategories([]);
              }}
            />
            <label htmlFor="global" className="text-sm font-black text-primary cursor-pointer uppercase tracking-tight">
              🌍 Sugerir em todo o carrinho
            </label>
          </div>

          <div className="border rounded-xl p-3 bg-slate-50">
            <p className="text-[10px] uppercase font-bold text-slate-400 mb-3 px-1">Ou apenas para categorias específicas:</p>
            <ScrollArea className="h-44 pr-4">
              <div className="space-y-3">
                {categories.map((cat) => (
                  <div key={cat.id} className="flex items-center space-x-3 hover:bg-white p-1.5 rounded-lg transition-all">
                    <Checkbox
                      id={cat.id}
                      checked={selectedCategories.includes(cat.id)}
                      onCheckedChange={() => toggleCategory(cat.id)}
                    />
                    <label htmlFor={cat.id} className="text-sm font-medium cursor-pointer select-none">
                      {cat.name}
                    </label>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>

        <Button className="w-full h-14 font-bold mt-4 rounded-xl shadow-lg uppercase tracking-tighter" onClick={handleSave} disabled={isSaving || isLoading}>
          {isSaving ? <Loader2 className="animate-spin mr-2 h-5 w-5" /> : <Save className="mr-2 h-5 w-5" />}
          {suggestionToEdit ? "Salvar Alterações" : "Ativar Sugestão"}
        </Button>
      </div>
    </div>
  );
}