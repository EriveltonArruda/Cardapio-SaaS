'use client';

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Clock,
  Loader2,
  Save,
  Store as StoreIcon,
  Upload,
  MapPin,
  Palette,
  CreditCard,
  Smartphone,
  Banknote
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useStore } from "@/contexts/StoreContext";
import { PlanGuard } from "./PlanGuard";
import { StoreSettings } from "@/types"; // ✅ Certifique-se de que a interface no index.ts está atualizada

export function SettingsTab() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { store } = useStore();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const [settings, setSettings] = useState<StoreSettings>({
    store_name: "",
    phone: "",
    address: "",
    opening_hours_week: "",
    opening_hours_weekend: "",
    opening_hours_sunday: "",
    logo_url: "",
    primary_color: "#1caf08",
    secondary_color: "#F1F5F9",
    text_color: "#111111",
    is_open: true,
    accept_pix: true,
    accept_card_credit: true,
    accept_card_debt: true,
    accept_cash: true,
    pix_key: "",
    store_id: ""
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

      // ✅ CORREÇÃO: Uso de unknown para resolver o erro ts(2352)
      if (data) {
        setSettings(data as unknown as StoreSettings);
      }
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
      const payload: StoreSettings = {
        ...settings,
        store_id: store.id,
        store_name: settings.store_name || store.name,
        updated_at: new Date().toISOString()
      };

      // ✅ Upsert com cast para any para flexibilidade de colunas
      const { error } = await (supabase.from('store_settings') as any)
        .upsert(payload, { onConflict: 'store_id' });

      if (error) throw error;

      // Aplicar cores no CSS root se estiver no navegador
      if (typeof document !== 'undefined') {
        const root = document.documentElement;
        root.style.setProperty('--primary', settings.primary_color);
        root.style.setProperty('--primary-foreground', settings.text_color);
      }

      toast({ title: "Configurações salvas com sucesso! 🚀" });
      loadSettings();
    } catch (err: any) {
      toast({ title: "Erro ao salvar", description: err.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = (field: keyof StoreSettings, value: any) => {
    setSettings((prev) => ({ ...prev, [field]: value }));
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

  if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="animate-spin text-primary" /></div>;

  const switchContrastClass = "data-[state=unchecked]:bg-slate-300 dark:data-[state=unchecked]:bg-slate-700 cursor-pointer";

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-10 px-4 transition-colors">
      <div className="flex justify-between items-center bg-card/80 backdrop-blur border border-border p-4 rounded-xl shadow-md sticky top-0 z-10">
        <h2 className="text-xl font-black uppercase tracking-tighter text-foreground">Ajustes da Loja</h2>
        <Button onClick={handleSave} disabled={isSaving || isUploading} className="font-black uppercase tracking-widest bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer transition-all active:scale-95">
          {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Salvar Tudo
        </Button>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="rounded-2xl border border-border shadow-sm bg-card">
          <CardHeader><CardTitle className="text-sm uppercase font-black text-muted-foreground flex items-center gap-2"><StoreIcon className="w-4 h-4" /> Marca</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div onClick={() => fileInputRef.current?.click()} className="w-20 h-20 border-2 border-dashed border-primary/30 rounded-2xl flex items-center justify-center cursor-pointer bg-background overflow-hidden shadow-inner mx-auto group hover:border-primary transition-all">
              {settings.logo_url ? <img src={settings.logo_url} className="w-full h-full object-contain p-2" alt="Logo" /> : <Upload className="text-primary/40 group-hover:text-primary" />}
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] font-black uppercase text-muted-foreground">Nome Comercial</Label>
              <Input value={settings.store_name || ""} onChange={(e) => handleChange('store_name', e.target.value)} className="font-bold rounded-xl bg-background border-border text-foreground" />
            </div>
          </CardContent>
        </Card>

        <PlanGuard featureName="Identidade Visual">
          <Card className="rounded-2xl border border-border shadow-sm bg-card h-full">
            <CardHeader><CardTitle className="text-sm uppercase font-black text-muted-foreground flex items-center gap-2"><Palette className="w-4 h-4" /> Cores do Sistema</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg border border-border" style={{ backgroundColor: settings.primary_color }} />
                <div className="flex-1 space-y-1">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground">Cor Primária</Label>
                  <Input type="color" value={settings.primary_color || "#1caf08"} onChange={(e) => handleChange('primary_color', e.target.value)} className="h-10 p-1 cursor-pointer bg-background border-border" />
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg border border-border" style={{ backgroundColor: settings.text_color }} />
                <div className="flex-1 space-y-1">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground">Cor do Texto</Label>
                  <Input type="color" value={settings.text_color || "#111111"} onChange={(e) => handleChange('text_color', e.target.value)} className="h-10 p-1 cursor-pointer bg-background border-border" />
                </div>
              </div>
            </CardContent>
          </Card>
        </PlanGuard>
      </div>

      <Card className="rounded-2xl border border-border shadow-sm bg-card">
        <CardHeader>
          <CardTitle className="text-sm uppercase font-black text-muted-foreground flex items-center gap-2">
            <CreditCard className="w-4 h-4" /> Métodos de Pagamento
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="flex items-center justify-between p-3 rounded-xl bg-muted/20 border border-border/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <Smartphone className="w-5 h-5" />
                </div>
                <Label className="font-bold cursor-pointer">Aceitar PIX</Label>
              </div>
              <Switch checked={settings.accept_pix} onCheckedChange={(c) => handleChange('accept_pix', c)} className={switchContrastClass} />
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-muted/20 border border-border/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <Banknote className="w-5 h-5" />
                </div>
                <Label className="font-bold cursor-pointer">Dinheiro</Label>
              </div>
              <Switch checked={settings.accept_cash} onCheckedChange={(c) => handleChange('accept_cash', c)} className={switchContrastClass} />
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-muted/20 border border-border/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <CreditCard className="w-5 h-5" />
                </div>
                <Label className="font-bold cursor-pointer">Cartão de Crédito</Label>
              </div>
              <Switch checked={settings.accept_card_credit} onCheckedChange={(c) => handleChange('accept_card_credit', c)} className={switchContrastClass} />
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-muted/20 border border-border/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <CreditCard className="w-5 h-5" />
                </div>
                <Label className="font-bold cursor-pointer">Cartão de Débito</Label>
              </div>
              <Switch checked={settings.accept_card_debt} onCheckedChange={(c) => handleChange('accept_card_debt', c)} className={switchContrastClass} />
            </div>
          </div>

          <PlanGuard featureName="Configuração de Chave PIX">
            {settings.accept_pix && (
              <div className="space-y-1.5 animate-in slide-in-from-top-2">
                <Label className="text-[10px] font-black uppercase text-primary">Chave PIX</Label>
                <Input
                  placeholder="Insira sua chave"
                  value={settings.pix_key || ""}
                  onChange={(e) => handleChange('pix_key', e.target.value)}
                  className="rounded-xl font-bold bg-background border-primary/20 text-foreground"
                />
              </div>
            )}
          </PlanGuard>
        </CardContent>
      </Card>

      <Card className="rounded-2xl border border-border shadow-sm bg-card">
        <CardHeader><CardTitle className="text-sm uppercase font-black text-muted-foreground flex items-center gap-2"><MapPin className="w-4 h-4" /> Localização</CardTitle></CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label className="text-[10px] font-black uppercase text-muted-foreground">WhatsApp</Label>
            <Input value={settings.phone || ""} onChange={(e) => handleChange('phone', e.target.value)} className="rounded-xl font-bold bg-background border-border text-foreground" />
          </div>
          <div className="space-y-1">
            <Label className="text-[10px] font-black uppercase text-muted-foreground">Endereço</Label>
            <Input value={settings.address || ""} onChange={(e) => handleChange('address', e.target.value)} className="rounded-xl font-bold bg-background border-border text-foreground" />
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl border border-border shadow-sm bg-card">
        <CardHeader><CardTitle className="text-sm uppercase font-black text-muted-foreground flex items-center gap-2"><Clock className="w-4 h-4" /> Horários</CardTitle></CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-3">
          <div className="space-y-1">
            <Label className="text-[10px] font-black uppercase text-muted-foreground">Segunda a Quinta</Label>
            <Input value={settings.opening_hours_week || ""} onChange={(e) => handleChange('opening_hours_week', e.target.value)} className="rounded-xl font-bold bg-background border-border text-foreground" />
          </div>
          <div className="space-y-1">
            <Label className="text-[10px] font-black uppercase text-muted-foreground">Sexta e Sábado</Label>
            <Input value={settings.opening_hours_weekend || ""} onChange={(e) => handleChange('opening_hours_weekend', e.target.value)} className="rounded-xl font-bold bg-background border-border text-foreground" />
          </div>
          <div className="space-y-1">
            <Label className="text-[10px] font-black uppercase text-muted-foreground">Domingo</Label>
            <Input value={settings.opening_hours_sunday || ""} onChange={(e) => handleChange('opening_hours_sunday', e.target.value)} className="rounded-xl font-bold bg-background border-border text-foreground" />
          </div>
        </CardContent>
      </Card>

      <div className="p-4 border border-border rounded-xl bg-muted/20 flex items-center justify-between">
        <div className="space-y-0.5">
          <Label className="text-sm font-bold text-foreground">Status do Cardápio</Label>
          <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">
            {settings.is_open ? "Sua loja está aberta" : "Sua loja está fechada"}
          </p>
        </div>
        <Switch checked={settings.is_open} onCheckedChange={(checked) => handleChange('is_open', checked)} className={switchContrastClass} />
      </div>
    </div>
  );
}