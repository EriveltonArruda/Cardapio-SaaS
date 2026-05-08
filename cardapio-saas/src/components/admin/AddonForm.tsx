'use client';

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Save, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// ✅ IMPORTAÇÕES TIPO E SAAS
import { supabase } from "@/lib/supabase/client";
import { useStore } from "@/contexts/StoreContext";
import { Product, Category, CartSuggestion } from "@/types";

interface AddonFormProps {
  onClose: () => void;
  suggestionToEdit?: CartSuggestion | null; // Tipado corretamente
}

export function AddonForm({ onClose, suggestionToEdit }: AddonFormProps) {
  const { toast } = useToast();
  const { store } = useStore();

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
        const [resP, resC] = await Promise.all([
          supabase.from('products').select('id, name, price').eq('store_id', store.id).order('name'),
          supabase.from('categories').select('id, name').eq('store_id', store.id).order('name')
        ]);

        if (resP.data) setProducts(resP.data as Product[]);
        if (resC.data) setCategories(resC.data as Category[]);

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
        store_id: store.id,
        product_id: selectedProduct,
        category_ids: isGlobal ? [] : selectedCategories,
        category_id: isGlobal ? null : (selectedCategories[0] || null),
        is_active: true
      };

      if (suggestionToEdit) {
        const { error } = await (supabase.from('cart_suggestions' as any) as any)
          .update(suggestionData)
          .eq('id', suggestionToEdit.id)
          .eq('store_id', store.id);
        if (error) throw error;
      } else {
        const { error } = await (supabase.from('cart_suggestions' as any) as any)
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
    <div className="p-6 space-y-6 bg-card text-foreground transition-colors">
      <div className="flex justify-between items-center border-b border-border pb-4">
        <h3 className="font-bold text-lg uppercase tracking-tight">
          {suggestionToEdit ? "Editar Sugestão" : "Nova Sugestão"}
        </h3>
        <Button variant="ghost" size="icon" onClick={onClose} className="hover:bg-muted transition-colors">
          <X className="w-5 h-5" />
        </Button>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label className="text-xs font-bold uppercase text-muted-foreground">1. Produto a ser sugerido:</Label>
          <Select value={selectedProduct} onValueChange={setSelectedProduct} disabled={isLoading}>
            <SelectTrigger className="h-12 rounded-xl border-border bg-background transition-colors focus:ring-primary text-foreground">
              <SelectValue placeholder={isLoading ? "Buscando estoque..." : "Selecione um produto..."} />
            </SelectTrigger>
            <SelectContent className="z-[120] bg-card border-border text-foreground">
              {products.map(p => (
                <SelectItem key={p.id} value={p.id} className="text-sm focus:bg-muted focus:text-foreground">
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-3">
          <Label className="text-xs font-bold uppercase text-muted-foreground">2. Gatilho da sugestão:</Label>

          <div className="flex items-center space-x-3 p-4 bg-primary/5 rounded-xl border border-primary/20 transition-all hover:bg-primary/10">
            <Checkbox
              id="global"
              checked={isGlobal}
              onCheckedChange={(checked: boolean | "indeterminate") => {
                setIsGlobal(!!checked);
                if (checked) setSelectedCategories([]);
              }}
              className="border-primary data-[state=checked]:bg-primary"
            />
            <label htmlFor="global" className="text-sm font-black text-primary cursor-pointer uppercase tracking-tight">
              🌍 Sugerir em todo o carrinho
            </label>
          </div>

          <div className="border border-border rounded-xl p-3 bg-muted/30">
            <p className="text-[10px] uppercase font-bold text-muted-foreground mb-3 px-1">
              Ou apenas para categorias específicas:
            </p>
            <ScrollArea className="h-44 pr-4">
              <div className="space-y-3">
                {categories.map((cat) => (
                  <div key={cat.id} className="flex items-center space-x-3 hover:bg-background/50 p-1.5 rounded-lg transition-all group">
                    <Checkbox
                      id={cat.id}
                      checked={selectedCategories.includes(cat.id)}
                      onCheckedChange={() => toggleCategory(cat.id)}
                      className="border-border data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                    />
                    <label htmlFor={cat.id} className="text-sm font-medium cursor-pointer select-none text-foreground group-hover:text-primary transition-colors">
                      {cat.name}
                    </label>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>

        <Button
          className="w-full h-14 font-bold mt-4 rounded-xl shadow-lg uppercase tracking-tighter bg-primary text-primary-foreground hover:bg-primary/90"
          onClick={handleSave}
          disabled={isSaving || isLoading}
        >
          {isSaving ? <Loader2 className="animate-spin mr-2 h-5 w-5" /> : <Save className="mr-2 h-5 w-5" />}
          {suggestionToEdit ? "Salvar Alterações" : "Ativar Sugestão"}
        </Button>
      </div>
    </div>
  );
}