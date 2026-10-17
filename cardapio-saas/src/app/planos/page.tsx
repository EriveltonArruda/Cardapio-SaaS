import Link from "next/link";
import { ArrowLeft, Check, X, Sparkles } from "lucide-react";
import { AppContainer } from "@/components/layout/AppContainer";
import { PLAN_PAYMENT_LINKS, SAAS_UPGRADE_WHATSAPP } from "@/lib/site";

export const metadata = {
  title: "Planos",
  description: "Compare os planos Starter e Pro do seu cardápio digital.",
};

const FEATURES: { label: string; starter: boolean; pro: boolean }[] = [
  { label: "Cardápio digital ilimitado", starter: true, pro: true },
  { label: "Pedidos direto no seu WhatsApp", starter: true, pro: true },
  { label: "Painel administrativo completo", starter: true, pro: true },
  { label: "Cupons de desconto", starter: true, pro: true },
  { label: "Notificação sonora de pedido novo", starter: true, pro: true },
  { label: "Impressão de comanda", starter: true, pro: true },
  { label: '"Meus Pedidos" pro seu cliente', starter: true, pro: true },
  { label: "Até 100 produtos cadastrados", starter: true, pro: true },
  { label: "Produtos ilimitados", starter: false, pro: true },
  { label: "Identidade visual personalizada (cores)", starter: false, pro: true },
  { label: "Chave Pix na tela de pagamento", starter: false, pro: true },
  { label: "Complementos e adicionais de produto", starter: false, pro: true },
  { label: "Banners e gestão de promoções", starter: false, pro: true },
  { label: "QR Code do cardápio pra imprimir", starter: false, pro: true },
  { label: "Relatórios de vendas e produtos mais vendidos", starter: false, pro: true },
  { label: "Taxa de entrega configurável", starter: false, pro: true },
  { label: "Programa de fidelidade automático", starter: false, pro: true },
];

export default function PlansPage() {
  const whatsappFallback = `https://wa.me/${SAAS_UPGRADE_WHATSAPP}?text=${encodeURIComponent("Olá! Quero assinar um plano do cardápio digital.")}`;

  return (
    <AppContainer>
      <div className="min-h-screen bg-white px-6 py-10">
        <Link href="/" className="inline-flex items-center gap-2 text-slate-400 font-black text-[10px] uppercase tracking-[0.2em] mb-8 hover:text-slate-600">
          <ArrowLeft className="w-4 h-4" /> Voltar ao Início
        </Link>

        <h1 className="text-2xl font-black uppercase tracking-tighter text-slate-900 mb-1">Escolha seu plano</h1>
        <p className="text-sm text-slate-500 mb-2">7 dias grátis em qualquer plano. Cancele quando quiser.</p>

        <div className="grid grid-cols-2 gap-3 mt-8 mb-6">
          <div className="rounded-2xl border-2 border-slate-100 p-5 text-center">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Starter</p>
            <p className="text-3xl font-black text-slate-900 tracking-tighter">R$ 60</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase">/mês</p>
          </div>
          <div className="rounded-2xl border-2 border-[#1caf08] p-5 text-center relative bg-[#1caf08]/5">
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#1caf08] text-white text-[9px] font-black uppercase px-3 py-1 rounded-full tracking-widest flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> Recomendado
            </span>
            <p className="text-[10px] font-black uppercase tracking-widest text-[#1caf08] mb-1">Pro</p>
            <p className="text-3xl font-black text-slate-900 tracking-tighter">R$ 80</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase">/mês</p>
          </div>
        </div>

        <div className="space-y-0 mb-8">
          {FEATURES.map((f) => (
            <div key={f.label} className="grid grid-cols-[1fr_32px_32px] items-center py-2.5 border-b border-slate-100 gap-2">
              <span className="text-xs font-bold text-slate-700 leading-tight">{f.label}</span>
              <span className="flex justify-center">
                {f.starter ? <Check className="w-4 h-4 text-slate-400" /> : <X className="w-4 h-4 text-slate-200" />}
              </span>
              <span className="flex justify-center">
                {f.pro ? <Check className="w-4 h-4 text-[#1caf08]" /> : <X className="w-4 h-4 text-slate-200" />}
              </span>
            </div>
          ))}
          <div className="grid grid-cols-[1fr_32px_32px] text-[9px] font-black uppercase text-slate-400 pt-2 gap-2">
            <span />
            <span className="text-center">Starter</span>
            <span className="text-center text-[#1caf08]">Pro</span>
          </div>
        </div>

        <div className="space-y-3">
          <a
            href={PLAN_PAYMENT_LINKS.starter || whatsappFallback}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-center w-full h-14 border-2 border-slate-200 rounded-2xl font-black uppercase text-xs tracking-widest text-slate-700 hover:bg-slate-50 transition-all active:scale-95"
          >
            Assinar Starter
          </a>
          <a
            href={PLAN_PAYMENT_LINKS.pro || whatsappFallback}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-center gap-2 w-full h-14 bg-[#1caf08] text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg hover:bg-green-600 transition-all active:scale-95"
          >
            <Sparkles className="w-4 h-4" /> Assinar Pro
          </a>
          <Link
            href="/register"
            className="flex items-center justify-center w-full h-12 text-[#1caf08] font-black uppercase text-[10px] tracking-widest hover:underline"
          >
            Ou comece pelos 7 dias grátis →
          </Link>
        </div>
      </div>
    </AppContainer>
  );
}
