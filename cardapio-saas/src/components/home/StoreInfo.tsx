'use client';

import { useState } from "react";
import {
  MapPin,
  Clock,
  X,
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
      <div className="p-4 bg-background border-b border-border">
        <Skeleton className="h-10 w-full rounded-xl bg-muted/50" />
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
    if (end <= start) end += 1440; // Suporte a turnos que viram a noite (ex: 18:00 às 02:00)

    return currentTime >= start && currentTime < end;
  })();

  return (
    <>
      {/* Barra de Informações: endereço resumido + acesso ao perfil da loja */}
      <div className="px-4 py-3 flex items-center justify-between text-[11px] bg-background border-b border-border text-foreground font-bold sticky top-16 z-40 transition-colors animate-in fade-in duration-300">
        <div className="flex items-center gap-1.5 uppercase tracking-tighter opacity-80 truncate">
          <MapPin className="w-3 h-3 shrink-0" />
          <span className="truncate">{store.address || "Ver endereço"}</span>
        </div>
        <button
          onClick={() => setIsOpenModal(true)}
          className="text-primary font-black uppercase tracking-tighter hover:underline cursor-pointer active:scale-95 transition-transform shrink-0 ml-2"
        >
          Perfil da loja
        </button>
      </div>

      {/* Barra de Status: Loja Aberta / Fechada */}
      <div className={`px-4 py-1.5 text-center text-[10px] font-black uppercase tracking-widest sticky top-[103px] z-40 border-b border-transparent shadow-sm transition-colors duration-500 ${isActuallyOpen
        ? 'bg-green-500/10 text-green-600 dark:text-green-500'
        : 'bg-red-500/10 text-red-600 dark:text-red-500'
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
              <div className="flex gap-4 items-center">
                <div className="w-16 h-16 rounded-full border-2 border-primary/20 overflow-hidden shrink-0 shadow-inner bg-background flex items-center justify-center">
                  {store.logo_url ? (
                    <img src={store.logo_url} alt="Logo" className="w-full h-full object-cover" />
                  ) : (
                    <div className="font-bold text-primary text-xl">
                      {store.name?.substring(0, 2).toUpperCase()}
                    </div>
                  )}
                </div>
                <div>
                  <h2 className="text-xl font-black uppercase tracking-tighter leading-tight">{store.name}</h2>
                </div>
              </div>
              <button
                onClick={() => setIsOpenModal(false)}
                className="p-2 bg-muted rounded-full hover:bg-muted/80 transition-colors cursor-pointer text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-6 overflow-y-auto max-h-[60vh] pr-1 scrollbar-hide">
              {/* Endereço */}
              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0">
                  <MapPin className="w-5 h-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Endereço de Entrega</p>
                  <p className="font-bold text-sm text-foreground">{store.address || "Endereço principal da loja"}</p>
                </div>
              </div>

              {/* Horários */}
              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0">
                  <Clock className="w-5 h-5 text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Horários</p>
                  <ul className="mt-2 space-y-2 text-sm text-foreground">
                    <li className="flex justify-between border-b border-border border-dashed pb-1">
                      <span className="opacity-70">Seg. a Quinta:</span>
                      <span className="font-black">{store.opening_hours_week || "Não informado"}</span>
                    </li>
                    <li className="flex justify-between border-b border-border border-dashed pb-1">
                      <span className="opacity-70">Sex. e Sábado:</span>
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
                  <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Formas de Pagamento</p>
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
                    {!store.accept_pix && !store.accept_card_credit && !store.accept_card_debt && !store.accept_cash && (
                      <span className="text-xs text-muted-foreground italic">Consulte a loja.</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <Button
              onClick={() => setIsOpenModal(false)}
              className="w-full mt-8 font-black uppercase tracking-widest h-14 rounded-2xl shadow-lg active:scale-95 transition-all cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Fechar
            </Button>
          </div>
        </div>
      )}
    </>
  );
}