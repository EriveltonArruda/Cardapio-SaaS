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

// ✅ IMPORTAÇÕES DE TIPOS E SAAS
import { supabase } from "@/lib/supabase/client";
import { useStore } from "@/contexts/StoreContext";
import { productSchema, zodErrorsToMap } from "@/lib/validations";
import { Product, Category } from "@/types"; // Importando do seu index.ts

interface ProductFormProps {
  product: Product | null;
  onClose: () => void;
}

export function ProductForm({ product, onClose }: ProductFormProps) {
  const { toast } = useToast();
  const { store, isLoading: isStoreLoading } = useStore();

  // Estados dos campos
  const [name, setName] = useState(product?.name || "");
  const [description, setDescription] = useState(product?.description || "");
  const [priceInput, setPriceInput] = useState(
    product ? (Number(product.price)).toFixed(2).replace(".", ",") : ""
  );
  const [categoryId, setCategoryId] = useState(product?.category_id || "");

  // Tags e Booleanos
  const [isCold, setIsCold] = useState(product?.is_cold || false);
  const [isAlcoholic, setIsAlcoholic] = useState(product?.is_alcoholic || false);
  const [hasContainer, setHasContainer] = useState(product?.has_container || false);
  const [isFeatured, setIsFeatured] = useState(product?.is_featured || false);
  const [isArtisanal, setIsArtisanal] = useState(product?.is_artisanal || false);
  const [isNew, setIsNew] = useState(product?.is_new || false);
  const [isVeggie, setIsVeggie] = useState(product?.is_veggie || false);
  const [isWoodFire, setIsWoodFire] = useState(product?.is_wood_fire || false);
  const [isSuggestion, setIsSuggestion] = useState(product?.is_suggestion || false);
  const [isAvailable, setIsAvailable] = useState(product?.is_available !== false);

  const [imageUrl, setImageUrl] = useState(product?.image_url || "");
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let isMounted = true;
    async function loadCategories() {
      if (isStoreLoading || !store?.id) return;
      try {
        const { data, error } = await supabase
          .from('categories')
          .select('*') // ✅ Busca tudo para bater com a interface Category
          .eq('store_id', store.id)
          .eq('is_active', true)
          .order('name', { ascending: true });

        if (!isMounted) return;
        if (error) throw error;
        setCategories(data || []);
      } catch (err) {
        console.error("Erro ao carregar categorias:", err);
      }
    }
    loadCategories();
    return () => { isMounted = false; };
  }, [store?.id, isStoreLoading]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !store?.id || isUploading) return;

    setIsUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${store.slug}/${Date.now()}.${fileExt}`;

      const { error } = await supabase.storage
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
      setImageUrl("");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
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
    if (!store?.id) return;

    const priceValue = parseFloat(priceInput.replace(",", ".")) || 0;
    const parsed = productSchema.safeParse({ name, price: priceValue });
    if (!parsed.success) {
      setErrors(zodErrorsToMap(parsed.error));
      toast({ title: "Confira os campos destacados", variant: "destructive" });
      return;
    }
    setErrors({});

    setIsSaving(true);
    try {
      const productData = {
        store_id: store.id,
        name: name.trim(),
        description: description.trim() || null,
        price: priceValue,
        category_id: categoryId || null,
        is_cold: isCold,
        is_alcoholic: isAlcoholic,
        has_container: hasContainer,
        is_featured: isFeatured,
        is_artisanal: isArtisanal,
        is_new: isNew,
        is_veggie: isVeggie,
        is_wood_fire: isWoodFire,
        is_suggestion: isSuggestion,
        is_available: isAvailable,
        image_url: imageUrl || null,
        is_active: true,
      };

      if (product) {
        // ✅ O 'as any' no from() cala a verificação de propriedades excedentes
        const { error } = await (supabase.from('products') as any)
          .update(productData)
          .eq('id', product.id)
          .eq('store_id', store.id);
        if (error) throw error;
      } else {
        // ✅ O 'as any' aqui também garante a criação do produto sem erros
        const { error } = await (supabase.from('products') as any)
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
    <Card className="border-none shadow-none flex flex-col h-full max-h-[90vh] bg-card text-foreground">
      <CardHeader className="px-6 py-4 border-b border-border bg-card sticky top-0 z-10 shrink-0">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full hover:bg-muted">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <CardTitle className="text-xl font-bold">{product ? "Editar Produto" : "Novo Produto"}</CardTitle>
        </div>
      </CardHeader>

      <CardContent className="px-6 py-6 overflow-y-auto flex-1 bg-card">
        <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl mx-auto">
          {/* SEÇÃO DE IMAGEM */}
          <div className="space-y-2 text-center flex flex-col items-center">
            <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2">Imagem do Produto</Label>
            <div className="relative group">
              {imageUrl ? (
                <div className="relative w-40 h-40 bg-muted rounded-2xl border border-border shadow-md overflow-hidden flex items-center justify-center p-1">
                  <img src={imageUrl} alt="Preview" className="w-full h-full object-contain" />
                  <button type="button" onClick={() => setImageUrl("")} className="absolute top-1 right-1 w-7 h-7 bg-destructive text-white rounded-full flex items-center justify-center border-2 border-card shadow-lg transition-transform hover:scale-110">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div onClick={() => fileInputRef.current?.click()} className="w-40 h-40 border-2 border-dashed border-border rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:bg-primary/5 hover:border-primary transition-all text-muted-foreground">
                  {isUploading ? <Loader2 className="w-6 h-6 animate-spin text-primary" /> : <><Upload className="w-6 h-6" /><span className="text-[10px] mt-2 font-bold uppercase">Enviar Foto</span></>}
                </div>
              )}
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-bold">Nome do Produto *</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Pizza Calabresa" className="h-12 bg-background border-border text-foreground" required />
              {errors.name && <p className="text-[10px] font-bold text-red-500 uppercase">{errors.name}</p>}
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-bold">Preço de Venda (R$) *</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-bold">R$</span>
                <Input value={priceInput} onChange={(e) => handlePriceChange(e.target.value)} className="pl-10 h-12 font-bold bg-background border-border text-foreground" placeholder="0,00" required />
              </div>
              {errors.price && <p className="text-[10px] font-bold text-red-500 uppercase">{errors.price}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-bold">Categoria</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger className="h-12 w-full bg-background border-border text-foreground">
                <SelectValue placeholder="Selecione a categoria" />
              </SelectTrigger>
              <SelectContent className="z-251 bg-card border border-border shadow-2xl rounded-xl">
                {categories.length > 0 ? (
                  categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id} className="cursor-pointer py-3 px-4">
                      {cat.name}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="none" disabled>Nenhuma categoria cadastrada</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-bold">Descrição / Detalhes</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Ex: Ingredientes, peso ou especificações..." rows={3} className="resize-none bg-background border-border text-foreground" />
          </div>

          <div className="p-5 border border-border rounded-2xl bg-muted/30 space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm font-bold text-foreground">Item Disponível</Label>
                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">Ativar/Desativar no cardápio</p>
              </div>
              <Switch checked={isAvailable} onCheckedChange={setIsAvailable} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-border pt-5">
              {[
                { id: "featured", label: "🏆 Mais Pedido", state: isFeatured, set: setIsFeatured },
                { id: "artisanal", label: "🥩 Artesanal / Blend", state: isArtisanal, set: setIsArtisanal },
                { id: "new", label: "🔥 Lançamento", state: isNew, set: setIsNew },
                { id: "veggie", label: "🌱 Veggie", state: isVeggie, set: setIsVeggie },
                { id: "woodfire", label: "🧱🔥 Fogão a Lenha", state: isWoodFire, set: setIsWoodFire },
                { id: "suggestion", label: "💡 Sugestão do Cheff", state: isSuggestion, set: setIsSuggestion },
              ].map((tag) => (
                <div key={tag.id} className="flex items-center gap-2 group">
                  <Checkbox id={tag.id} checked={tag.state} onCheckedChange={(s) => tag.set(!!s)} className="border-border data-[state=checked]:bg-primary" />
                  <Label htmlFor={tag.id} className="text-sm font-bold cursor-pointer text-foreground group-hover:text-primary transition-colors">{tag.label}</Label>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-border pt-5">
              {[
                { id: "cold", label: "❄️ Gelado", state: isCold, set: setIsCold },
                { id: "alcoholic", label: "🔞 Alcoólico", state: isAlcoholic, set: setIsAlcoholic },
                { id: "container", label: "🍾 Vasilhame", state: hasContainer, set: setHasContainer },
              ].map((extra) => (
                <div key={extra.id} className="flex items-center gap-2 opacity-70 group">
                  <Checkbox id={extra.id} checked={extra.state} onCheckedChange={(s) => extra.set(!!s)} className="border-border" />
                  <Label htmlFor={extra.id} className="text-xs font-bold cursor-pointer italic text-foreground group-hover:text-primary">{extra.label}</Label>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-4 sticky bottom-0 bg-card pb-4 border-t border-border">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1 font-bold h-12 uppercase tracking-tighter border-border text-foreground hover:bg-muted">Cancelar</Button>
            <Button type="submit" disabled={isSaving || isUploading} className="flex-1 font-bold h-12 shadow-lg bg-primary text-primary-foreground hover:bg-primary/90 uppercase tracking-tighter transition-all">
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : "Salvar Alterações"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}