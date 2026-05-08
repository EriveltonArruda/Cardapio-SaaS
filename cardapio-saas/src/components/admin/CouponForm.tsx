'use client';

import { useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useStore } from "@/contexts/StoreContext";
import { Loader2, X, Ticket } from "lucide-react";

export function CouponForm({ onClose }: { onClose: () => void }) {
  const { store } = useStore();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    code: "",
    type: "percentage",
    value: "",
    min_purchase: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!store?.id) return;

    if (!formData.code || !formData.value) {
      toast({ title: "Preencha os campos obrigatórios", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    try {
      // ✅ Tratamento de dados seguro antes de enviar
      const payload = {
        store_id: store.id,
        code: formData.code.toUpperCase().trim().replace(/\s+/g, ''), // Remove espaços acidentais
        type: formData.type,
        value: parseFloat(formData.value) || 0,
        min_purchase: parseFloat(formData.min_purchase) || 0,
        is_active: true
      };

      // ✅ Cast seguro para evitar erro de tabela não mapeada localmente
      const { error } = await (supabase.from('coupons' as any) as any).insert([payload]);

      if (error) throw error;

      toast({ title: "Cupom criado com sucesso! 🎟️" });
      onClose();
    } catch (error: any) {
      toast({
        title: "Erro ao criar",
        description: error.message?.includes("duplicate") ? "Este código já existe!" : error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-6 bg-card text-foreground transition-colors">
      <div className="flex justify-between items-center border-b border-border pb-4">
        <div className="flex items-center gap-2">
          <Ticket className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-black uppercase tracking-tighter">Novo Cupom</h3>
        </div>
        <Button type="button" variant="ghost" size="icon" onClick={onClose} className="hover:bg-muted transition-colors">
          <X className="w-5 h-5" />
        </Button>
      </div>

      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label className="text-[10px] font-black uppercase text-muted-foreground">Código do Cupom *</Label>
          <Input
            placeholder="EX: PRIMEIRACOMPRA"
            value={formData.code}
            onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
            className="bg-background border-border font-bold h-12 rounded-xl text-foreground uppercase"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-[10px] font-black uppercase text-muted-foreground">Tipo *</Label>
            <Select value={formData.type} onValueChange={v => setFormData({ ...formData, type: v })}>
              <SelectTrigger className="bg-background border-border h-12 rounded-xl text-foreground font-bold">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-card border-border z-[120]">
                <SelectItem value="percentage" className="font-medium cursor-pointer">Porcentagem (%)</SelectItem>
                <SelectItem value="fixed" className="font-medium cursor-pointer">Valor Fixo (R$)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-[10px] font-black uppercase text-muted-foreground">Desconto *</Label>
            <Input
              type="number"
              step="0.01"
              placeholder={formData.type === 'percentage' ? "Ex: 10" : "Ex: 5.00"}
              value={formData.value}
              onChange={e => setFormData({ ...formData, value: e.target.value })}
              className="bg-background border-border font-bold h-12 rounded-xl text-foreground"
              required
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-[10px] font-black uppercase text-muted-foreground">Pedido Mínimo (Opcional)</Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-bold">R$</span>
            <Input
              type="number"
              step="0.01"
              placeholder="0.00"
              value={formData.min_purchase}
              onChange={e => setFormData({ ...formData, min_purchase: e.target.value })}
              className="pl-10 bg-background border-border font-bold h-12 rounded-xl text-foreground"
            />
          </div>
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <Button type="button" variant="ghost" onClick={onClose} className="flex-1 font-black uppercase text-xs h-12 rounded-xl text-foreground hover:bg-muted">
          Cancelar
        </Button>
        <Button type="submit" className="flex-1 bg-primary text-primary-foreground font-black uppercase text-xs h-12 rounded-xl shadow-lg hover:bg-primary/90" disabled={isLoading}>
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Criar Cupom"}
        </Button>
      </div>
    </form>
  );
}