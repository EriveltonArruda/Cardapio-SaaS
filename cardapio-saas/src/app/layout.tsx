import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import { Providers } from "@/components/Providers";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

// ✅ SEO Turbinado para WhatsApp, Instagram e Google
export const metadata: Metadata = {
  title: {
    default: "SaaS Cardápio Digital | Venda mais pelo WhatsApp",
    template: "%s | Cardápio Digital"
  },
  description: "Crie seu cardápio online em minutos, aceite pedidos pelo WhatsApp e organize suas vendas de forma simples e rápida.",
  openGraph: {
    title: "SaaS Cardápio Digital",
    description: "A forma mais rápida de vender seus produtos no WhatsApp. Crie seu cardápio em minutos!",
    url: "https://seusite.com.br", // 🚀 TROQUE PELO SEU DOMÍNIO FINAL DEPOIS
    siteName: "SaaS Cardápio Digital",
    images: [
      {
        url: "/og-image.png", // 🚀 DICA: Crie uma imagem de 1200x630px e coloque na pasta public
        width: 1200,
        height: 630,
        alt: "Preview do SaaS Cardápio Digital",
      },
    ],
    locale: "pt_BR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "SaaS Cardápio Digital",
    description: "Crie seu cardápio online em minutos.",
    images: ["/og-image.png"],
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