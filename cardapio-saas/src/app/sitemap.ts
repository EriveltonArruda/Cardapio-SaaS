import type { MetadataRoute } from "next";
import { supabase } from "@/lib/supabase/client";
import { SITE_URL } from "@/lib/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: SITE_URL, changeFrequency: "monthly", priority: 0.5 },
    { url: `${SITE_URL}/register`, changeFrequency: "monthly", priority: 0.5 },
  ];

  // Cada loja ativa vira uma entrada no sitemap (cardápio público real).
  const { data: stores } = await supabase
    .from("stores")
    .select("slug, created_at")
    .eq("is_active", true);

  const storeRoutes: MetadataRoute.Sitemap = (stores || []).map((store) => ({
    url: `${SITE_URL}/${store.slug}`,
    lastModified: store.created_at ? new Date(store.created_at) : undefined,
    changeFrequency: "daily",
    priority: 0.8,
  }));

  return [...staticRoutes, ...storeRoutes];
}
