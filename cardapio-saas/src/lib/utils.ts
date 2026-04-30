import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Utilitário para mesclar classes Tailwind de forma inteligente
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formata valores numéricos para a moeda Real (BRL)
 */
export const formatPrice = (value: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
};

/**
 * Transforma strings em slugs amigáveis para URLs
 * Ex: "Cerveja Gelada" -> "cerveja-gelada"
 */
export function slugify(text: string) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]+/g, "")
    .replace(/--+/g, "-");
}

/**
 * Remove caracteres não numéricos de números de WhatsApp
 */
export function cleanWhatsAppNumber(phone: string) {
  return phone.replace(/\D/g, "");
}