'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AppContainer } from "@/components/layout/AppContainer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { registerSchema, zodErrorsToMap } from "@/lib/validations";
import { SAAS_LEADS_WHATSAPP } from "@/lib/site";
import { Store, Loader2, CheckCircle2, AlertCircle, Phone, Mail, Globe, Lock } from "lucide-react";

export default function RegisterPage() {
  const { signUp } = useAuth();
  const [formData, setFormData] = useState({
    storeName: "",
    slug: "",
    email: "",
    phone: "",
    password: "",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSuccess, setIsSuccess] = useState(false);
  const router = useRouter();

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    const generatedSlug = name
      .toLowerCase()
      .trim()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]/g, "-")
      .replace(/-+/g, "-");

    setFormData(prev => ({ ...prev, storeName: name, slug: generatedSlug }));
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, "");
    if (value.length > 11) value = value.slice(0, 11);

    let formatted = value;
    if (value.length > 2) formatted = `(${value.slice(0, 2)}) ${value.slice(2)}`;
    if (value.length > 7) formatted = `(${value.slice(0, 2)}) ${value.slice(2, 7)}-${value.slice(7)}`;

    setFormData(prev => ({ ...prev, phone: formatted }));
  };

  // ✅ Envia o Lead pro WhatsApp do dono do SaaS (número configurável via
  // NEXT_PUBLIC_SAAS_LEADS_WHATSAPP, ver src/lib/site.ts)
  const sendLeadToWhatsApp = () => {
    const message = `🚀 *NOVO LEAD: CARDÁPIO DIGITAL*\n\n` +
      `*Loja:* ${formData.storeName}\n` +
      `*Link:* seusaas.com/${formData.slug}\n` +
      `*E-mail:* ${formData.email}\n` +
      `*WhatsApp do Lojista:* ${formData.phone}\n\n` +
      `_A loja foi criada no banco com sucesso._`;

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://api.whatsapp.com/send?phone=${SAAS_LEADS_WHATSAPP}&text=${encodedMessage}`;

    // Abre o WhatsApp em uma nova aba
    window.open(whatsappUrl, '_blank');
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    const parsed = registerSchema.safeParse(formData);
    if (!parsed.success) {
      setFieldErrors(zodErrorsToMap(parsed.error));
      setError("Confira os campos destacados abaixo.");
      return;
    }

    setIsLoading(true);

    try {
      const { data: existingStore } = await supabase
        .from('stores')
        .select('slug')
        .eq('slug', formData.slug)
        .maybeSingle();

      if (existingStore) {
        throw new Error("Este endereço (URL) já está sendo usado. Tente adicionar uma cidade ou bairro ao nome.");
      }

      // ✅ Cria o usuário de autenticação PRIMEIRO. Sem isso, a loja não
      // tem dono (user_id) e o RLS bloqueia qualquer inserção/edição futura.
      const { error: signUpError, data: signUpData } = await signUp(formData.email, formData.password);
      if (signUpError) throw new Error(signUpError.message || "Erro ao criar sua conta de acesso.");

      const newUserId = signUpData?.user?.id;
      if (!newUserId) {
        throw new Error(
          "Conta criada! Verifique seu e-mail para confirmar o acesso antes de continuar."
        );
      }

      // ✅ Cast necessário: os tipos gerados do Supabase (integrations/supabase/types.ts)
      // estão desatualizados e não incluem a coluna `user_id`, que existe de fato na tabela.
      const { data: store, error: storeError } = await (supabase.from('stores') as any)
        .insert([{
          name: formData.storeName,
          slug: formData.slug,
          is_active: true,
          user_id: newUserId,
        }])
        .select()
        .single();

      if (storeError) throw new Error("Erro ao criar a loja. Tente novamente.");

      const { error: settingsError } = await (supabase.from('store_settings') as any)
        .insert([{
          store_id: store.id,
          store_name: formData.storeName,
          phone: formData.phone.replace(/\D/g, ''),
          primary_color: "#1caf08",
          secondary_color: "#F1F5F9",
          text_color: "#111111",
          is_open: true
        }]);

      if (settingsError) throw settingsError;

      setIsSuccess(true);

      // ✅ Dispara o aviso para o seu WhatsApp assim que salvar no banco!
      sendLeadToWhatsApp();

      // Aguarda e manda o lojista para o painel
      setTimeout(() => {
        router.push(`/${formData.slug}/admin`);
      }, 2500);

    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Ocorreu um erro desconhecido.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <AppContainer>
        <div className="flex flex-col items-center justify-center min-h-screen px-6 text-center animate-in zoom-in-95 duration-500">
          <CheckCircle2 className="w-16 h-16 text-[#1caf08] mb-4 animate-bounce" />
          <h2 className="text-2xl font-black uppercase tracking-tighter text-slate-900">Loja Criada!</h2>
          <p className="text-sm text-slate-500 mt-2 font-bold uppercase tracking-widest">
            Preparando seu painel de gestão...
          </p>
        </div>
      </AppContainer>
    );
  }

  return (
    <AppContainer>
      <div className="flex flex-col min-h-screen px-6 py-12 bg-white animate-in fade-in duration-500">
        <button
          onClick={() => router.push('/')}
          className="mb-8 text-slate-400 font-black text-[10px] uppercase tracking-[0.2em] flex items-center gap-2 hover:text-slate-600 transition-colors w-fit active:scale-95"
        >
          ← Voltar ao Início
        </button>

        <div className="flex items-center gap-4 mb-10">
          <div className="w-14 h-14 bg-[#1caf08] rounded-2xl flex items-center justify-center shadow-lg rotate-3">
            <Store className="w-7 h-7 text-white" />
          </div>
          <div className="text-left">
            <h1 className="text-2xl font-black uppercase tracking-tighter leading-none text-slate-900">Novo Cardápio</h1>
            <p className="text-[10px] font-black text-[#1caf08] uppercase tracking-widest mt-1">SaaS Multi-tenant v1.0</p>
          </div>
        </div>

        <form onSubmit={handleRegister} className="space-y-5">
          {error && (
            <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-[11px] font-black flex items-center gap-3 rounded-r-xl uppercase tracking-wider animate-in slide-in-from-top-2">
              <AlertCircle className="w-4 h-4 shrink-0" /> {error}
            </div>
          )}

          <div className="space-y-1.5">
            <Label className="font-black uppercase text-[10px] tracking-[0.15em] text-slate-400 ml-1">Nome da sua Empresa</Label>
            <div className="relative">
              <Store className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                required
                placeholder="Ex: Zezinho Lanches"
                value={formData.storeName}
                onChange={handleNameChange}
                className="pl-11 h-14 rounded-xl border-2 border-slate-100 font-bold text-base focus:border-[#1caf08] focus:ring-0 transition-all text-slate-900 bg-slate-50/50"
              />
            </div>
            {fieldErrors.storeName && <p className="text-[10px] font-bold text-red-500 uppercase px-1">{fieldErrors.storeName}</p>}
          </div>

          <div className="space-y-1.5">
            <Label className="font-black uppercase text-[10px] tracking-[0.15em] text-slate-400 ml-1">URL do Cardápio</Label>
            <div className="relative">
              <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#1caf08]" />
              <Input
                required
                value={formData.slug}
                onChange={e => setFormData(p => ({ ...p, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') }))}
                className="pl-11 pr-24 h-14 rounded-xl border-2 border-slate-100 font-bold text-sm focus:border-[#1caf08] focus:ring-0 transition-all text-[#1caf08] bg-green-50/50"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400 pointer-events-none">
                .meucardapio.com
              </span>
            </div>
            {fieldErrors.slug && <p className="text-[10px] font-bold text-red-500 uppercase px-1">{fieldErrors.slug}</p>}
          </div>

          <div className="space-y-1.5">
            <Label className="font-black uppercase text-[10px] tracking-[0.15em] text-slate-400 ml-1">E-mail Profissional</Label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                required
                type="email"
                placeholder="contato@empresa.com"
                value={formData.email}
                onChange={e => setFormData(p => ({ ...p, email: e.target.value }))}
                className="pl-11 h-14 rounded-xl border-2 border-slate-100 font-bold text-sm focus:border-[#1caf08] focus:ring-0 transition-all text-slate-900 bg-slate-50/50"
              />
            </div>
            {fieldErrors.email && <p className="text-[10px] font-bold text-red-500 uppercase px-1">{fieldErrors.email}</p>}
          </div>

          <div className="space-y-1.5">
            <Label className="font-black uppercase text-[10px] tracking-[0.15em] text-slate-400 ml-1">WhatsApp de Pedidos</Label>
            <div className="relative">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                required
                placeholder="(00) 00000-0000"
                value={formData.phone}
                onChange={handlePhoneChange}
                className="pl-11 h-14 rounded-xl border-2 border-slate-100 font-bold text-base focus:border-[#1caf08] focus:ring-0 transition-all text-slate-900 bg-slate-50/50"
              />
            </div>
            {fieldErrors.phone && <p className="text-[10px] font-bold text-red-500 uppercase px-1">{fieldErrors.phone}</p>}
          </div>

          <div className="space-y-1.5">
            <Label className="font-black uppercase text-[10px] tracking-[0.15em] text-slate-400 ml-1">Crie uma Senha de Acesso</Label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                required
                type="password"
                minLength={6}
                placeholder="Mínimo 6 caracteres"
                value={formData.password}
                onChange={e => setFormData(p => ({ ...p, password: e.target.value }))}
                className="pl-11 h-14 rounded-xl border-2 border-slate-100 font-bold text-base focus:border-[#1caf08] focus:ring-0 transition-all text-slate-900 bg-slate-50/50"
              />
            </div>
            {fieldErrors.password && <p className="text-[10px] font-bold text-red-500 uppercase px-1">{fieldErrors.password}</p>}
          </div>

          <div className="pt-6">
            <Button
              type="submit"
              disabled={isLoading || !formData.storeName.trim() || !formData.phone.trim() || !formData.email.trim() || formData.password.length < 6}
              className="w-full h-16 rounded-2xl bg-[#1caf08] hover:bg-green-600 text-white font-black uppercase tracking-[0.2em] text-xs shadow-[0_10px_20px_-10px_rgba(28,175,8,0.5)] active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50 disabled:active:scale-100"
            >
              {isLoading ? <Loader2 className="animate-spin w-5 h-5" /> : "Criar Meu Cardápio Agora"}
            </Button>
          </div>
        </form>

        <footer className="mt-auto pt-10 text-[9px] text-slate-400 text-center uppercase leading-relaxed font-bold tracking-widest">
          Ao criar sua loja, você aceita nossos <br /> termos de uso e políticas de privacidade.
        </footer>
      </div>
    </AppContainer>
  );
}