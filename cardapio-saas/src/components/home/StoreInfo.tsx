'use client';

import { useState } from "react";
import { MapPin, Clock, Phone, X, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useStore } from "@/contexts/StoreContext";

export function StoreInfo() {
  const [isOpenModal, setIsOpenModal] = useState(false);
  const { store } = useStore();

  if (!store) {
    return (
      <div className="flex flex-col gap-2 p-4 bg-white border-b sticky top-[64px] z-40">
        <div className="flex justify-between items-center w-full">
           <Skeleton className="h-4 w-40" />
           <Skeleton className="h-4 w-20" />
        </div>
        <Skeleton className="h-8 w-full mt-2" />
      </div>
    );
  }

  // --- MOTOR DE AUTOMAÇÃO (Lógica de Analista N2) ---
  const checkAutoOpen = () => {
    // 1. O Manual Switch (Admin) é a lei suprema
    if (!store.is_open) return false;

    // 2. Pega a data/hora exata de Gravatá/Recife
    const now = new Date();
    const options: any = { timeZone: 'America/Recife', hour: 'numeric', minute: 'numeric', weekday: 'long', hour12: false };
    const formatter = new Intl.DateTimeFormat('pt-BR', options);
    const parts = formatter.formatToParts(now);

    const hour = parseInt(parts.find(p => p.type === 'hour')?.value || '0');
    const minute = parseInt(parts.find(p => p.type === 'minute')?.value || '0');
    const currentTimeInMinutes = hour * 60 + minute;

    // Dia da semana (0 = Domingo, 1 = Segunda, ..., 5 = Sexta, 6 = Sábado)
    const day = now.getDay();

    // 3. Define qual horário do banco usar
    let scheduleString = "";
    if (day === 0) scheduleString = store.opening_hours_sunday || "";
    else if (day >= 5) scheduleString = store.opening_hours_weekend || "";
    else scheduleString = store.opening_hours_week || "";

    if (!scheduleString) return true; // Se o proprietário não cadastrou nada, deixa aberto

    // 4. Extrai apenas os números (HH:mm) da string do banco
    const times = scheduleString.match(/(\d{2}:\d{2})/g);
    if (!times || times.length < 2) return true; // Fallback: se o formato estiver errado, abre por segurança

    const [startH, startM] = times[0].split(':').map(Number);
    const [endH, endM] = times[1].split(':').map(Number);

    const startTotal = startH * 60 + startM;
    let endTotal = endH * 60 + endM;

    // Ajuste para fechamento após meia-noite (ex: 00:00 ou 01:00)
    if (endTotal <= startTotal) endTotal += 1440;

    return currentTimeInMinutes >= startTotal && currentTimeInMinutes < endTotal;
  };

  const isActuallyOpen = checkAutoOpen();

  return (
    <>
      <div className="px-4 py-3 flex items-center justify-between text-[11px] bg-white border-b text-slate-600 font-bold sticky top-[64px] z-40">
        <div className="flex items-center gap-2 uppercase tracking-tighter">
          <span>Sem pedido mínimo</span>
          <span className="text-slate-300">•</span>
          <span>Entrega rápida</span>
        </div>
        <button onClick={() => setIsOpenModal(true)} className="text-amber-600 font-black hover:underline uppercase tracking-tighter transition-colors">Perfil da loja</button>
      </div>

      <div className={`px-4 py-1.5 text-center text-[10px] font-black uppercase tracking-widest sticky top-[103px] z-40 border-b ${isActuallyOpen ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
        }`}>
        {isActuallyOpen ? "Loja aberta, faça seu pedido!" : "Loja fechada, no momento não aceitamos pedidos"}
      </div>

      {/* MODAL DE PERFIL */}
      {isOpenModal && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsOpenModal(false)} />
          <div className="relative w-full max-w-[480px] bg-background rounded-t-2xl sm:rounded-2xl p-6 shadow-2xl animate-in slide-in-from-bottom-10 duration-300 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-6">
              <div className="flex gap-4">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center border-2 border-primary/20 overflow-hidden shrink-0">
                  {store.logo_url ? <img src={store.logo_url} alt="Logo" className="w-full h-full object-cover" /> : <span className="text-2xl font-bold text-primary">{store.name?.substring(0, 2) || "EB"}</span>}
                </div>
                <div>
                  <h2 className="text-xl font-bold uppercase tracking-tighter leading-none">{store.name}</h2>
                  <p className="text-sm text-muted-foreground uppercase font-bold text-[10px] tracking-widest">Cardápio Digital</p>
                  <div className="flex items-center gap-1 mt-1 text-yellow-500 text-sm font-bold">
                    <Star className="w-4 h-4 fill-current" />
                    <span>5.0</span>
                  </div>
                </div>
              </div>
              <button onClick={() => setIsOpenModal(false)} className="p-2 bg-muted rounded-full hover:bg-muted/80"><X className="w-5 h-5" /></button>
            </div>

            <div className="space-y-6">
              <div className="flex gap-3 text-sm">
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0"><MapPin className="w-4 h-4 text-muted-foreground" /></div>
                <div><p className="font-bold uppercase text-[10px] text-slate-400">Endereço</p><p className="text-black font-bold">{store.address || "Endereço principal da loja"}</p></div>
              </div>

              <div className="flex gap-3 text-sm">
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0"><Clock className="w-4 h-4 text-muted-foreground" /></div>
                <div className="flex-1">
                  <h3 className="font-bold uppercase text-[10px] text-slate-400">Funcionamento</h3>
                  <ul className="text-slate-600 space-y-1.5 mt-2">
                    <li className="flex justify-between w-full border-b border-dashed pb-1"><span>Segunda a Quinta:</span><span className="font-black text-black">{store.opening_hours_week || "Não informado"}</span></li>
                    <li className="flex justify-between w-full border-b border-dashed pb-1"><span>Sexta e Sábado:</span><span className="font-black text-black">{store.opening_hours_weekend || "Não informado"}</span></li>
                    <li className="flex justify-between w-full text-primary font-bold"><span>Domingo:</span><span className="text-black font-black">{store.opening_hours_sunday || "Não informado"}</span></li>
                  </ul>
                </div>
              </div>
            </div>
            <Button onClick={() => setIsOpenModal(false)} className="w-full mt-8 font-black h-12 uppercase tracking-widest rounded-xl shadow-lg">Fechar</Button>
          </div>
        </div>
      )}
    </>
  );
}