'use client';

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Loader2, Upload, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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
  store_id: string;
}

interface Category { id: string; name: string; }

interface ProductFormProps { product: Product | null; onClose: () => void; }

export function ProductForm({ product, onClose }: ProductFormProps) {
  const { toast } = useToast();
  const { store } = useStore(); // Pega a loja ativa (ex: Expresso)

  const [name, setName] = useState(product?.name || "");
  const [description, setDescription] = useState(product?.description || "");
  const [priceInput, setPriceInput] = useState(
    product ? (Number(product.price)).toFixed(2).replace(".", ",") : ""
  );
  const [categoryId, setCategoryId] = useState(product?.category_id || "");
  const [isCold, setIsCold] = useState(product?.is_cold || false);
  const [isAlcoholic, setIsAlcoholic] = useState(product?.is_alcoholic || false);
  const [hasContainer, setHasContainer] = useState(product?.has_container || false);
  const [isSuggestion, setIsSuggestion] = useState(product?.is_suggestion || false);
  const [isAvailable, setIsAvailable] = useState(product?.is_available !== false);
  const [imageUrl, setImageUrl] = useState(product?.image_url || "");

  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Carrega categorias apenas desta loja
  useEffect(() => {
    async function loadCategories() {
      if (!store?.id) return;

      try {
        const { data, error } = await supabase
          .from('categories')
          .select('id, name')
          .eq('store_id', store.id) // <--- Filtro SaaS
          .eq('is_active', true)
          .order('name', { ascending: true });

        if (error) throw error;
        setCategories(data || []);
      } catch (err) {
        console.error("Erro ao carregar categorias:", err);
      }
    }
    loadCategories();
  }, [store?.id]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !store?.id) return;

    setIsUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${store.slug}/${Date.now()}.${fileExt}`; // Organiza por pasta de loja

      const { data, error } = await supabase.storage
        .from('products')
        .upload(fileName, file);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('products')
        .getPublicUrl(fileName);

      setImageUrl(publicUrl);
      toast({ title: "Imagem enviada!" });
    } catch (error: any) {
      toast({ title: "Erro no Upload", description: error.message, variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

  const handlePriceChange = (value: string) => {
    const cleaned = value.replace(/[^\d,]/g, "");
    const parts = cleaned.split(",");
    if (parts.length > 2 || (parts[1] && parts[1].length > 2)) return;
    setPriceInput(cleaned);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !priceInput || !store?.id) {
      toast({ title: "Preencha os campos obrigatórios", variant: "destructive" });
      return;
    }

    setIsSaving(true);
    try {
      const priceValue = parseFloat(priceInput.replace(",", "."));
      const productData = {
        store_id: store.id, // <--- OBRIGATÓRIO PARA SAAS
        name: name.trim(),
        description: description.trim() || null,
        price: priceValue,
        category_id: categoryId || null,
        is_cold: isCold,
        is_alcoholic: isAlcoholic,
        has_container: hasContainer,
        is_suggestion: isSuggestion,
        is_available: isAvailable,
        image_url: imageUrl || null,
        is_active: true,
      };

      if (product) {
        const { error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', product.id)
          .eq('store_id', store.id); // Segurança extra
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('products')
          .insert([productData]);
        if (error) throw error;
      }

      toast({ title: "Produto salvo com sucesso!" });
      onClose();
    } catch (err: any) {
      toast({ title: "Erro ao salvar", description: err.message, variant: "destructive" });
    } finally { setIsSaving(false); }
  };

  return (
    <Card className="border-none shadow-none flex flex-col h-full max-h-[90vh]">
      <CardHeader className="px-6 py-4 border-b bg-background sticky top-0 z-10 shrink-0">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <CardTitle className="text-xl font-bold">{product ? "Editar Produto" : "Novo Produto"}</CardTitle>
        </div>
      </CardHeader>

      <CardContent className="px-6 py-6 overflow-y-auto flex-1 bg-background">
        <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl mx-auto">
          {/* SEÇÃO DE IMAGEM */}
          <div className="space-y-2 text-center flex flex-col items-center">
            <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2">Imagem do Produto</Label>
            <div className="relative group">
              {imageUrl ? (
                <div className="relative w-40 h-40 bg-white rounded-2xl border shadow-md overflow-hidden flex items-center justify-center p-1">
                  <img src={imageUrl} alt="Preview" className="w-full h-full object-contain" />
                  <button type="button" onClick={() => setImageUrl("")} className="absolute top-1 right-1 w-7 h-7 bg-destructive text-white rounded-full flex items-center justify-center border-2 border-background shadow-lg transition-transform hover:scale-110">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div onClick={() => fileInputRef.current?.click()} className="w-40 h-40 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:bg-primary/5 hover:border-primary transition-all text-muted-foreground">
                  {isUploading ? <Loader2 className="w-6 h-6 animate-spin text-primary" /> : <><Upload className="w-6 h-6" /><span className="text-[10px] mt-2 font-bold uppercase">Enviar Foto</span></>}
                </div>
              )}
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-bold">Nome do Produto *</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Cerveja Brahma 600ml" className="h-12" required />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-bold">Preço de Venda (R$) *</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-bold">R$</span>
                <Input value={priceInput} onChange={(e) => handlePriceChange(e.target.value)} className="pl-10 h-12 font-bold" placeholder="0,00" required />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-bold">Categoria</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger className="h-12 w-full">
                <SelectValue placeholder="Selecione a categoria" />
              </SelectTrigger>
              <SelectContent className="z-100">
                {categories.length > 0 ? (
                  categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                  ))
                ) : (
                  <SelectItem value="none" disabled>Nenhuma categoria cadastrada</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-bold">Descrição / Detalhes</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Ex: Produto gelado, preço por unidade..." rows={3} className="resize-none" />
          </div>

          {/* STATUS E CARACTERÍSTICAS */}
          <div className="p-5 border rounded-2xl bg-slate-50/50 space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm font-bold">Item Disponível</Label>
                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">Ativar/Desativar no cardápio</p>
              </div>
              <Switch checked={isAvailable} onCheckedChange={setIsAvailable} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t pt-5">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="cold"
                  checked={isCold}
                  onCheckedChange={(s: boolean | "indeterminate") => setIsCold(!!s)}
                />
                <Label htmlFor="cold" className="text-sm font-bold cursor-pointer">❄️ Gelado</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="alcoholic"
                  checked={isAlcoholic}
                  onCheckedChange={(s: boolean | "indeterminate") => setIsAlcoholic(!!s)}
                />
                <Label htmlFor="alcoholic" className="text-sm font-bold cursor-pointer">🔞 Alcoólico</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="container"
                  checked={hasContainer}
                  onCheckedChange={(s: boolean | "indeterminate") => setHasContainer(!!s)}
                />
                <Label htmlFor="container" className="text-sm font-bold cursor-pointer">🍾 Vasilhame</Label>
              </div>
            </div>
          </div>

          {/* BOTÕES DE AÇÃO */}
          <div className="flex gap-3 pt-4 sticky bottom-0 bg-background pb-4 border-t">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1 font-bold h-12 uppercase tracking-tighter">Cancelar</Button>
            <Button type="submit" disabled={isSaving} className="flex-1 font-bold h-12 shadow-lg bg-primary uppercase tracking-tighter">
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : "Salvar Alterações"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}