"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/contexts/CartContext";
import { Info, Loader2, MapPin, User, Phone as PhoneIcon, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase/client";
import { useStore } from "@/contexts/StoreContext";

const formatPrice = (value: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
};

export function CheckoutForm() {
  const { items, getTotal, clearCart } = useCart();
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    street: "",
    number: "",
    neighborhood: "",
    landmark: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const { store } = useStore();

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = "Nome é obrigatório";
    if (!formData.phone.trim()) newErrors.phone = "WhatsApp é obrigatório";
    if (!formData.street.trim()) newErrors.street = "A rua é obrigatória";
    if (!formData.number.trim()) newErrors.number = "O número é obrigatório";
    if (!formData.neighborhood.trim()) newErrors.neighborhood = "O bairro é obrigatório";
    if (!formData.landmark.trim()) newErrors.landmark = "Ponto de referência é obrigatório";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const numbers = e.target.value.replace(/\D/g, "");
    let formatted = numbers;
    if (numbers.length <= 2) formatted = `(${numbers}`;
    else if (numbers.length <= 7) formatted = `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    else formatted = `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;

    setFormData((prev) => ({ ...prev, phone: formatted }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm() || items.length === 0) return;

    if (!store?.id) {
      toast({ title: "Erro: Loja não identificada", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);

    try {
      const total = getTotal();

      // 1. SALVAR NO BANCO DE DADOS (SUPABASE)
      const orderPayload = {
        store_id: store.id,
        customer_name: formData.name,
        customer_phone: formData.phone,
        address_street: formData.street,
        address_number: formData.number,
        address_neighborhood: formData.neighborhood,
        address_landmark: formData.landmark,
        items: items.map(item => ({
          name: item.product.name,
          quantity: item.quantity,
          price: item.product.price,
          observations: item.observations || ""
        })),
        total_amount: total,
        status: 'pendente'
      };

      const saveRes = await supabase.from('orders').insert(orderPayload).select();

      if (saveRes.error) throw new Error("Erro ao salvar pedido no banco");

      const savedData = saveRes.data;
      const orderId = savedData[0]?.id?.split('-')[0].toUpperCase() || "NEW";

      // 2. WHATSAPP DINÂMICO VIA BUSCA DE STORE_SETTINGS
      const settingsRes = await supabase
        .from('store_settings')
        .select('phone')
        .eq('store_id', store.id)
        .single();

      const rawPhone = settingsRes.data?.phone?.replace(/\D/g, '') || store.whatsapp_number?.replace(/\D/g, '') || "81979158040";
      const storePhone = rawPhone.startsWith('55') ? rawPhone : `55${rawPhone}`;
      const storeName = store.name || "Loja";

      // 3. MONTAGEM DA MENSAGEM DO WHATSAPP (TEXTO LIMPO)
      let message = `*PEDIDO #${orderId} - ${storeName.toUpperCase()}*\n`;
      message += `------------------------------------------\n\n`;

      message += `*ITENS DO PEDIDO:*\n`;
      items.forEach((item) => {
        message += `- ${item.quantity}x ${item.product.name}\n`;
        if (item.observations) message += `  _Obs: ${item.observations}_\n`;
        message += `  Subtotal: ${formatPrice(item.product.price * item.quantity)}\n\n`;
      });

      message += `------------------------------------------\n`;
      message += `*TOTAL: ${formatPrice(total)}*\n`;
      message += `------------------------------------------\n\n`;

      message += `*DADOS DE ENTREGA:*\n`;
      message += `*Cliente:* ${formData.name}\n`;
      message += `*Contato:* ${formData.phone}\n`;
      message += `*Endereço:* ${formData.street}, ${formData.number}\n`;
      message += `*Bairro:* ${formData.neighborhood}\n`;
      message += `*Referência:* ${formData.landmark}\n`;

      message += `\n------------------------------------------\n`;
      message += `*PAGAMENTO:* _A combinar via WhatsApp._\n\n`;
      message += `_Pedido gerado pelo Cardápio Digital Expresso Bebidas_`;

      // 4. CODIFICAÇÃO E ENVIO
      const encodedMessage = encodeURIComponent(message);
      const link = `https://api.whatsapp.com/send?phone=${storePhone}&text=${encodedMessage}`;

      toast({ title: "Pedido registrado com sucesso!" });
      clearCart();

      setTimeout(() => {
        window.open(link, '_blank');
        router.push(`/${store.slug}`);
      }, 1000);

    } catch (error: any) {
      console.error("Erro fatal no envio:", error);
      toast({ title: "Erro ao registrar pedido", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isValid = formData.name.trim() && formData.phone.trim() && formData.street.trim() &&
    formData.number.trim() && formData.neighborhood.trim() &&
    formData.landmark.trim() && items.length > 0;

  return (
    <form onSubmit={handleSubmit} className="p-4 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
      <div className="text-center mb-8">
        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
          <MapPin className="text-primary w-6 h-6" />
        </div>
        <h2 className="text-xl font-black uppercase tracking-tighter text-black">Entrega em Gravatá</h2>
        <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mt-1 text-black">
          Preencha os dados para finalizar
        </p>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4">
          <div className="space-y-1.5">
            <Label className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-500 ml-1">
              <User className="w-3 h-3 text-black" /> Seu Nome
            </Label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="Ex: José Santos"
              className={`w-full p-4 border-2 rounded-2xl bg-slate-50 font-bold focus:border-primary transition-all outline-none text-black ${errors.name ? "border-destructive" : "border-transparent"}`}
            />
          </div>

          <div className="space-y-1.5">
            <Label className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-500 ml-1">
              <PhoneIcon className="w-3 h-3 text-black" /> Seu WhatsApp
            </Label>
            <input
              type="tel"
              value={formData.phone}
              onChange={handlePhoneChange}
              placeholder="(81) 99999-9999"
              className={`w-full p-4 border-2 rounded-2xl bg-slate-50 font-bold focus:border-primary transition-all outline-none text-black ${errors.phone ? "border-destructive" : "border-transparent"}`}
              maxLength={16}
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-2 space-y-1.5">
            <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Rua</Label>
            <input
              type="text"
              value={formData.street}
              onChange={(e) => setFormData((prev) => ({ ...prev, street: e.target.value }))}
              placeholder="Nome da rua"
              className={`w-full p-4 border-2 rounded-2xl bg-slate-50 font-bold focus:border-primary transition-all outline-none text-black ${errors.street ? "border-destructive" : "border-transparent"}`}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Nº</Label>
            <input
              type="text"
              value={formData.number}
              onChange={(e) => setFormData((prev) => ({ ...prev, number: e.target.value }))}
              placeholder="123"
              className={`w-full p-4 border-2 rounded-2xl bg-slate-50 font-bold focus:border-primary transition-all outline-none text-black ${errors.number ? "border-destructive" : "border-transparent"}`}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Bairro</Label>
          <input
            type="text"
            value={formData.neighborhood}
            onChange={(e) => setFormData((prev) => ({ ...prev, neighborhood: e.target.value }))}
            placeholder="Ex: Centro, Prado..."
            className={`w-full p-4 border-2 rounded-2xl bg-slate-50 font-bold focus:border-primary transition-all outline-none text-black ${errors.neighborhood ? "border-destructive" : "border-transparent"}`}
          />
        </div>

        <div className="space-y-1.5">
          <Label className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-400 ml-1">
            <Search className="w-3 h-3" /> Referência
          </Label>
          <input
            type="text"
            value={formData.landmark}
            onChange={(e) => setFormData((prev) => ({ ...prev, landmark: e.target.value }))}
            placeholder="Ex: Próximo ao mercado..."
            className={`w-full p-4 border-2 rounded-2xl bg-slate-50 font-bold focus:border-primary transition-all outline-none text-black ${errors.landmark ? "border-destructive" : "border-transparent"}`}
          />
        </div>
      </div>

      <div className="bg-amber-50 border-2 border-amber-100 rounded-3xl p-5 flex items-start gap-3">
        <Info className="w-5 h-5 text-amber-600 shrink-0" />
        <p className="text-[11px] leading-snug font-bold text-black">
          A entrega e o pagamento serão combinados pelo WhatsApp.
        </p>
      </div>

      <div className="pt-6 border-t-2 border-dashed border-slate-100">
        <div className="flex items-center justify-between mb-6">
          <span className="text-sm font-black uppercase text-slate-400 tracking-widest">Total</span>
          <span className="text-2xl font-black text-primary tracking-tighter">{formatPrice(getTotal())}</span>
        </div>

        <button
          type="submit"
          disabled={!isValid || isSubmitting}
          className="w-full bg-primary text-black h-16 rounded-[24px] shadow-xl flex items-center justify-center gap-3 active:scale-[0.98] transition-all disabled:opacity-50 font-black uppercase tracking-widest"
        >
          {isSubmitting ? (
            <Loader2 className="animate-spin w-6 h-6" />
          ) : (
            <>
              <span className="text-xl">✅</span>
              Finalizar Pedido
            </>
          )}
        </button>
      </div>
    </form>
  );
}

function Label({ children, className }: { children: React.ReactNode, className?: string }) {
  return <label className={className}>{children}</label>;
}