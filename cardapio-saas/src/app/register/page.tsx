'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AppContainer } from "@/components/layout/AppContainer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase/client";
import { Store, Loader2, CheckCircle2, AlertCircle } from "lucide-react";

export default function RegisterPage() {
  const [formData, setFormData] = useState({ name: "", email: "", password: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // 1. Gerar o slug (URL amigável)
      const slug = formData.name
        .toLowerCase()
        .trim()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\s+/g, "-")
        .replace(/[^\w-]+/g, "");

      // 2. Criar a loja na tabela 'stores'
      // Nota: No futuro, adicione owner_id aqui após configurar o Auth
      const { data: store, error: storeError } = await supabase
        .from('stores')
        .insert([{ name: formData.name, slug: slug }])
        .select()
        .single();

      if (storeError) throw new Error("Este nome de loja já existe ou é inválido.");

      // 3. Criar as configurações iniciais na 'store_settings'
      // Usando 'as any' para ignorar o erro de tipagem temporariamente enquanto o banco atualiza
      const { error: settingsError } = await supabase
        .from('store_settings')
        .insert([{
          store_id: store.id,
          store_name: formData.name,
          primary_color: "#FFB800",
          secondary_color: "#F1F5F9",
          text_color: "#111111",
          is_open: true
        } as any]);

      if (settingsError) throw settingsError;

      setIsSuccess(true);

      // Pequeno delay para o lojista ler a mensagem de sucesso
      setTimeout(() => {
        router.push(`/${slug}/admin`);
      }, 2000);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <AppContainer>
        <div className="flex flex-col items-center justify-center min-h-screen px-6 text-center">
          <CheckCircle2 className="w-16 h-16 text-green-500 mb-4 animate-bounce" />
          <h2 className="text-2xl font-black uppercase tracking-tighter text-slate-900">Loja Criada com Sucesso!</h2>
          <p className="text-sm text-slate-500 mt-2 font-bold uppercase tracking-widest">
            Preparando seu painel de gestão...
          </p>
        </div>
      </AppContainer>
    );
  }

  return (
    <AppContainer>
      <div className="flex flex-col min-h-screen px-6 py-12 bg-white">
        <button
          onClick={() => router.push('/')}
          className="mb-8 text-slate-400 font-black text-[10px] uppercase tracking-[0.2em] flex items-center gap-2 hover:text-slate-600 transition-colors"
        >
          ← Voltar ao Início
        </button>

        <div className="flex items-center gap-4 mb-10">
          <div className="w-14 h-14 bg-amber-400 rounded-2xl flex items-center justify-center shadow-lg rotate-3">
            <Store className="w-7 h-7 text-slate-900" />
          </div>
          <div className="text-left">
            <h1 className="text-2xl font-black uppercase tracking-tighter leading-none text-slate-900">Novo Cardápio</h1>
            <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest mt-1">SaaS Multi-tenant v1.0</p>
          </div>
        </div>

        <form onSubmit={handleRegister} className="space-y-6">
          {error && (
            <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-[11px] font-black flex items-center gap-3 rounded-r-xl uppercase tracking-wider">
              <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
            </div>
          )}

          <div className="space-y-2">
            <Label className="font-black uppercase text-[10px] tracking-[0.15em] text-slate-400 ml-1">Nome da sua Empresa</Label>
            <Input
              required
              placeholder="Ex: Zezinho Lanches"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="h-14 rounded-xl border-2 border-slate-100 font-bold text-lg focus:border-amber-400 focus:ring-0 transition-all"
            />
          </div>

          <div className="pt-4">
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-16 rounded-2xl bg-amber-400 hover:bg-amber-500 text-slate-900 font-black uppercase tracking-[0.2em] text-xs shadow-xl active:scale-95 transition-all"
            >
              {isLoading ? <Loader2 className="animate-spin w-5 h-5" /> : "Criar Meu Cardápio Agora"}
            </Button>
          </div>
        </form>

        <footer className="mt-auto pt-10 text-[9px] text-slate-300 text-center uppercase leading-relaxed font-bold tracking-widest">
          Ao criar sua loja, você aceita nossos <br /> termos de uso e políticas de privacidade.
        </footer>
      </div>
    </AppContainer>
  );
}