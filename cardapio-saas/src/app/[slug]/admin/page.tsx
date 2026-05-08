'use client'

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";
import { useStore } from "@/contexts/StoreContext"; // ✅ Importado
import { useAuth } from "@/contexts/AuthContext";   // ✅ Importado
import {
  LogOut,
  Package,
  FolderOpen,
  Settings,
  Loader2,
  Gift,
  Coffee,
  ShoppingBag,
  Sun,
  Moon,
  Layers,
  ShieldAlert
} from "lucide-react";

import { PlanBadge } from "@/components/admin/PlanBadge";
import { PlanGuard } from "@/components/admin/PlanGuard";
import { ProductsTab } from "@/components/admin/ProductsTab";
import { CategoriesTab } from "@/components/admin/CategoriesTab";
import { SettingsTab } from "@/components/admin/SettingsTab";
import { AddonsTab } from "@/components/admin/AddonsTab";
import { PromotionsTab } from "@/components/admin/PromotionsTab";
import { OrdersTab } from "@/components/admin/OrdersTab";
import { ProductAddonsTab } from "@/components/admin/ProductAddonsTab";

export default function Admin() {
  const params = useParams();
  const slug = params?.slug as string;
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { store, isLoading: isStoreLoading, isOwner } = useStore(); // ✅ Pegando isOwner
  const { session } = useAuth(); // ✅ Pegando sessão para mostrar o e-mail

  const [activeTab, setActiveTab] = useState("orders");
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.clear();
    router.push(`/${slug}/admin/login`);
  };

  // 🛡️ TELA DE CARREGAMENTO REFORÇADA
  if (isStoreLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-muted-foreground font-mono text-xs uppercase tracking-widest">Sincronizando segurança...</p>
      </div>
    );
  }

  // 🛡️ TRAVA DE SEGURANÇA: Se não for o dono, bloqueia acesso
  if (!isStoreLoading && !isOwner) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6 text-center">
        <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center text-destructive mb-4">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h1 className="text-xl font-black uppercase">Acesso Negado</h1>
        <p className="text-muted-foreground max-w-xs mt-2">
          Seu usuário ({session?.user?.email}) não é o dono da unidade <span className="font-bold text-foreground">{slug}</span>.
        </p>
        <Button onClick={() => router.push('/')} variant="outline" className="mt-6 uppercase font-bold">
          Voltar ao Início
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20 transition-colors duration-300">
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="container flex items-center justify-between py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground shadow-sm">
              <Settings className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-foreground">Painel Admin</h1>
                <PlanBadge />
              </div>
              <div className="flex flex-col">
                <p className="text-[10px] text-muted-foreground uppercase font-black">Unidade: {slug}</p>
                {/* ✅ MOSTRA O E-MAIL DO LOGADO */}
                <p className="text-[9px] text-primary font-bold">{session?.user?.email}</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {mounted && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="hover:bg-muted text-muted-foreground cursor-pointer transition-colors"
              >
                {theme === 'dark' ? <Sun className="w-4 h-4 text-yellow-400" /> : <Moon className="w-4 h-4" />}
              </Button>
            )}

            <div className="h-6 w-[1px] bg-border mx-1" />

            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-muted-foreground hover:text-destructive cursor-pointer"
            >
              <LogOut className="w-4 h-4 mr-2" /> Sair
            </Button>
          </div>
        </div>
      </header>

      <main className="container py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full flex justify-start overflow-x-auto h-auto p-1 bg-muted/50 backdrop-blur rounded-xl gap-2 mb-6 no-scrollbar border border-border">
            <TabsTrigger value="orders" className="flex-1 min-w-25 gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <ShoppingBag className="w-4 h-4" /> Pedidos
            </TabsTrigger>
            <TabsTrigger value="products" className="flex-1 min-w-25 gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Package className="w-4 h-4" /> Produtos
            </TabsTrigger>
            <TabsTrigger value="categories" className="flex-1 min-w-25 gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <FolderOpen className="w-4 h-4" /> Categorias
            </TabsTrigger>
            <TabsTrigger value="product_addons" className="flex-1 min-w-25 gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Layers className="w-4 h-4" /> Complementos
            </TabsTrigger>
            <TabsTrigger value="addons" className="flex-1 min-w-25 gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Coffee className="w-4 h-4" /> Sugestões
            </TabsTrigger>
            <TabsTrigger value="promotions" className="flex-1 min-w-25 gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Gift className="w-4 h-4" /> Promoções
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex-1 min-w-25 gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Settings className="w-4 h-4" /> Config
            </TabsTrigger>
          </TabsList>

          <TabsContent value="orders" className="mt-0"><OrdersTab /></TabsContent>
          <TabsContent value="products" className="mt-0"><ProductsTab /></TabsContent>
          <TabsContent value="categories" className="mt-0"><CategoriesTab /></TabsContent>

          <TabsContent value="product_addons" className="mt-0">
            <PlanGuard featureName="Complementos e Adicionais">
              <ProductAddonsTab />
            </PlanGuard>
          </TabsContent>

          <TabsContent value="addons" className="mt-0"><AddonsTab /></TabsContent>

          <TabsContent value="promotions" className="mt-0">
            <PlanGuard featureName="Gestão de Promoções">
              <PromotionsTab />
            </PlanGuard>
          </TabsContent>

          <TabsContent value="settings" className="mt-0"><SettingsTab /></TabsContent>
        </Tabs>
      </main>
    </div>
  );
}