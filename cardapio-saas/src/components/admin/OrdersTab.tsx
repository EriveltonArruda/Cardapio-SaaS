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
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useStore } from "@/contexts/StoreContext";
import { ToastAction } from "@/components/ui/toast";

const formatPrice = (value: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"
  }).format(value);
};

export function OrdersTab() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("pendente");
  const [limit, setLimit] = useState(20);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const { toast } = useToast();
  const { store } = useStore();

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
      setOrders(response.data || []);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const executeStatusUpdate = async (id: string, newStatus: string) => {
    try {
      const response = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', id)
        .eq('store_id', store?.id);

      if (response.error) throw new Error("Erro ao atualizar");

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
      // ✅ TOAST DE CONFIRMAÇÃO COM OPÇÃO NEGATIVA (SIM/NÃO)
      toast({
        title: "Deseja cancelar este pedido?",
        description: "Esta ação pode ser revertida depois, mas o pedido sairá da fila principal.",
        variant: "destructive",
        action: (
          <div className="flex gap-2">
            {/* OPÇÃO NEGATIVA: Apenas fecha o toast */}
            <ToastAction altText="Não" className="bg-slate-200 text-slate-900 hover:bg-slate-300 border-none font-bold">
              Não
            </ToastAction>
            {/* OPÇÃO POSITIVA: Executa o cancelamento */}
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
    fetchOrders();
    if (!store?.id) return;
    
    const channel = supabase.channel('orders-admin').on(
      'postgres_changes', 
      { event: '*', schema: 'public', table: 'orders', filter: `store_id=eq.${store.id}` }, 
      () => fetchOrders()
    ).subscribe();
    
    return () => { supabase.removeChannel(channel); };
  }, [filter, limit, selectedDate, store?.id]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">

      {/* BARRA DE FILTROS E DATA */}
      <div className="bg-white p-5 rounded-3xl border shadow-sm space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-[10px] font-black uppercase text-slate-400 tracking-widest leading-none mb-1">Painel de Vendas</h2>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => { setLoading(true); setSelectedDate(e.target.value); }}
                className="text-lg font-black text-slate-900 border-none p-0 focus:ring-0 bg-transparent outline-none"
              />
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-black text-slate-900 leading-none">{orders.length}</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Pedidos</p>
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
              className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${filter === opt.id ? "bg-slate-900 text-white shadow-lg" : "bg-slate-100 text-slate-400"
                }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4">
        {orders.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-[40px] border-2 border-dashed border-slate-200">
            <p className="text-slate-400 font-bold italic">Nenhum pedido nesta data.</p>
          </div>
        ) : (
          orders.map((order) => (
            <div key={order.id} className={`bg-white rounded-[32px] border-2 transition-all duration-300 ${order.status === 'concluido' ? 'border-green-100 bg-green-50/10' :
              order.status === 'cancelado' ? 'border-slate-100 opacity-60' : 'border-slate-200 shadow-md'
              }`}>
              <div className="p-6 flex justify-between items-start border-b border-slate-50">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black bg-slate-900 text-white px-2.5 py-1 rounded-lg">
                      #{order.id.split('-')[0].toUpperCase()}
                    </span>
                    <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase">
                      <Clock className="w-3 h-3" /> {new Date(order.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                  <h3 className="font-black text-xl text-slate-900 tracking-tight leading-none">{order.customer_name}</h3>
                </div>
                <div className="text-right">
                  <p className="font-black text-2xl text-primary tracking-tighter">{formatPrice(order.total_amount)}</p>
                </div>
              </div>

              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50/30">
                <div className="space-y-3">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Local de Entrega</p>
                  <div className="text-xs font-bold text-slate-700 space-y-1">
                    <p className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-primary" /> {order.address_street}, {order.address_number}
                    </p>
                    <p className="ml-6 text-slate-400 font-medium">{order.address_neighborhood} — Gravatá</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Contato</p>
                  <a href={`https://wa.me/55${order.customer_phone.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="flex items-center gap-3 text-sm font-black text-green-600">
                    <Phone className="w-4 h-4" /> {order.customer_phone}
                  </a>
                </div>
              </div>

              <div className="px-6 py-5 bg-white border-t border-slate-100 flex gap-3">
                {order.status === 'pendente' ? (
                  <>
                    <button onClick={() => handleUpdateClick(order.id, 'concluido')} className="flex-1 bg-green-500 text-white h-12 rounded-2xl font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all">
                      <CheckCircle2 className="w-4 h-4" /> Finalizar Pedido
                    </button>
                    <button onClick={() => handleUpdateClick(order.id, 'cancelado')} className="px-6 bg-white border-2 border-slate-200 text-slate-400 h-12 rounded-2xl font-black text-[11px] uppercase flex items-center justify-center gap-2 hover:bg-red-50 hover:text-red-500 transition-all active:scale-95">
                      <XCircle className="w-4 h-4" />
                    </button>
                  </>
                ) : order.status === 'cancelado' ? (
                  <button onClick={() => handleUpdateClick(order.id, 'pendente')} className="w-full bg-slate-100 text-slate-600 h-12 rounded-2xl font-black text-[11px] uppercase flex items-center justify-center gap-2 hover:bg-slate-200 transition-all active:scale-95">
                    <Undo2 className="w-4 h-4" /> Reativar Pedido (Estornar)
                  </button>
                ) : (
                  <div className="w-full text-center py-3.5 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] border-2 bg-green-100 text-green-700 border-green-200">
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