import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Admin e área de carrinho/checkout não têm valor de indexação e
        // ainda por cima variam por sessão — sem sentido no Google.
        disallow: ["/*/admin", "/*/cart"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
