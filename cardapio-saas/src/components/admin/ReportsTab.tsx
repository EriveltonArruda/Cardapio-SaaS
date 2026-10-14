'use client';

import { useEffect, useMemo, useState } from "react";
import { useTheme } from "next-themes";
import { supabase } from "@/lib/supabase/client";
import { useStore } from "@/contexts/StoreContext";
import { Loader2, TrendingUp, ShoppingBag, Receipt, Trophy } from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

const formatPrice = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
}

interface OrderRow {
  total_amount: number;
  status: string;
  created_at: string;
  items: OrderItem[] | string;
}

interface DayPoint {
  label: string;
  faturamento: number;
}

interface ProductPoint {
  name: string;
  quantidade: number;
}

const PERIODS = [
  { id: 7, label: "7 dias" },
  { id: 15, label: "15 dias" },
  { id: 30, label: "30 dias" },
] as const;

// Aba de Relatórios (feature Pro). O recharts já estava instalado no
// projeto sem nenhum uso até aqui. Só considera pedidos "concluido" no
// faturamento — pendente/cancelado não entram na conta.
export function ReportsTab() {
  const { store } = useStore();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const [period, setPeriod] = useState<number>(7);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storeId = store?.id;
    if (!storeId) return;
    let isMounted = true;

    async function fetchOrders() {
      setIsLoading(true);
      const since = new Date();
      since.setDate(since.getDate() - (period - 1));
      since.setHours(0, 0, 0, 0);

      const { data, error } = await supabase
        .from("orders")
        .select("total_amount, status, created_at, items")
        .eq("store_id", storeId as string)
        .gte("created_at", since.toISOString())
        .order("created_at", { ascending: true });

      if (!isMounted) return;
      if (!error) setOrders((data as unknown as OrderRow[]) || []);
      setIsLoading(false);
    }

    fetchOrders();
    return () => { isMounted = false; };
  }, [store?.id, period]);

  const concluded = useMemo(() => orders.filter((o) => o.status === "concluido"), [orders]);

  const kpis = useMemo(() => {
    const revenue = concluded.reduce((sum, o) => sum + Number(o.total_amount || 0), 0);
    const count = concluded.length;
    const avgTicket = count > 0 ? revenue / count : 0;
    return { revenue, count, avgTicket };
  }, [concluded]);

  const chartData: DayPoint[] = useMemo(() => {
    const buckets = new Map<string, number>();
    for (let i = period - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split("T")[0];
      buckets.set(key, 0);
    }
    concluded.forEach((o) => {
      const key = o.created_at.split("T")[0];
      if (buckets.has(key)) {
        buckets.set(key, (buckets.get(key) || 0) + Number(o.total_amount || 0));
      }
    });
    return Array.from(buckets.entries()).map(([key, value]) => {
      const [, m, d] = key.split("-");
      return { label: `${d}/${m}`, faturamento: Number(value.toFixed(2)) };
    });
  }, [concluded, period]);

  const topProducts: ProductPoint[] = useMemo(() => {
    const counts = new Map<string, number>();
    concluded.forEach((o) => {
      const items: OrderItem[] = typeof o.items === "string" ? JSON.parse(o.items) : o.items;
      (items || []).forEach((item) => {
        counts.set(item.name, (counts.get(item.name) || 0) + (item.quantity || 0));
      });
    });
    return Array.from(counts.entries())
      .map(([name, quantidade]) => ({ name, quantidade }))
      .sort((a, b) => b.quantidade - a.quantidade)
      .slice(0, 5);
  }, [concluded]);

  const brandColor = store?.primary_color || "#1caf08";
  const gridColor = isDark ? "#334155" : "#e2e8f0";
  const axisColor = isDark ? "#94a3b8" : "#64748b";

  if (isLoading && orders.length === 0) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        {PERIODS.map((p) => (
          <button
            key={p.id}
            onClick={() => setPeriod(p.id)}
            className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer ${period === p.id
              ? "bg-primary text-primary-foreground shadow-lg"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card p-5 rounded-3xl border border-border shadow-sm">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <TrendingUp className="w-4 h-4" />
            <span className="text-[10px] font-black uppercase tracking-widest">Faturamento</span>
          </div>
          <p className="text-2xl font-black text-foreground tracking-tighter">{formatPrice(kpis.revenue)}</p>
        </div>
        <div className="bg-card p-5 rounded-3xl border border-border shadow-sm">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <ShoppingBag className="w-4 h-4" />
            <span className="text-[10px] font-black uppercase tracking-widest">Pedidos concluídos</span>
          </div>
          <p className="text-2xl font-black text-foreground tracking-tighter">{kpis.count}</p>
        </div>
        <div className="bg-card p-5 rounded-3xl border border-border shadow-sm">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <Receipt className="w-4 h-4" />
            <span className="text-[10px] font-black uppercase tracking-widest">Ticket médio</span>
          </div>
          <p className="text-2xl font-black text-foreground tracking-tighter">{formatPrice(kpis.avgTicket)}</p>
        </div>
      </div>

      {/* Gráfico de faturamento por dia */}
      <div className="bg-card p-5 rounded-3xl border border-border shadow-sm">
        <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-4">
          Faturamento por dia
        </h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke={gridColor} />
              <XAxis dataKey="label" tick={{ fill: axisColor, fontSize: 11 }} axisLine={{ stroke: gridColor }} tickLine={false} />
              <YAxis tick={{ fill: axisColor, fontSize: 11 }} axisLine={false} tickLine={false} width={36} />
              <Tooltip
                cursor={{ fill: isDark ? "#1e293b" : "#f1f5f9" }}
                formatter={(value) => formatPrice(Number(value) || 0)}
                contentStyle={{ background: isDark ? "#0f172a" : "#fff", border: `1px solid ${gridColor}`, borderRadius: 12, fontSize: 12 }}
              />
              <Bar dataKey="faturamento" fill={brandColor} radius={[4, 4, 0, 0]} maxBarSize={28} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Produtos mais vendidos */}
      <div className="bg-card p-5 rounded-3xl border border-border shadow-sm">
        <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-4 flex items-center gap-2">
          <Trophy className="w-3.5 h-3.5" /> Produtos mais vendidos
        </h3>
        {topProducts.length === 0 ? (
          <p className="text-sm text-muted-foreground italic py-6 text-center">Nenhuma venda concluída nesse período.</p>
        ) : (
          <div className="space-y-3">
            {topProducts.map((p, idx) => (
              <div key={p.name} className="flex items-center gap-3">
                <span className="text-[10px] font-black text-muted-foreground w-4">{idx + 1}º</span>
                <span className="flex-1 text-sm font-bold text-foreground truncate">{p.name}</span>
                <span className="text-xs font-black text-primary">{p.quantidade}x</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
