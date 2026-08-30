"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/contexts/CartContext";
import { Loader2, MapPin, User, Phone as PhoneIcon, Wallet, CreditCard, Banknote, QrCode, Ticket } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase/client";
import { useStore } from "@/contexts/StoreContext";
import { formatPrice } from "@/lib/utils";
import { checkoutSchema, zodErrorsToMap } from "@/lib/validations";

// ✅ Importações Globais
import { Order } from "@/types";

export function CheckoutForm() {
  // ✅ Puxando os novos métodos de cálculo de cupom do contexto
  const { items, getTotal, getSubtotal, getDiscountAmount, coupon, clearCart } = useCart();
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
    paymentMethod: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const parsed = checkoutSchema.safeParse(formData);
    if (!parsed.success) {
      setErrors(zodErrorsToMap(parsed.error));
      return false;
    }
    setErrors({});
    return true;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let numbers = e.target.value.replace(/\D/g, "");

    // ✅ SE COLAR COM CÓDIGO DO PAÍS (+55), IGNORA OS DOIS PRIMEIROS DÍGITOS
    if (numbers.startsWith("55") && numbers.length > 11) {
      numbers = numbers.slice(2);
    }

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

      // ✅ Gera o ID no client: com a política de RLS que restringe pedidos
      // ao dono da loja, um checkout anônimo não consegue mais ler de volta
      // a linha que acabou de inserir (INSERT público não dá direito a SELECT).
      const generatedOrderId = crypto.randomUUID();

      // 1. SALVAR NO BANCO DE DADOS
      const orderPayload: Partial<Order> = {
        id: generatedOrderId,
        store_id: store.id,
        customer_name: formData.name,
        customer_phone: formData.phone,
        address_street: formData.street,
        address_number: formData.number,
        address_neighborhood: formData.neighborhood,
        address_landmark: formData.landmark,
        payment_method: formData.paymentMethod,
        items: JSON.stringify(items.map(item => ({
          name: item.product.name,
          quantity: item.quantity,
          price: item.product.promo_price || item.product.price,
          observations: item.observations || "",
          addons: item.selectedAddons?.map(a => ({
            name: a.addon.name,
            price: a.addon.price
          })) || []
        }))),
        total_amount: total,
        status: 'pendente'
      };

      const { error: saveError } = await supabase
        .from('orders')
        .insert([orderPayload as any]);

      if (saveError) throw new Error("Erro ao salvar pedido");

      const orderId = generatedOrderId.split('-')[0].toUpperCase();

      // 2. BUSCAR DADOS DA LOJA PARA WHATSAPP
      const { data: settings } = await supabase
        .from('store_settings')
        .select('phone, store_name')
        .eq('store_id', store.id)
        .maybeSingle();

      const rawPhone = settings?.phone?.replace(/\D/g, '');

      // ✅ Sem fallback para número pessoal: se a loja não configurou o
      // WhatsApp, o pedido já ficou salvo (aparece no painel do lojista),
      // mas não arriscamos mandar o cliente pro número de outra pessoa.
      if (!rawPhone) {
        toast({
          title: "Pedido registrado, mas...",
          description: "Esta loja ainda não configurou o WhatsApp de pedidos. Entre em contato diretamente com o estabelecimento.",
        });
        clearCart();
        router.push(`/${store.slug}`);
        return;
      }

      const storePhone = rawPhone.startsWith('55') ? rawPhone : `55${rawPhone}`;
      const storeName = settings?.store_name || store.name || "Loja";

      // 3. MONTAGEM DA MENSAGEM WHATSAPP
      let message = `*NOVO PEDIDO #${orderId}*\n`;
      message += `*${storeName.toUpperCase()}*\n`;
      message += `------------------------------------------\n\n`;

      items.forEach((item) => {
        const itemPrice = item.product.promo_price || item.product.price;
        const addonsSum = item.selectedAddons?.reduce((s, a) => s + a.addon.price, 0) || 0;
        const itemSubtotal = (itemPrice + addonsSum) * item.quantity;

        message += `*${item.quantity}x ${item.product.name}*\n`;

        if (item.selectedAddons && item.selectedAddons.length > 0) {
          item.selectedAddons.forEach(a => {
            message += `  + ${a.addon.name} (${formatPrice(a.addon.price)})\n`;
          });
        }

        if (item.observations) message += `  _Obs: ${item.observations}_\n`;
        message += `  Subtotal: ${formatPrice(itemSubtotal)}\n\n`;
      });

      message += `------------------------------------------\n`;

      // ✅ INSERINDO O CUPOM NO WHATSAPP
      if (coupon) {
        message += `*Subtotal:* ${formatPrice(getSubtotal())}\n`;
        message += `*Cupom (${coupon.code}):* -${formatPrice(getDiscountAmount())}\n`;
      }

      message += `*TOTAL A PAGAR: ${formatPrice(total)}*\n`;
      message += `*PAGAMENTO:* ${formData.paymentMethod.toUpperCase()}\n`;
      message += `------------------------------------------\n\n`;

      message += `*ENTREGA:*\n`;
      message += `*Cliente:* ${formData.name}\n`;
      message += `*Endereço:* ${formData.street}, ${formData.number}\n`;
      message += `*Bairro:* ${formData.neighborhood}\n`;
      message += `*Ref:* ${formData.landmark}\n\n`;

      message += `------------------------------------------\n`;
      message += `_Pedido gerado pelo seu Cardápio Digital_`;

      const encodedMessage = encodeURIComponent(message);
      const whatsappLink = `https://api.whatsapp.com/send?phone=${storePhone}&text=${encodedMessage}`;

      toast({ title: "Pedido enviado com sucesso!" });
      clearCart();

      setTimeout(() => {
        window.open(whatsappLink, '_blank');
        router.push(`/${store.slug}`);
      }, 500);

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
        {/* Identificação */}
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
            {errors.name && <p className="text-[10px] font-bold text-red-500 uppercase px-2">{errors.name}</p>}
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
            {errors.phone && <p className="text-[10px] font-bold text-red-500 uppercase px-2">{errors.phone}</p>}
          </div>
        </div>

        {/* Localização */}
        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-2 space-y-1.5">
            <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Rua</Label>
            <input
              type="text"
              value={formData.street}
              onChange={(e) => setFormData((prev) => ({ ...prev, street: e.target.value }))}
              className="w-full p-4 border-2 border-transparent rounded-2xl bg-muted/30 font-bold focus:border-primary transition-all outline-none text-foreground text-sm"
            />
            {errors.street && <p className="text-[10px] font-bold text-red-500 uppercase px-2">{errors.street}</p>}
          </div>
          <div className="space-y-1.5">
            <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Nº</Label>
            <input
              type="text"
              value={formData.number}
              onChange={(e) => setFormData((prev) => ({ ...prev, number: e.target.value }))}
              className="w-full p-4 border-2 border-transparent rounded-2xl bg-muted/30 font-bold focus:border-primary transition-all outline-none text-foreground text-sm"
            />
            {errors.number && <p className="text-[10px] font-bold text-red-500 uppercase px-2">{errors.number}</p>}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Bairro e Referência</Label>
          <input
            type="text"
            value={formData.neighborhood}
            onChange={(e) => setFormData((prev) => ({ ...prev, neighborhood: e.target.value }))}
            placeholder="Ex: Centro"
            className="w-full p-4 border-2 border-transparent rounded-2xl bg-muted/30 font-bold focus:border-primary transition-all outline-none text-foreground mb-2"
          />
          {errors.neighborhood && <p className="text-[10px] font-bold text-red-500 uppercase px-2 mb-2">{errors.neighborhood}</p>}
          <input
            type="text"
            value={formData.landmark}
            onChange={(e) => setFormData((prev) => ({ ...prev, landmark: e.target.value }))}
            placeholder="Ponto de referência"
            className="w-full p-4 border-2 border-transparent rounded-2xl bg-muted/30 font-bold focus:border-primary transition-all outline-none text-foreground"
          />
          {errors.landmark && <p className="text-[10px] font-bold text-red-500 uppercase px-2">{errors.landmark}</p>}
        </div>
      </div>

      {/* Pagamento Dinâmico */}
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
        {/* ✅ RESUMO DO CUPOM NA TELA DE FINALIZAR */}
        {coupon && (
          <>
            <div className="flex items-center justify-between mb-2 text-muted-foreground">
              <span className="text-xs font-bold uppercase tracking-widest">Subtotal</span>
              <span className="text-sm font-bold">{formatPrice(getSubtotal())}</span>
            </div>
            <div className="flex items-center justify-between mb-4 text-green-500">
              <span className="text-xs font-black uppercase tracking-widest flex items-center gap-1">
                <Ticket className="w-3 h-3" /> Cupom ({coupon.code})
              </span>
              <span className="text-sm font-black">-{formatPrice(getDiscountAmount())}</span>
            </div>
          </>
        )}

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

// ✅ Componentes auxiliares com tipagem
interface PaymentButtonProps {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}

function PaymentButton({ active, onClick, icon, label }: PaymentButtonProps) {
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