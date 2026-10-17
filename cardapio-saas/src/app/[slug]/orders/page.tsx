"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { BottomNav } from "@/components/layout/BottomNav";
import { AppContainer } from "@/components/layout/AppContainer";
import { Button } from "@/components/ui/button";
import { useStore } from "@/contexts/StoreContext";
import { supabase } from "@/lib/supabase/client";
import { formatPrice } from "@/lib/utils";
import { Loader2, Search, Clock, Package } from "lucide-react";

interface CustomerOrderItem {
  name: string;
  quantity: number;
  price: number;
}

interface CustomerOrder {
  id: string;
  created_at: string;
  status: string;
  total_amount: number;
  delivery_fee: number;
  payment_method: string | null;
  items: CustomerOrderItem[] | string;
}

const STATUS_LABEL: Record<string, { label: string; className: string }> = {
  pendente: { label: "Em andamento", className: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20" },
  concluido: { label: "Concluído", className: "bg-green-500/10 text-green-600 border-green-500/20" },
  cancelado: { label: "Cancelado", className: "bg-destructive/10 text-destructive border-destructive/20" },
};

export default function OrdersPage() {
  const { store } = useStore();
  const [phone, setPhone] = useState("");
  const [orders, setOrders] = useState<CustomerOrder[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  // ✅ Pré-preenche com o telefone usado no último pedido dessa loja
  // (salvo pelo CheckoutForm em localStorage ao finalizar um pedido).
  useEffect(() => {
    if (!store?.id) return;
    try {
      const saved = localStorage.getItem(`customer-phone-${store.id}`);
      if (saved) setPhone(saved);
    } catch {
      // localStorage pode não estar disponível (modo privado, etc.)
    }
  }, [store?.id]);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const numbers = e.target.value.replace(/\D/g, "").slice(0, 11);
    let formatted = numbers;
    if (numbers.length > 2) formatted = `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    if (numbers.length > 7) formatted = `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7)}`;
    setPhone(formatted);
  };

  const handleSearch = async () => {
    if (!store?.id || phone.replace(/\D/g, "").length < 10) return;
    setIsLoading(true);
    setSearched(true);
    try {
      // ✅ Cast necessário: get_customer_orders não existe nos tipos gerados
      // do Supabase (mesmo padrão já usado para get_loyalty_status).
      const { data } = await (supabase.rpc as any)("get_customer_orders", {
        p_store_id: store.id,
        p_phone: phone,
      });
      setOrders((data as CustomerOrder[]) || []);
    } finally {
      setIsLoading(false);
    }
  };

  if (!store) return null;

  return (
    <AppContainer>
      <div className="min-h-screen bg-background pb-20 animate-in fade-in duration-300">
        <PageHeader title="Meus Pedidos" showBack={false} />

        <div className="px-4 pt-4 space-y-3">
          <p className="text-xs text-muted-foreground font-medium">
            Digite o WhatsApp usado no pedido para consultar o histórico.
          </p>
          <div className="flex gap-2">
            <input
              type="tel"
              value={phone}
              onChange={handlePhoneChange}
              placeholder="(00) 00000-0000"
              className="flex-1 p-4 border-2 border-transparent rounded-2xl bg-muted/30 font-bold focus:border-primary transition-all outline-none text-foreground"
            />
            <Button onClick={handleSearch} disabled={isLoading || phone.replace(/\D/g, "").length < 10} className="h-auto px-5 rounded-2xl font-black uppercase">
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        <div className="px-4 pt-6 space-y-4">
          {isLoading ? (
            <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
          ) : !searched ? null : orders && orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
              <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-4">
                <span className="text-4xl">📋</span>
              </div>
              <p className="text-muted-foreground font-bold">Nenhum pedido encontrado para esse telefone.</p>
            </div>
          ) : (
            orders?.map((order) => {
              const items = typeof order.items === "string" ? JSON.parse(order.items) : order.items;
              const statusInfo = STATUS_LABEL[order.status] || { label: order.status, className: "bg-muted text-muted-foreground border-border" };
              return (
                <div key={order.id} className="bg-card rounded-3xl border border-border p-5 shadow-sm space-y-3">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground uppercase">
                      <Clock className="w-3 h-3" />
                      {new Date(order.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit" })}
                      {" · "}
                      {new Date(order.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                    </div>
                    <span className={`text-[9px] font-black uppercase px-2.5 py-1 rounded-full border ${statusInfo.className}`}>
                      {statusInfo.label}
                    </span>
                  </div>

                  <div className="space-y-1.5 border-t border-border/50 pt-3">
                    {(items || []).map((item: CustomerOrderItem, idx: number) => (
                      <div key={idx} className="flex justify-between text-xs font-bold text-foreground">
                        <span className="flex items-center gap-1.5"><Package className="w-3 h-3 text-muted-foreground" /> {item.quantity}x {item.name}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-between items-center border-t border-border/50 pt-3">
                    <span className="text-[10px] font-black uppercase text-muted-foreground">{order.payment_method?.toUpperCase() || "A combinar"}</span>
                    <span className="text-lg font-black text-primary">{formatPrice(order.total_amount || 0)}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <BottomNav />
      </div>
    </AppContainer>
  );
}
