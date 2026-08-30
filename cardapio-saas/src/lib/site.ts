/**
 * Constantes globais do SaaS (não de uma loja específica). Antes ficavam
 * espalhadas como strings mágicas em vários componentes (register/page.tsx,
 * PlanGuard.tsx). Centralizadas aqui e configuráveis por variável de
 * ambiente, sem precisar mexer em código pra trocar número/domínio.
 */

/** URL pública final do site, usada em metadata/SEO (og:url, sitemap, etc). */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://seusite.com.br").replace(/\/$/, "");

/**
 * WhatsApp do DONO do SaaS (você) — usados para receber avisos de negócio.
 * Não confundir com o WhatsApp de uma loja (isso fica em store_settings.phone).
 * Mantidos como dois valores separados porque já eram números diferentes no
 * código original; ajuste os defaults abaixo (ou as env vars) se forem o
 * mesmo número na prática.
 */
export const SAAS_LEADS_WHATSAPP = process.env.NEXT_PUBLIC_SAAS_LEADS_WHATSAPP || "5581994530317";
export const SAAS_UPGRADE_WHATSAPP = process.env.NEXT_PUBLIC_SAAS_UPGRADE_WHATSAPP || "5581979158040";

/**
 * Links de assinatura recorrente do Mercado Pago (ou outro processador).
 * Ficam `null` até serem configurados via env — enquanto isso, as telas que
 * os usam caem de volta pro WhatsApp manual.
 */
export const PLAN_PAYMENT_LINKS = {
  starter: process.env.NEXT_PUBLIC_MP_STARTER_LINK || null,
  pro: process.env.NEXT_PUBLIC_MP_PRO_LINK || null,
} as const;
