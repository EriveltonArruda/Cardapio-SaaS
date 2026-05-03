'use client';

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, Loader2, Save, Store, Upload, MapPin, Palette } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useStore } from "@/contexts/StoreContext";

export function SettingsTab() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { store } = useStore();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const [settings, setSettings] = useState<any>({
    store_name: "",
    phone: "",
    address: "",
    opening_hours_week: "",
    opening_hours_weekend: "",
    opening_hours_sunday: "",
    logo_url: "",
    primary_color: "#FFB800",
    secondary_color: "#F1F5F9",
    text_color: "#111111",
    is_open: true
  });

  useEffect(() => {
    if (store?.id) {
      loadSettings();
    }
  }, [store?.id]);

  const loadSettings = async () => {
    if (!store?.id) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('store_settings')
        .select('*')
        .eq('store_id', store.id)
        .maybeSingle();

      if (error) throw error;
      if (data) setSettings(data);
    } catch (error: any) {
      console.error("Erro ao buscar configurações:", error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!store?.id) return;
    setIsSaving(true);
    try {
      const payload = {
        store_id: store.id,
        store_name: settings.store_name || store.name,
        phone: settings.phone,
        address: settings.address,
        opening_hours_week: settings.opening_hours_week,
        opening_hours_weekend: settings.opening_hours_weekend,
        opening_hours_sunday: settings.opening_hours_sunday,
        logo_url: settings.logo_url,
        primary_color: settings.primary_color,
        secondary_color: settings.secondary_color,
        text_color: settings.text_color,
        is_open: settings.is_open,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('store_settings')
        .upsert(payload as any, { onConflict: 'store_id' }); // Adicione o "as any"

      if (error) throw error;

      // Atualização imediata no painel Admin (CSS Global)
      const root = document.documentElement;
      root.style.setProperty('--primary', settings.primary_color);
      root.style.setProperty('--primary-foreground', settings.text_color);

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
    if (!file || !store?.id) return;
    setIsUploading(true);

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${store.id}/logo-${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from('store')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage.from('store').getPublicUrl(fileName);
      handleChange('logo_url', publicUrlData.publicUrl);
      toast({ title: "Logo carregada!" });
    } catch (error: any) {
      toast({ title: "Erro no upload", variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

  if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-10 px-4">
      <div className="flex justify-between items-center bg-card p-4 rounded-xl border shadow-sm sticky top-0 z-10">
        <h2 className="text-xl font-black uppercase tracking-tighter">Ajustes da Loja</h2>
        <Button onClick={handleSave} disabled={isSaving || isUploading} className="font-black uppercase tracking-widest">
          {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Salvar Tudo
        </Button>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="rounded-2xl border-none shadow-sm bg-slate-50/50">
          <CardHeader><CardTitle className="text-sm uppercase font-black text-slate-500 flex items-center gap-2"><Store className="w-4 h-4" /> Marca</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div onClick={() => fileInputRef.current?.click()} className="w-20 h-20 border-2 border-dashed border-primary/30 rounded-2xl flex items-center justify-center cursor-pointer bg-white overflow-hidden shadow-inner mx-auto">
              {settings.logo_url ? <img src={settings.logo_url} className="w-full h-full object-contain p-2" alt="Logo" /> : <Upload className="text-primary/40" />}
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] font-black uppercase text-slate-400">Nome Comercial</Label>
              <Input value={settings.store_name || ""} onChange={(e) => handleChange('store_name', e.target.value)} className="font-bold rounded-xl" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-none shadow-sm bg-slate-50/50">
          <CardHeader><CardTitle className="text-sm uppercase font-black text-slate-500 flex items-center gap-2"><Palette className="w-4 h-4" /> Cores do Sistema</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg border shadow-sm" style={{ backgroundColor: settings.primary_color }} />
              <div className="flex-1 space-y-1">
                <Label className="text-[10px] font-black uppercase text-slate-400">Cor Primária</Label>
                <Input type="color" value={settings.primary_color || "#FFB800"} onChange={(e) => handleChange('primary_color', e.target.value)} className="h-10 p-1 cursor-pointer" />
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg border shadow-sm" style={{ backgroundColor: settings.text_color }} />
              <div className="flex-1 space-y-1">
                <Label className="text-[10px] font-black uppercase text-slate-400">Cor do Texto</Label>
                <Input type="color" value={settings.text_color || "#111111"} onChange={(e) => handleChange('text_color', e.target.value)} className="h-10 p-1 cursor-pointer" />
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg border shadow-sm" style={{ backgroundColor: settings.secondary_color }} />
              <div className="flex-1 space-y-1">
                <Label className="text-[10px] font-black uppercase text-slate-400">Fundo Secundário</Label>
                <Input type="color" value={settings.secondary_color || "#F1F5F9"} onChange={(e) => handleChange('secondary_color', e.target.value)} className="h-10 p-1 cursor-pointer" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-2xl border-none shadow-sm">
        <CardHeader><CardTitle className="text-sm uppercase font-black text-slate-500 flex items-center gap-2"><MapPin className="w-4 h-4" /> Localização</CardTitle></CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label className="text-[10px] font-black uppercase text-slate-400">WhatsApp</Label>
            <Input value={settings.phone || ""} onChange={(e) => handleChange('phone', e.target.value)} className="rounded-xl font-bold" />
          </div>
          <div className="space-y-1">
            <Label className="text-[10px] font-black uppercase text-slate-400">Endereço</Label>
            <Input value={settings.address || ""} onChange={(e) => handleChange('address', e.target.value)} className="rounded-xl font-bold" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}