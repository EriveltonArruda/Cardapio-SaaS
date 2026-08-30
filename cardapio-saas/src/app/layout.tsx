import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import { Providers } from "@/components/Providers";
import { SITE_URL } from "@/lib/site";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

// ✅ SEO Turbinado para WhatsApp, Instagram e Google
// Nota: a imagem de OG não é declarada aqui — vem de src/app/opengraph-image.tsx,
// que o Next detecta pela convenção de nome e injeta a tag sozinho.
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "SaaS Cardápio Digital | Venda mais pelo WhatsApp",
    template: "%s | Cardápio Digital"
  },
  description: "Crie seu cardápio online em minutos, aceite pedidos pelo WhatsApp e organize suas vendas de forma simples e rápida.",
  openGraph: {
    title: "SaaS Cardápio Digital",
    description: "A forma mais rápida de vender seus produtos no WhatsApp. Crie seu cardápio em minutos!",
    url: SITE_URL,
    siteName: "SaaS Cardápio Digital",
    locale: "pt_BR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "SaaS Cardápio Digital",
    description: "Crie seu cardápio online em minutos.",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased transition-colors duration-300`}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}