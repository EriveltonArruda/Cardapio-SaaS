'use client';

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Phone, Clock, Loader2, Save, Store, Upload, MapPin } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useStore } from "@/contexts/StoreContext";

export function SettingsTab() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const [settings, setSettings] = useState<any>({
    id: null,
    store_name: "",
    phone: "",
    address: "",
    opening_hours_week: "",
    opening_hours_weekend: "",
    opening_hours_sunday: "",
    logo_url: "",
    is_open: true
  });

  const { store } = useStore();

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setIsLoading(true);
    try {
      if (!store?.id) return;
      const response = await supabase
        .from('store_settings')
        .select('*')
        .eq('store_id', store.id)
        .limit(1)
        .single();
        
      const data = response.data;
      if (data) {
        setSettings(data);
      }
    } catch (error: any) {
      console.error("Erro ao buscar configurações:", error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!settings.id) {
      toast({ title: "Erro: ID da loja não carregado.", variant: "destructive" });
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        store_name: settings.store_name,
        phone: settings.phone,
        address: settings.address,
        opening_hours_week: settings.opening_hours_week,
        opening_hours_weekend: settings.opening_hours_weekend,
        opening_hours_sunday: settings.opening_hours_sunday,
        logo_url: settings.logo_url,
        is_open: settings.is_open
      };

      const response = await supabase
        .from('store_settings')
        .update(payload)
        .eq('store_id', store?.id)
        .select();

      const updatedData = response.data;

      if (!updatedData || updatedData.length === 0) {
        throw new Error("O banco recebeu o comando, mas não permitiu a alteração (Erro de RLS).");
      }

      toast({ title: "Configurações salvas com sucesso! 🚀" });
      loadSettings();
    } catch (err: any) {
      toast({ title: "Erro ao salvar", description: err.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = (field: string, value: any) => {
    setSettings((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `logo-${Date.now()}.${fileExt}`;
      
      const { error } = await supabase.storage
        .from('store')
        .upload(fileName, file);

      if (error) throw new Error("Falha no upload");

      const { data: publicUrlData } = supabase.storage
        .from('store')
        .getPublicUrl(fileName);
        
      const publicUrl = publicUrlData.publicUrl;
      handleChange('logo_url', publicUrl);
      toast({ title: "Logo carregada! Lembre-se de salvar." });
    } catch (error: any) {
      toast({ title: "Erro no upload", variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

  if (isLoading) {
    return <div className="flex justify-center py-12"><Loader2 className="animate-spin" /></div>;
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-10">
      <div className="flex justify-between items-center bg-card p-4 rounded-xl border shadow-sm">
        <h2 className="text-xl font-black uppercase tracking-tighter">Configurações</h2>
        <Button onClick={handleSave} disabled={isSaving || isUploading} className="font-black uppercase tracking-widest shadow-md">
          {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Salvar Tudo
        </Button>
      </div>

      {/* MARCA */}
      <Card className="rounded-2xl border-none shadow-sm bg-slate-50/50">
        <CardHeader><CardTitle className="text-sm uppercase font-black text-slate-500 flex items-center gap-2"><Store className="w-4 h-4" /> Marca</CardTitle></CardHeader>
        <CardContent className="flex flex-col md:flex-row gap-6 items-center">
          <div onClick={() => fileInputRef.current?.click()} className="w-24 h-24 border-2 border-dashed border-primary/30 rounded-full flex items-center justify-center cursor-pointer bg-white overflow-hidden relative shadow-inner">
            {settings.logo_url ? <img src={settings.logo_url} className="w-full h-full object-contain p-2" alt="Logo" /> : <Upload className="text-primary/40" />}
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
          </div>
          <div className="space-y-2 w-full">
            <Label className="text-[11px] font-black uppercase text-slate-400 ml-1">Nome Comercial</Label>
            <Input value={settings.store_name || ""} onChange={(e) => handleChange('store_name', e.target.value)} className="font-bold rounded-xl h-12" />
          </div>
        </CardContent>
      </Card>

      {/* CONTATO E LOCALIZAÇÃO (RESTAURADO) */}
      <Card className="rounded-2xl border-none shadow-sm">
        <CardHeader><CardTitle className="text-sm uppercase font-black text-slate-500 flex items-center gap-2"><MapPin className="w-4 h-4" /> Contato e Localização</CardTitle></CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label className="text-[11px] font-black uppercase text-slate-400 ml-1">WhatsApp da Loja</Label>
            <Input
              value={settings.phone || ""}
              onChange={(e) => handleChange('phone', e.target.value)}
              className="rounded-xl font-bold"
              placeholder="Ex: (81) 99999-9999"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-[11px] font-black uppercase text-slate-400 ml-1">Endereço Completo</Label>
            <Input
              value={settings.address || ""}
              onChange={(e) => handleChange('address', e.target.value)}
              className="rounded-xl font-bold"
              placeholder="Rua, Número, Bairro - Gravatá"
            />
          </div>
        </CardContent>
      </Card>

      {/* ATENDIMENTO */}
      <Card className="rounded-2xl border-none shadow-sm">
        <CardHeader><CardTitle className="text-sm uppercase font-black text-slate-500 flex items-center gap-2"><Clock className="w-4 h-4" /> Horários</CardTitle></CardHeader>
        <CardContent className="space-y-6">
          <div className="grid md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label className="text-[11px] font-black uppercase text-slate-400 ml-1">Segunda à Quinta</Label>
              <Input value={settings.opening_hours_week || ""} onChange={(e) => handleChange('opening_hours_week', e.target.value)} className="rounded-xl font-bold" />
            </div>
            <div className="space-y-2">
              <Label className="text-[11px] font-black uppercase text-slate-400 ml-1">Sexta e Sábado</Label>
              <Input value={settings.opening_hours_weekend || ""} onChange={(e) => handleChange('opening_hours_weekend', e.target.value)} className="rounded-xl font-bold" />
            </div>
            <div className="space-y-2">
              <Label className="text-[11px] font-black uppercase text-slate-400 ml-1">Domingo</Label>
              <Input value={settings.opening_hours_sunday || ""} onChange={(e) => handleChange('opening_hours_sunday', e.target.value)} className="rounded-xl font-bold" />
            </div>
          </div>

          <div className={`flex items-center justify-between border-2 p-4 rounded-2xl transition-all ${settings.is_open ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
            <div className="space-y-1">
              <Label className="text-sm font-black uppercase tracking-tight">Status da Operação</Label>
              <p className={`text-xs font-bold ${settings.is_open ? 'text-green-600' : 'text-red-600'}`}>
                {settings.is_open ? "● LOJA ABERTA NO SITE" : "○ LOJA FECHADA NO SITE"}
              </p>
            </div>
            <Switch checked={settings.is_open || false} onCheckedChange={(checked: boolean) => handleChange('is_open', checked)} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}