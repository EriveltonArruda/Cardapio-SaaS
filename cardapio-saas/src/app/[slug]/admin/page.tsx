'use client'

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation"; // Adicionado useRouter
import { supabase } from "@/lib/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { LogOut, Package, FolderOpen, Settings, Loader2, Gift, Coffee, ShoppingBag } from "lucide-react";

// Importação dos Componentes das Abas
import { ProductsTab } from "@/components/admin/ProductsTab";
import { CategoriesTab } from "@/components/admin/CategoriesTab";
import { SettingsTab } from "@/components/admin/SettingsTab";
import { AddonsTab } from "@/components/admin/AddonsTab";
import { PromotionsTab } from "@/components/admin/PromotionsTab";
import { OrdersTab } from "@/components/admin/OrdersTab";

export default function Admin() {
  // CORREÇÃO TS: Destructuring com tipagem explícita
  const params = useParams();
  const slug = params?.slug as string;
  const router = useRouter();

  const [activeTab, setActiveTab] = useState("orders");
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      localStorage.clear();
      // ✅ Redirecionamento dinâmico usando o slug
      router.push(`/${slug}/admin/login`);
    } catch (err) {
      router.push(`/${slug}/admin/login`);
    }
  };

  useEffect(() => {
    let isMounted = true;
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (isMounted) {
          if (session) {
            setIsAuthorized(true);
          } else {
            router.push(`/${slug}/admin/login`);
          }
          setIsLoading(false);
        }
      } catch (err) {
        if (isMounted) setIsLoading(false);
      }
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session && isMounted) {
        setIsAuthorized(true);
        setIsLoading(false);
      } else if (event === 'SIGNED_OUT' && isMounted) {
        router.push(`/${slug}/admin/login`);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [slug, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-muted-foreground font-mono text-xs">Sincronizando segurança...</p>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
        <p className="text-sm">Sessão expirada.</p>
        <Button onClick={() => router.push(`/${slug}/admin/login`)}>Entrar novamente</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 pb-20">
      {/* ... (restante do seu JSX de UI permanece igual) ... */}
      <header className="bg-card border-b sticky top-0 z-50">
        <div className="container flex items-center justify-between py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-lg font-bold text-primary-foreground">
              🍺
            </div>
            <div>
              <h1 className="text-lg font-bold">Painel Admin</h1>
              <p className="text-xs text-muted-foreground">Gestão da Unidade: {slug}</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={handleLogout} className="text-muted-foreground hover:text-destructive">
            <LogOut className="w-4 h-4 mr-2" /> Sair
          </Button>
        </div>
      </header>

      <main className="container py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full flex justify-start overflow-x-auto h-auto p-1 bg-background/50 backdrop-blur rounded-xl gap-2 mb-6 no-scrollbar border">
            <TabsTrigger value="orders" className="flex-1 min-w-[100px] gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <ShoppingBag className="w-4 h-4" /> Pedidos
            </TabsTrigger>
            <TabsTrigger value="products" className="flex-1 min-w-[100px] gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Package className="w-4 h-4" /> Produtos
            </TabsTrigger>
            <TabsTrigger value="categories" className="flex-1 min-w-[100px] gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <FolderOpen className="w-4 h-4" /> Categorias
            </TabsTrigger>
            <TabsTrigger value="addons" className="flex-1 min-w-[100px] gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Coffee className="w-4 h-4" /> Sugestões
            </TabsTrigger>
            <TabsTrigger value="promotions" className="flex-1 min-w-[100px] gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Gift className="w-4 h-4" /> Promoções
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex-1 min-w-[100px] gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Settings className="w-4 h-4" /> Config
            </TabsTrigger>
          </TabsList>

          <TabsContent value="orders" className="mt-0"><OrdersTab /></TabsContent>
          <TabsContent value="products" className="mt-0"><ProductsTab /></TabsContent>
          <TabsContent value="categories" className="mt-0"><CategoriesTab /></TabsContent>
          <TabsContent value="addons" className="mt-0"><AddonsTab /></TabsContent>
          <TabsContent value="promotions" className="mt-0"><PromotionsTab /></TabsContent>
          <TabsContent value="settings" className="mt-0"><SettingsTab /></TabsContent>
        </Tabs>
      </main>
    </div>
  );
}