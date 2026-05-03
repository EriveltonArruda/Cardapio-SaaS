'use client';

import { useState } from "react";
import { MapPin, Clock, X, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useStore } from "@/contexts/StoreContext";

export function StoreInfo() {
  const [isOpenModal, setIsOpenModal] = useState(false);
  const { store } = useStore();

  if (!store) {
    return <div className="p-4 bg-white border-b"><Skeleton className="h-10 w-full rounded-xl" /></div>;
  }

  // Lógica de abertura dinâmica
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
      <div className="px-4 py-3 flex items-center justify-between text-[11px] bg-white border-b text-slate-600 font-bold sticky top-16 z-40">
        <div className="flex items-center gap-2 uppercase tracking-tighter">
          <span>Sem pedido mínimo</span>
          <span className="text-slate-300">•</span>
          <span>Entrega rápida</span>
        </div>
        <button onClick={() => setIsOpenModal(true)} className="text-amber-600 font-black uppercase tracking-tighter hover:underline">
          Perfil da loja
        </button>
      </div>

      <div className={`px-4 py-1.5 text-center text-[10px] font-black uppercase tracking-widest sticky top-25.75 z-40 border-b shadow-sm ${isActuallyOpen ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
        }`}>
        {isActuallyOpen ? "Loja aberta, faça seu pedido! ✅" : "Loja fechada no momento ❌"}
      </div>

      {isOpenModal && (
        <div className="fixed inset-0 z-100 flex items-end sm:items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsOpenModal(false)} />
          <div className="relative w-full max-w-md bg-white rounded-t-2xl sm:rounded-2xl p-6 shadow-2xl animate-in slide-in-from-bottom-10">
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
                  <h2 className="text-xl font-black uppercase tracking-tighter text-slate-800 leading-tight">{store.name}</h2>
                  <div className="flex items-center gap-1 mt-1 text-yellow-500 text-sm font-bold">
                    <Star className="w-4 h-4 fill-current" /> <span>5.0</span>
                  </div>
                </div>
              </div>
              <button onClick={() => setIsOpenModal(false)} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200"><X className="w-5 h-5" /></button>
            </div>

            <div className="space-y-6">
              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center shrink-0">
                  <MapPin className="w-5 h-5 text-slate-400" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase text-slate-400">Endereço de Entrega</p>
                  <p className="font-bold text-sm text-slate-700">{store.address || "Endereço principal da loja"}</p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center shrink-0">
                  <Clock className="w-5 h-5 text-slate-400" />
                </div>
                <div className="flex-1">
                  <p className="text-[10px] font-black uppercase text-slate-400">Horários de Funcionamento</p>
                  <ul className="mt-2 space-y-2 text-sm text-slate-600">
                    <li className="flex justify-between border-b border-dashed pb-1">
                      <span>Segunda a Quinta:</span>
                      <span className="font-black text-slate-800">{store.opening_hours_week || "Não informado"}</span>
                    </li>
                    <li className="flex justify-between border-b border-dashed pb-1">
                      <span>Sexta e Sábado:</span>
                      <span className="font-black text-slate-800">{store.opening_hours_weekend || "Não informado"}</span>
                    </li>
                    <li className="flex justify-between text-primary">
                      <span className="font-bold">Domingo:</span>
                      <span className="font-black">{store.opening_hours_sunday || "Não informado"}</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
            <Button onClick={() => setIsOpenModal(false)} className="w-full mt-8 font-black uppercase tracking-widest h-14 rounded-2xl shadow-lg active:scale-95 transition-all">Fechar</Button>
          </div>
        </div>
      )}
    </>
  );
}