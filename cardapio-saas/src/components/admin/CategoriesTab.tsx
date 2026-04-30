'use client';

import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Plus, Pencil, Trash2, Loader2, Upload, AlertTriangle, X
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Importações SaaS
import { supabase } from "@/lib/supabase/client";
import { useStore } from "@/contexts/StoreContext";

interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  is_active: boolean | null;
  store_id: string;
}

export const CategoriesTab = () => {
  const { toast } = useToast();
  const { store } = useStore(); // Identidade da loja atual
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);

  const [formName, setFormName] = useState("");
  const [formImage, setFormImage] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchCategories = async () => {
    if (!store?.id) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('store_id', store.id) // <--- Segurança SaaS
        .order('name', { ascending: true });

      if (error) throw error;
      setCategories(data || []);
    } catch (err: any) {
      toast({ title: "Erro ao carregar", description: err.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, [store?.id]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !store?.id) return;

    setIsUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${store.slug}/${Date.now()}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from('categories')
        .upload(fileName, file);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('categories')
        .getPublicUrl(fileName);

      setFormImage(publicUrl);
      toast({ title: "Imagem enviada!" });

    } catch (error: any) {
      toast({ title: "Erro no Upload", description: error.message, variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !store?.id) return;

    setIsSaving(true);
    try {
      const slug = formName
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\s+/g, "-");

      const categoryData = {
        store_id: store.id, // <--- Obrigatório SaaS
        name: formName.trim(),
        slug,
        icon: formImage || null,
        is_active: true,
      };

      if (editingCategory) {
        const { error } = await supabase
          .from('categories')
          .update(categoryData)
          .eq('id', editingCategory.id)
          .eq('store_id', store.id); // Trava de segurança
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('categories')
          .insert([categoryData]);
        if (error) throw error;
      }

      toast({ title: editingCategory ? "Categoria atualizada!" : "Categoria criada!" });
      handleCloseForm();
      fetchCategories();

    } catch (err: any) {
      toast({ title: "Erro ao salvar", description: err.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!store?.id) return;

    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id)
        .eq('store_id', store.id); // Trava de segurança

      if (error) {
        if (error.code === '23503') {
          throw new Error("Existem produtos vinculados a esta categoria. Remova-os primeiro.");
        }
        throw error;
      }

      toast({ title: "Categoria removida!" });
      setDeletingCategory(null);
      fetchCategories();
    } catch (err: any) {
      toast({
        title: "Erro ao excluir",
        description: err.message,
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingCategory(null);
    setFormName("");
    setFormImage("");
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold tracking-tight">Categorias <span className="text-muted-foreground font-normal text-sm">({categories.length})</span></h2>
        <Button onClick={() => setShowForm(true)} className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold">
          <Plus className="w-4 h-4 mr-2" /> Nova Categoria
        </Button>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-xs font-mono uppercase">Organizando prateleiras...</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {categories.map((category) => (
            <div key={category.id} className="relative aspect-square rounded-xl overflow-hidden shadow-md border group bg-muted">
              <img
                src={category.icon || '/placeholder.svg'}
                className="w-full h-full object-cover transition-transform group-hover:scale-105"
                alt={category.name}
              />
              <div className="absolute bottom-0 left-0 right-0 bg-black/80 backdrop-blur-sm py-2 px-3">
                <span className="text-white text-[10px] font-black uppercase tracking-wider block truncate">{category.name}</span>
              </div>

              <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button size="icon" variant="secondary" className="h-8 w-8 shadow-lg" onClick={() => {
                  setEditingCategory(category);
                  setFormName(category.name);
                  setFormImage(category.icon || "");
                  setShowForm(true);
                }}>
                  <Pencil className="w-3.5 h-3.5 text-primary" />
                </Button>
                <Button size="icon" variant="secondary" className="h-8 w-8 shadow-lg hover:bg-destructive hover:text-white" onClick={() => setDeletingCategory(category)}>
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* FORMULÁRIO MODAL */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-background rounded-2xl p-6 w-full max-w-md border shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold mb-4 uppercase tracking-tighter">{editingCategory ? "Editar" : "Nova"} Categoria</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase">Nome da Categoria</Label>
                <Input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="Ex: Cervejas, Vinhos, Petiscos..." className="h-12" required />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase">Imagem / Ícone</Label>
                <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer hover:bg-accent transition-colors min-h-35">
                  {isUploading ? (
                    <Loader2 className="animate-spin h-8 w-8 text-primary" />
                  ) : formImage ? (
                    <div className="relative">
                      <img src={formImage} className="h-28 w-28 object-cover rounded-lg shadow-sm" alt="Preview" />
                      <button type="button" onClick={(e) => { e.stopPropagation(); setFormImage(""); }} className="absolute -top-2 -right-2 bg-destructive text-white rounded-full p-1"><X className="w-3 h-3" /></button>
                    </div>
                  ) : (
                    <>
                      <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                      <span className="text-[10px] font-bold uppercase text-muted-foreground text-center">Tamanho recomendado: 400x400px</span>
                    </>
                  )}
                  <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" className="hidden" />
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <Button type="button" variant="ghost" onClick={handleCloseForm} className="flex-1 font-bold uppercase tracking-tighter">Cancelar</Button>
                <Button type="submit" disabled={isSaving || isUploading} className="flex-1 font-bold uppercase tracking-tighter shadow-lg">
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirmar"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE EXCLUSÃO */}
      {deletingCategory && (
        <div className="fixed inset-0 z-110 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-background rounded-2xl p-6 w-full max-w-sm border shadow-2xl animate-in fade-in duration-200">
            <h3 className="text-lg font-bold mb-2 flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-destructive" /> Excluir?</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Deseja apagar <strong>"{deletingCategory.name}"</strong>? Certifique-se de que não existam produtos nesta categoria antes.
            </p>
            <div className="flex gap-3">
              <Button variant="ghost" className="flex-1 font-bold" onClick={() => setDeletingCategory(null)}>Voltar</Button>
              <Button variant="destructive" className="flex-1 font-bold shadow-md" onClick={() => handleDelete(deletingCategory.id)} disabled={isDeleting}>
                {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Apagar"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};