import type { Metadata } from "next";
import { supabase } from "@/lib/supabase/client";
import { SITE_URL } from "@/lib/site";
import { StoreHomeClient } from "./StoreHomeClient";

interface StoreRow {
  name: string;
  store_settings: { store_name?: string | null; logo_url?: string | null; address?: string | null } | { store_name?: string | null; logo_url?: string | null; address?: string | null }[] | null;
}

// Metadata dinâmica por loja: antes toda loja compartilhava o mesmo título/
// descrição genéricos do layout raiz. Agora cada cardápio tem título,
// descrição e preview de compartilhamento (WhatsApp/redes) com o nome real
// da loja, o que ajuda tanto no compartilhamento quanto na indexação.
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;

  // ✅ Cast necessário: os tipos gerados do Supabase estão desatualizados
  // (mesmo motivo documentado em StoreContext.tsx e register/page.tsx)
  const { data } = (await (supabase.from("stores") as any)
    .select("name, store_settings (store_name, logo_url, address)")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle()) as { data: StoreRow | null };

  if (!data) {
    return { title: "Cardápio não encontrado" };
  }

  const settings = Array.isArray(data.store_settings) ? data.store_settings[0] : data.store_settings;
  const storeName = settings?.store_name || data.name;
  const description = `Confira o cardápio digital de ${storeName} e faça seu pedido direto pelo WhatsApp.`;

  return {
    title: storeName,
    description,
    openGraph: {
      title: storeName,
      description,
      url: `${SITE_URL}/${slug}`,
      images: settings?.logo_url ? [{ url: settings.logo_url }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: storeName,
      description,
      images: settings?.logo_url ? [settings.logo_url] : undefined,
    },
  };
}

export default function StoreHomePage() {
  return <StoreHomeClient />;
}
