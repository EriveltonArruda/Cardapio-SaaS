'use client';

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Lock, Mail, Loader2, Sparkles, ShieldOff, LogOut, CheckCircle2, Clock } from "lucide-react";

interface StoreRow {
  id: string;
  name: string;
  slug: string;
  plan_type: "starter" | "pro";
  is_active: boolean;
  created_at: string;
  trial_ends_at: string;
  subscription_active: boolean;
}

function trialLabel(store: StoreRow): { text: string; expired: boolean } {
  if (store.subscription_active) return { text: "Assinatura ativa", expired: false };
  const diffMs = new Date(store.trial_ends_at).getTime() - Date.now();
  if (diffMs <= 0) return { text: "Trial vencido", expired: true };
  const days = Math.ceil(diffMs / 86400000);
  return { text: `Trial: ${days} dia(s) restante(s)`, expired: false };
}

// Painel interno do DONO do SaaS (não confundir com /[slug]/admin, que é o
// painel de cada lojista). Serve pra, depois de confirmar um pagamento
// manual (Pix/link de pagamento), fazer o upgrade Starter -> Pro de uma
// loja sem precisar mexer direto no banco. Protegido por RLS: só quem tem
// role 'admin' em user_roles consegue de fato alterar plan_type de outra
// loja (ver migration 20260829130000_admin_plan_override.sql).
export default function PainelSaasPage() {
  const { user, isAdmin, isLoading: authLoading, signIn, signOut } = useAuth();
  const { toast } = useToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const [stores, setStores] = useState<StoreRow[]>([]);
  const [isLoadingStores, setIsLoadingStores] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchStores = useCallback(async () => {
    setIsLoadingStores(true);
    try {
      const { data, error } = await supabase
        .from("stores")
        .select("id, name, slug, plan_type, is_active, created_at, trial_ends_at, subscription_active")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setStores((data as unknown as StoreRow[]) || []);
    } catch (err: any) {
      toast({ title: "Erro ao carregar lojas", description: err.message, variant: "destructive" });
    } finally {
      setIsLoadingStores(false);
    }
  }, [toast]);

  useEffect(() => {
    if (isAdmin) fetchStores();
  }, [isAdmin, fetchStores]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    const { error } = await signIn(email, password);
    if (error) {
      toast({ title: "Erro no login", description: error.message, variant: "destructive" });
    }
    setIsLoggingIn(false);
  };

  const toggleSubscription = async (store: StoreRow) => {
    const newValue = !store.subscription_active;
    setUpdatingId(store.id);
    try {
      const { error } = await (supabase.from("stores") as any)
        .update({ subscription_active: newValue })
        .eq("id", store.id);

      if (error) throw error;
      toast({ title: newValue ? `${store.name} liberada 🎉` : `${store.name} voltou a depender do trial` });
      setStores((prev) => prev.map((s) => (s.id === store.id ? { ...s, subscription_active: newValue } : s)));
    } catch (err: any) {
      toast({ title: "Erro ao atualizar assinatura", description: err.message, variant: "destructive" });
    } finally {
      setUpdatingId(null);
    }
  };

  const togglePlan = async (store: StoreRow) => {
    const newPlan = store.plan_type === "pro" ? "starter" : "pro";
    setUpdatingId(store.id);
    try {
      const { error } = await (supabase.from("stores") as any)
        .update({ plan_type: newPlan })
        .eq("id", store.id);

      if (error) throw error;
      toast({ title: `${store.name} agora é ${newPlan === "pro" ? "PRO 🎉" : "Starter"}` });
      setStores((prev) => prev.map((s) => (s.id === store.id ? { ...s, plan_type: newPlan } : s)));
    } catch (err: any) {
      toast({ title: "Erro ao atualizar plano", description: err.message, variant: "destructive" });
    } finally {
      setUpdatingId(null);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/50">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Não logado, ou logado mas sem papel de admin: mostra o formulário de login.
  // (Reaproveita a mesma sessão do Supabase Auth das lojas — mas só quem tem
  // role 'admin' em user_roles passa da tela de login pra frente.)
  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-primary flex items-center justify-center mb-4">
              <Lock className="w-8 h-8 text-primary-foreground" />
            </div>
            <CardTitle className="text-2xl">Painel do SaaS</CardTitle>
            <CardDescription>
              {user && !isAdmin
                ? "Essa conta não tem permissão de administrador da plataforma."
                : "Entre com a conta de administrador da plataforma"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {user && !isAdmin ? (
              <Button variant="outline" className="w-full" onClick={() => signOut()}>
                <LogOut className="w-4 h-4 mr-2" /> Sair e tentar outra conta
              </Button>
            ) : (
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-10" required disabled={isLoggingIn} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Senha</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-10" required disabled={isLoggingIn} />
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={isLoggingIn}>
                  {isLoggingIn ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : "Entrar"}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black tracking-tight">Painel do SaaS</h1>
            <p className="text-sm text-muted-foreground">Confirme o pagamento no processador e libere o plano Pro aqui.</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => signOut()}>
            <LogOut className="w-4 h-4 mr-2" /> Sair
          </Button>
        </div>

        {isLoadingStores ? (
          <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
        ) : (
          <div className="space-y-3">
            {stores.map((store) => {
              const trial = trialLabel(store);
              return (
              <Card key={store.id}>
                <CardContent className="p-4 flex flex-wrap items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="font-bold truncate">{store.name}</p>
                    <p className="text-xs text-muted-foreground truncate">/{store.slug}{!store.is_active && " · inativa"}</p>
                    <p className={`text-[10px] font-black uppercase mt-1 flex items-center gap-1 ${trial.expired ? "text-destructive" : "text-muted-foreground"}`}>
                      {trial.expired ? <Lock className="w-3 h-3" /> : <Clock className="w-3 h-3" />} {trial.text}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full ${store.plan_type === "pro" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                      {store.plan_type}
                    </span>
                    <Button
                      size="sm"
                      variant={store.subscription_active ? "outline" : "default"}
                      disabled={updatingId === store.id}
                      onClick={() => toggleSubscription(store)}
                    >
                      {updatingId === store.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : store.subscription_active ? (
                        <><Lock className="w-4 h-4 mr-1.5" /> Suspender</>
                      ) : (
                        <><CheckCircle2 className="w-4 h-4 mr-1.5" /> Liberar acesso</>
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant={store.plan_type === "pro" ? "outline" : "default"}
                      disabled={updatingId === store.id}
                      onClick={() => togglePlan(store)}
                    >
                      {updatingId === store.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : store.plan_type === "pro" ? (
                        <><ShieldOff className="w-4 h-4 mr-1.5" /> Rebaixar</>
                      ) : (
                        <><Sparkles className="w-4 h-4 mr-1.5" /> Tornar Pro</>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
              );
            })}
            {stores.length === 0 && (
              <p className="text-center text-muted-foreground py-12">Nenhuma loja cadastrada ainda.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
