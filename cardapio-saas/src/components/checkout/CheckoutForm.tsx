"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/contexts/CartContext";
import { Info, Loader2, MapPin, User, Phone as PhoneIcon, Search, Wallet, CreditCard, Banknote, QrCode } from "lucide-react";
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
  const { store } = useStore();

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    street: "",
    number: "",
    neighborhood: "",
    landmark: "",
    paymentMethod: "", // Novo campo
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = "Nome é obrigatório";
    if (!formData.phone.trim()) newErrors.phone = "WhatsApp é obrigatório";
    if (!formData.street.trim()) newErrors.street = "A rua é obrigatória";
    if (!formData.number.trim()) newErrors.number = "O número é obrigatório";
    if (!formData.neighborhood.trim()) newErrors.neighborhood = "O bairro é obrigatório";
    if (!formData.landmark.trim()) newErrors.landmark = "Referência é obrigatória";
    if (!formData.paymentMethod) newErrors.paymentMethod = "Escolha a forma de pagamento";

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
    if (!store?.id) return;

    setIsSubmitting(true);

    try {
      const total = getTotal();

      // 1. SALVAR NO BANCO DE DADOS
      const orderPayload = {
        store_id: store.id,
        customer_name: formData.name,
        customer_phone: formData.phone,
        address_street: formData.street,
        address_number: formData.number,
        address_neighborhood: formData.neighborhood,
        address_landmark: formData.landmark,
        payment_method: formData.paymentMethod,
        // 🛡️ Transformamos o array em String para o banco aceitar sem reclamar
        items: JSON.stringify(items.map(item => ({
          name: item.product.name,
          quantity: item.quantity,
          price: item.product.price,
          observations: item.observations || "",
          addons: item.selectedAddons?.map(a => ({
            name: a.addon?.name || "Adicional",
            price: a.addon?.price || 0
          })) || []
        }))),
        total_amount: total,
        status: 'pendente'
      };

      const saveRes = await supabase.from('orders').insert(orderPayload).select();
      if (saveRes.error) throw new Error("Erro ao salvar pedido");

      const savedData = saveRes.data;
      const orderId = savedData[0]?.id?.split('-')[0].toUpperCase() || "NEW";

      // 2. BUSCAR DADOS DA LOJA PARA WHATSAPP
      const settingsRes = await supabase
        .from('store_settings')
        .select('phone, store_name')
        .eq('store_id', store.id)
        .single();

      const rawPhone = settingsRes.data?.phone?.replace(/\D/g, '') || "81979158040";
      const storePhone = rawPhone.startsWith('55') ? rawPhone : `55${rawPhone}`;
      const storeName = settingsRes.data?.store_name || store.name || "Loja";

      // 3. MONTAGEM DA MENSAGEM (FORMATO COMPLETO PARA ENTREGA)
      let message = `*NOVO PEDIDO #${orderId}*\n`;
      message += `*${storeName.toUpperCase()}*\n`;
      message += `------------------------------------------\n\n`;

      items.forEach((item) => {
        // Cálculo do subtotal do item (Preço base + Adicionais)
        const addonsSum = item.selectedAddons?.reduce((s, a) => s + (a.addon?.price || 0), 0) || 0;
        const itemSubtotal = (item.product.price + addonsSum) * item.quantity;

        message += `*${item.quantity}x ${item.product.name}*\n`;

        // Listar Adicionais se houver
        if (item.selectedAddons && item.selectedAddons.length > 0) {
          item.selectedAddons.forEach(a => {
            message += `  + ${a.addon.name} (${formatPrice(a.addon.price)})\n`;
          });
        }

        if (item.observations) message += `  _Obs: ${item.observations}_\n`;
        message += `  Subtotal: ${formatPrice(itemSubtotal)}\n\n`;
      });

      message += `------------------------------------------\n`;
      message += `*TOTAL: ${formatPrice(total)}*\n`;
      message += `*PAGAMENTO:* ${formData.paymentMethod.toUpperCase()}\n`;
      message += `------------------------------------------\n\n`;

      message += `*ENTREGA:*\n`;
      message += `*Cliente:* ${formData.name}\n`;
      message += `*Contato:* ${formData.phone}\n`;
      message += `*Endereço:* ${formData.street}, ${formData.number}\n`; // Rua e Número
      message += `*Bairro:* ${formData.neighborhood}\n`;             // Bairro
      message += `*Ref:* ${formData.landmark}\n\n`;                  // Ponto de Referência

      message += `------------------------------------------\n`;
      message += `_Pedido gerado pelo Cardápio Digital_`;

      const encodedMessage = encodeURIComponent(message);
      const link = `https://api.whatsapp.com/send?phone=${storePhone}&text=${encodedMessage}`;

      toast({ title: "Pedido enviado!" });
      clearCart();

      setTimeout(() => {
        window.open(link, '_blank');
        router.push(`/${store.slug}`);
      }, 800);

    } catch (error: any) {
      console.error(error);
      toast({ title: "Erro ao finalizar", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isValid = formData.name.trim() && formData.phone.trim() && formData.street.trim() &&
    formData.number.trim() && formData.neighborhood.trim() &&
    formData.landmark.trim() && formData.paymentMethod && items.length > 0;

  return (
    <form onSubmit={handleSubmit} className="p-4 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
      <div className="text-center mb-8">
        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
          <MapPin className="text-primary w-6 h-6" />
        </div>
        <h2 className="text-xl font-black uppercase tracking-tighter text-foreground">Finalizar Pedido</h2>
      </div>

      <div className="space-y-4">
        {/* Dados Pessoais */}
        <div className="grid grid-cols-1 gap-4">
          <div className="space-y-1.5">
            <Label className="flex items-center gap-2 text-[10px] font-black uppercase text-muted-foreground ml-1">
              <User className="w-3 h-3" /> Seu Nome
            </Label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="Como te chamamos?"
              className="w-full p-4 border-2 border-transparent rounded-2xl bg-muted/30 font-bold focus:border-primary transition-all outline-none text-foreground"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="flex items-center gap-2 text-[10px] font-black uppercase text-muted-foreground ml-1">
              <PhoneIcon className="w-3 h-3" /> WhatsApp
            </Label>
            <input
              type="tel"
              value={formData.phone}
              onChange={handlePhoneChange}
              placeholder="(00) 00000-0000"
              className="w-full p-4 border-2 border-transparent rounded-2xl bg-muted/30 font-bold focus:border-primary transition-all outline-none text-foreground"
              maxLength={16}
            />
          </div>
        </div>

        {/* Endereço */}
        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-2 space-y-1.5">
            <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Rua</Label>
            <input
              type="text"
              value={formData.street}
              onChange={(e) => setFormData((prev) => ({ ...prev, street: e.target.value }))}
              className="w-full p-4 border-2 border-transparent rounded-2xl bg-muted/30 font-bold focus:border-primary transition-all outline-none text-foreground text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Nº</Label>
            <input
              type="text"
              value={formData.number}
              onChange={(e) => setFormData((prev) => ({ ...prev, number: e.target.value }))}
              className="w-full p-4 border-2 border-transparent rounded-2xl bg-muted/30 font-bold focus:border-primary transition-all outline-none text-foreground text-sm"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Bairro e Referência</Label>
          <input
            type="text"
            value={formData.neighborhood}
            onChange={(e) => setFormData((prev) => ({ ...prev, neighborhood: e.target.value }))}
            placeholder="Bairro"
            className="w-full p-4 border-2 border-transparent rounded-2xl bg-muted/30 font-bold focus:border-primary transition-all outline-none text-foreground mb-2"
          />
          <input
            type="text"
            value={formData.landmark}
            onChange={(e) => setFormData((prev) => ({ ...prev, landmark: e.target.value }))}
            placeholder="Ponto de referência"
            className="w-full p-4 border-2 border-transparent rounded-2xl bg-muted/30 font-bold focus:border-primary transition-all outline-none text-foreground"
          />
        </div>
      </div>

      {/* SEÇÃO DE PAGAMENTO DINÂMICA */}
      <div className="space-y-3 pt-4">
        <Label className="flex items-center gap-2 text-[10px] font-black uppercase text-muted-foreground ml-1">
          <Wallet className="w-3 h-3" /> Forma de Pagamento
        </Label>

        <div className="grid grid-cols-2 gap-2">
          {store?.accept_pix && (
            <PaymentButton
              active={formData.paymentMethod === 'pix'}
              onClick={() => setFormData(p => ({ ...p, paymentMethod: 'pix' }))}
              icon={<QrCode className="w-4 h-4" />}
              label="Pix"
            />
          )}
          {store?.accept_card_credit && (
            <PaymentButton
              active={formData.paymentMethod === 'credito'}
              onClick={() => setFormData(p => ({ ...p, paymentMethod: 'credito' }))}
              icon={<CreditCard className="w-4 h-4" />}
              label="Crédito"
            />
          )}
          {store?.accept_card_debt && (
            <PaymentButton
              active={formData.paymentMethod === 'debito'}
              onClick={() => setFormData(p => ({ ...p, paymentMethod: 'debito' }))}
              icon={<CreditCard className="w-4 h-4" />}
              label="Débito"
            />
          )}
          {store?.accept_cash && (
            <PaymentButton
              active={formData.paymentMethod === 'dinheiro'}
              onClick={() => setFormData(p => ({ ...p, paymentMethod: 'dinheiro' }))}
              icon={<Banknote className="w-4 h-4" />}
              label="Dinheiro"
            />
          )}
        </div>
        {errors.paymentMethod && <p className="text-[10px] font-bold text-red-500 uppercase px-2">{errors.paymentMethod}</p>}
      </div>

      <div className="pt-6 border-t border-border">
        <div className="flex items-center justify-between mb-6">
          <span className="text-xs font-black uppercase text-muted-foreground tracking-widest">Total Geral</span>
          <span className="text-2xl font-black text-primary tracking-tighter">{formatPrice(getTotal())}</span>
        </div>

        <button
          type="submit"
          disabled={!isValid || isSubmitting}
          className="w-full bg-primary text-black h-16 rounded-3xl shadow-xl flex items-center justify-center gap-3 active:scale-[0.98] transition-all disabled:opacity-50 font-black uppercase tracking-widest cursor-pointer"
        >
          {isSubmitting ? (
            <Loader2 className="animate-spin w-6 h-6" />
          ) : (
            <>Finalizar no WhatsApp</>
          )}
        </button>
      </div>
    </form>
  );
}

function PaymentButton({ active, onClick, icon, label }: any) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-2 p-4 rounded-2xl border-2 transition-all font-bold text-xs cursor-pointer ${active ? "border-primary bg-primary/5 text-foreground" : "border-transparent bg-muted/30 text-muted-foreground"
        }`}
    >
      {icon}
      {label}
    </button>
  );
}

function Label({ children, className }: { children: React.ReactNode, className?: string }) {
  return <label className={className}>{children}</label>;
}