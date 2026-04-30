'use client';

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useStore } from "@/contexts/StoreContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Lock, Mail, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);

  const { session } = useAuth();
  const { toast } = useToast();

  const params = useParams();
  const slug = params?.slug as string;
  const router = useRouter();
  const { store } = useStore();

  // Redireciona para o admin da loja específica ao detectar sessão
  useEffect(() => {
    if (session && slug) {
      setIsRedirecting(true);
      router.push(`/${slug}/admin`);
    }
  }, [session, slug, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        toast({
          title: "Erro no login",
          description: error.message,
          variant: "destructive",
        });
        setIsLoading(false);
      }
    } catch (err: any) {
      toast({
        title: "Erro inesperado",
        description: err.message,
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  const showLoading = isLoading || isRedirecting;

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          {store?.logo_url ? (
            <div className="mx-auto w-20 h-20 rounded-full bg-white flex items-center justify-center mb-4 overflow-hidden shadow-sm p-1 border">
              <img src={store.logo_url} alt={store?.name} className="w-full h-full object-contain" />
            </div>
          ) : (
            <div className="mx-auto w-16 h-16 rounded-full bg-primary flex items-center justify-center mb-4">
              <Lock className="w-8 h-8 text-primary-foreground" />
            </div>
          )}
          <CardTitle className="text-2xl">{store?.name ? `Painel ${store.name}` : 'Área Administrativa'}</CardTitle>
          <CardDescription>Entre com suas credenciais para acessar o painel</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@exemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                  disabled={showLoading}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                  required
                  disabled={showLoading}
                />
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={showLoading}>
              {showLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isRedirecting ? "Redirecionando..." : "Entrando..."}
                </>
              ) : "Entrar"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}