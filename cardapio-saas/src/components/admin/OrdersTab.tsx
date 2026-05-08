'use client';

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import {
  CheckCircle2,
  XCircle,
  Phone,
  MapPin,
  Loader2,
  Clock,
  Calendar,
  Undo2,
  Package,
  Wallet,
  Search
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useStore } from "@/contexts/StoreContext";
import { ToastAction } from "@/components/ui/toast";
import { Order } from "@/types"; // ✅ Importando do seu index.ts

const formatPrice = (value: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"
  }).format(value);
};

export function OrdersTab() {
  const [orders, setOrders] = useState<Order[]>([]); // ✅ Tipagem aplicada
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("pendente");
  const [limit, setLimit] = useState(20);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const { toast } = useToast();
  const { store, isLoading: isStoreLoading } = useStore();

  const fetchOrders = async () => {
    try {
      if (!store?.id) return;
      const startOfDay = `${selectedDate}T00:00:00.000Z`;
      const endOfDay = `${selectedDate}T23:59:59.999Z`;

      let query = supabase
        .from('orders')
        .select('*')
        .eq('store_id', store.id)
        .gte('created_at', startOfDay)
        .lte('created_at', endOfDay)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (filter !== "todos") {
        query = query.eq('status', filter);
      }

      const response = await query;
      if (response.error) throw new Error("Falha ao ler dados");
      setOrders((response.data as unknown as Order[]) || []);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const executeStatusUpdate = async (id: string, newStatus: string) => {
    try {
      if (!store?.id) return;
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', id)
        .eq('store_id', store.id);

      if (error) throw error;

      toast({
        title: newStatus === 'concluido' ? "Venda Finalizada! 🚀" : "Pedido Reativado! 🔄",
        description: `O status agora é ${newStatus.toUpperCase()}.`,
      });

      fetchOrders();
    } catch (err: any) {
      toast({ title: "Erro na atualização", variant: "destructive" });
    }
  };

  const handleUpdateClick = (id: string, newStatus: string) => {
    if (newStatus === 'cancelado') {
      toast({
        title: "Deseja cancelar este pedido?",
        description: "Esta ação pode ser revertida depois.",
        variant: "destructive",
        action: (
          <div className="flex gap-2">
            <ToastAction altText="Não" className="bg-muted text-foreground hover:bg-muted/80 border-none font-bold">
              Não
            </ToastAction>
            <ToastAction
              altText="Sim, cancelar"
              onClick={() => executeStatusUpdate(id, 'cancelado')}
              className="bg-red-600 text-white hover:bg-red-700 border-none font-bold"
            >
              Sim
            </ToastAction>
          </div>
        ),
      });
    } else {
      executeStatusUpdate(id, newStatus);
    }
  };

  useEffect(() => {
    if (isStoreLoading || !store?.id) return;
    fetchOrders();
    const channel = supabase.channel('orders-admin').on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'orders', filter: `store_id=eq.${store.id}` },
      () => fetchOrders()
    ).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [filter, limit, selectedDate, store?.id, isStoreLoading]);

  if (isStoreLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-xs font-mono uppercase text-muted-foreground">Verificando loja...</p>
      </div>
    );
  }

  if (!store) return null;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20 transition-colors">

      {/* BARRA DE FILTROS E DATA */}
      <div className="bg-card p-5 rounded-3xl border border-border shadow-sm space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-[10px] font-black uppercase text-muted-foreground tracking-widest leading-none mb-1">Painel de Vendas</h2>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => { setLoading(true); setSelectedDate(e.target.value); }}
                className="text-lg font-black text-foreground border-none p-0 focus:ring-0 bg-transparent outline-none cursor-pointer"
              />
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-black text-foreground leading-none">{orders.length}</p>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-tighter">Pedidos</p>
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {[
            { id: "pendente", label: "Pendentes" },
            { id: "concluido", label: "Concluídos" },
            { id: "cancelado", label: "Cancelados" },
            { id: "todos", label: "Tudo" }
          ].map((opt) => (
            <button
              key={opt.id}
              onClick={() => { setLoading(true); setFilter(opt.id); }}
              className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap cursor-pointer ${filter === opt.id
                ? "bg-primary text-primary-foreground shadow-lg"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4">
        {loading ? (
          <div className="flex justify-center py-10"><Loader2 className="animate-spin text-primary" /></div>
        ) : orders.length === 0 ? (
          <div className="text-center py-24 bg-card rounded-[40px] border-2 border-dashed border-border">
            <p className="text-muted-foreground font-bold italic">Nenhum pedido nesta data.</p>
          </div>
        ) : (
          orders.map((order) => (
            <div key={order.id} className={`bg-card rounded-4xl border-2 transition-all duration-300 ${order.status === 'concluido' ? 'border-green-500/20 bg-green-500/5' :
              order.status === 'cancelado' ? 'border-border opacity-60 grayscale' : 'border-border shadow-md'
              }`}>
              {/* Header do Card */}
              <div className="p-6 flex justify-between items-start border-b border-border">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black bg-foreground text-background px-2.5 py-1 rounded-lg">
                      #{order.id.split('-')[0].toUpperCase()}
                    </span>
                    <div className="flex items-center gap-1 text-[10px] font-bold text-muted-foreground uppercase">
                      <Clock className="w-3 h-3" /> {new Date(order.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                  <h3 className="font-black text-xl text-foreground tracking-tight">{order.customer_name}</h3>
                </div>
                <div className="text-right">
                  <p className="font-black text-2xl text-primary tracking-tighter">{formatPrice(order.total_amount || 0)}</p>
                  <p className="text-[9px] font-black uppercase text-muted-foreground">{order.payment_method || 'PAGAMENTO A COMBINAR'}</p>
                </div>
              </div>

              {/* Detalhes do Pedido - Itens e Adicionais */}
              <div className="p-6 border-b border-border bg-muted/5">
                <p className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                  <Package className="w-3 h-3" /> Itens do Pedido
                </p>
                <div className="space-y-3">
                  {(typeof order.items === 'string' ? JSON.parse(order.items) : order.items)?.map((item: any, idx: number) => (
                    <div key={idx} className="border-l-2 border-primary/30 pl-3">
                      <div className="flex justify-between items-start">
                        <p className="text-sm font-black text-foreground">{item.quantity}x {item.name}</p>
                        <span className="text-xs font-bold text-muted-foreground">{formatPrice(item.price * item.quantity)}</span>
                      </div>

                      {item.addons && item.addons.length > 0 && (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {item.addons.map((a: any, i: number) => (
                            <span key={i} className="text-[9px] font-black text-primary uppercase bg-primary/5 px-1.5 py-0.5 rounded border border-primary/10">
                              + {a.name}
                            </span>
                          ))}
                        </div>
                      )}

                      {item.observations && (
                        <p className="text-[11px] text-muted-foreground italic mt-1">Obs: {item.observations}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Detalhes do Endereço e Contato */}
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 bg-muted/20">
                <div className="space-y-3">
                  <p className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em]">Local de Entrega</p>
                  <div className="text-xs font-bold text-foreground/80 space-y-1">
                    <p className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-primary" /> {order.address_street}, {order.address_number}
                    </p>
                    <p className="ml-6 text-muted-foreground font-medium uppercase text-[10px]">
                      Bairro: {order.address_neighborhood}
                    </p>
                    {order.address_landmark && (
                      <p className="ml-6 text-primary font-bold flex items-center gap-1 text-[10px] uppercase">
                        <Search className="w-3 h-3" /> Ref: {order.address_landmark}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <p className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em]">Contato e Pagamento</p>
                  <div className="space-y-2">
                    <a href={`https://wa.me/55${order.customer_phone.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="flex items-center gap-3 text-sm font-black text-green-500 hover:text-green-400 transition-colors">
                      <Phone className="w-4 h-4" /> {order.customer_phone}
                    </a>
                    <div className="flex items-center gap-2 text-xs font-black text-foreground">
                      <Wallet className="w-4 h-4 text-primary" /> {order.payment_method?.toUpperCase() || 'A COMBINAR'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Rodapé com Ações */}
              <div className="px-6 py-5 bg-card border-t border-border flex gap-3">
                {order.status === 'pendente' ? (
                  <>
                    <button onClick={() => handleUpdateClick(order.id, 'concluido')} className="flex-1 bg-green-600 text-white h-12 rounded-2xl font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all cursor-pointer hover:bg-green-700">
                      <CheckCircle2 className="w-4 h-4" /> Finalizar Pedido
                    </button>
                    <button onClick={() => handleUpdateClick(order.id, 'cancelado')} className="px-6 bg-card border-2 border-border text-muted-foreground h-12 rounded-2xl font-black text-[11px] uppercase flex items-center justify-center gap-2 hover:bg-destructive hover:text-destructive-foreground transition-all active:scale-95 cursor-pointer">
                      <XCircle className="w-4 h-4" />
                    </button>
                  </>
                ) : order.status === 'cancelado' ? (
                  <button onClick={() => handleUpdateClick(order.id, 'pendente')} className="w-full bg-muted text-muted-foreground h-12 rounded-2xl font-black text-[11px] uppercase flex items-center justify-center gap-2 hover:bg-muted/80 transition-all active:scale-95 cursor-pointer">
                    <Undo2 className="w-4 h-4" /> Reativar Pedido (Estornar)
                  </button>
                ) : (
                  <div className="w-full text-center py-3.5 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] border-2 bg-green-500/10 text-green-500 border-green-500/20">
                    PEDIDO FINALIZADO ✅
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}