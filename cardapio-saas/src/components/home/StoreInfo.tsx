'use client';

import { useState } from "react";
import {
  MapPin,
  Clock,
  X,
  Star,
  CreditCard,
  Smartphone,
  Banknote
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useStore } from "@/contexts/StoreContext";

export function StoreInfo() {
  const [isOpenModal, setIsOpenModal] = useState(false);
  const { store } = useStore();

  if (!store) {
    return (
      <div className="p-4 bg-background border-b">
        <Skeleton className="h-10 w-full rounded-xl" />
      </div>
    );
  }

  const isActuallyOpen = (() => {
    if (!store.is_open) return false;
    const now = new Date();
    const day = now.getDay();
    const currentTime = now.getHours() * 60 + now.getMinutes();

    let schedule = store.opening_hours_week;
    if (day === 0) schedule = store.opening_hours_sunday;
    else if (day >= 5) schedule = store.opening_hours_weekend;

    if (!schedule) return true;

    const times = schedule.match(/(\d{2}:\d{2})/g);
    if (!times || times.length < 2) return true;

    const toMin = (t: string) => {
      const [h, m] = t.split(':').map(Number);
      return h * 60 + m;
    };

    const start = toMin(times[0]);
    let end = toMin(times[1]);
    if (end <= start) end += 1440;

    return currentTime >= start && currentTime < end;
  })();

  return (
    <>
      {/* Barra de Informações: Sem pedido mínimo / Entrega rápida */}
      <div className="px-4 py-3 flex items-center justify-between text-[11px] bg-background border-b text-foreground font-bold sticky top-16 z-40 transition-colors">
        <div className="flex items-center gap-2 uppercase tracking-tighter opacity-80">
          <span>Sem pedido mínimo</span>
          <span className="text-border">•</span>
          <span>Entrega rápida</span>
        </div>
        <button
          onClick={() => setIsOpenModal(true)}
          className="text-primary font-black uppercase tracking-tighter hover:underline cursor-pointer"
        >
          Perfil da loja
        </button>
      </div>

      {/* Barra de Status: Loja Aberta / Fechada */}
      <div className={`px-4 py-1.5 text-center text-[10px] font-black uppercase tracking-widest sticky top-25.75 z-40 border-b shadow-sm transition-colors ${isActuallyOpen
        ? 'bg-green-500/10 text-green-500'
        : 'bg-red-500/10 text-red-500'
        }`}>
        {isActuallyOpen ? "Loja aberta, faça seu pedido! ✅" : "Loja fechada no momento ❌"}
      </div>

      {/* Modal de Perfil da Loja */}
      {isOpenModal && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300 cursor-pointer"
            onClick={() => setIsOpenModal(false)}
          />
          <div className="relative w-full max-w-md bg-card text-foreground rounded-t-3xl sm:rounded-2xl p-6 shadow-2xl animate-in slide-in-from-bottom-full duration-500 ease-out flex flex-col border-t sm:border border-border">
            <div className="flex justify-between items-start mb-6">
              <div className="flex gap-4">
                <div className="w-16 h-16 rounded-full border-2 border-primary/20 overflow-hidden shrink-0 shadow-inner">
                  {store.logo_url ? (
                    <img src={store.logo_url} alt="Logo" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-primary/10 flex items-center justify-center font-bold text-primary text-xl">
                      {store.name?.substring(0, 2).toUpperCase()}
                    </div>
                  )}
                </div>
                <div>
                  <h2 className="text-xl font-black uppercase tracking-tighter leading-tight">{store.name}</h2>
                  <div className="flex items-center gap-1 mt-1 text-yellow-500 text-sm font-bold">
                    <Star className="w-4 h-4 fill-current" /> <span>5.0</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setIsOpenModal(false)}
                className="p-2 bg-muted rounded-full hover:bg-muted/80 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-6 overflow-y-auto max-h-[60vh] pr-1">
              {/* Endereço */}
              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0">
                  <MapPin className="w-5 h-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase text-muted-foreground">Endereço de Entrega</p>
                  <p className="font-bold text-sm">{store.address || "Endereço principal da loja"}</p>
                </div>
              </div>

              {/* Horários */}
              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0">
                  <Clock className="w-5 h-5 text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <p className="text-[10px] font-black uppercase text-muted-foreground">Horários de Funcionamento</p>
                  <ul className="mt-2 space-y-2 text-sm">
                    <li className="flex justify-between border-b border-border border-dashed pb-1">
                      <span className="opacity-70">Segunda a Quinta:</span>
                      <span className="font-black">{store.opening_hours_week || "Não informado"}</span>
                    </li>
                    <li className="flex justify-between border-b border-border border-dashed pb-1">
                      <span className="opacity-70">Sexta e Sábado:</span>
                      <span className="font-black">{store.opening_hours_weekend || "Não informado"}</span>
                    </li>
                    <li className="flex justify-between text-primary">
                      <span className="font-bold">Domingo:</span>
                      <span className="font-black">{store.opening_hours_sunday || "Não informado"}</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* MÉTODOS DE PAGAMENTO */}
              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0">
                  <CreditCard className="w-5 h-5 text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <p className="text-[10px] font-black uppercase text-muted-foreground">Formas de Pagamento</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {store.accept_pix && (
                      <span className="flex items-center gap-1.5 bg-green-500/10 text-green-600 dark:text-green-400 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-tight border border-green-500/20">
                        <Smartphone className="w-3 h-3" /> Pix
                      </span>
                    )}
                    {store.accept_card_credit && (
                      <span className="flex items-center gap-1.5 bg-primary/10 text-primary px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-tight border border-primary/20">
                        <CreditCard className="w-3 h-3" /> Crédito
                      </span>
                    )}
                    {store.accept_card_debt && (
                      <span className="flex items-center gap-1.5 bg-primary/10 text-primary px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-tight border border-primary/20">
                        <CreditCard className="w-3 h-3" /> Débito
                      </span>
                    )}
                    {store.accept_cash && (
                      <span className="flex items-center gap-1.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-tight border border-amber-500/20">
                        <Banknote className="w-3 h-3" /> Dinheiro
                      </span>
                    )}
                    {/* Caso nenhum esteja configurado */}
                    {!store.accept_pix && !store.accept_card_credit && !store.accept_card_debt && !store.accept_cash && (
                      <span className="text-xs text-muted-foreground italic">Consulte a loja para saber as formas de pagamento.</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <Button
              onClick={() => setIsOpenModal(false)}
              className="w-full mt-8 font-black uppercase tracking-widest h-14 rounded-2xl shadow-lg active:scale-95 transition-all cursor-pointer"
            >
              Fechar
            </Button>
          </div>
        </div>
      )}
    </>
  );
}