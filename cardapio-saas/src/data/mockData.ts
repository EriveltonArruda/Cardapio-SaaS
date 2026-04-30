// Interfaces atualizadas para Multi-tenancy
export interface Category {
  id: string;
  store_id: string; // ✅ Essencial para o SaaS
  name: string;
  slug: string;
  image: string;
  description?: string;
}

export interface ProductAttribute {
  cold: boolean;
  alcoholic: boolean;
  container: boolean;
}

export interface Addon {
  id: string;
  name: string;
  price: number;
  image?: string;
}

export interface Product {
  id: string;
  store_id: string; // ✅ Essencial para o SaaS
  categoryId: string;
  name: string;
  description?: string;
  price: number;
  image: string;
  attributes: ProductAttribute;
  addons?: Addon[];
  suggestedWith?: string[];
}

export interface CartItem {
  product: Product;
  quantity: number;
  selectedAddons: { addon: Addon; quantity: number }[];
  observations?: string;
}

// Exemplo de dados com vínculo de loja (ID da Expresso Bebidas por exemplo)
const SAMPLE_STORE_ID = "expresso-bebidas-id";

export const categories: Category[] = [
  {
    id: "1",
    store_id: SAMPLE_STORE_ID,
    name: "Cervejas 269ml",
    slug: "cervejas-269ml",
    image: "/placeholder.svg"
  },
  // ... outras categorias seguem o mesmo padrão
];

export const products: Product[] = [
  {
    id: "p1",
    store_id: SAMPLE_STORE_ID,
    categoryId: "1",
    name: "Cerveja gelada Spaten 269ml c\\8",
    description: "Pack com 8 latas de cerveja Spaten 269ml, gelada.",
    price: 29.99,
    image: "/placeholder.svg",
    attributes: { cold: true, alcoholic: true, container: false },
    suggestedWith: ["p15"],
  },
];

// Funções Auxiliares Dinâmicas
export function formatPrice(price: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(price);
}

// ✅ Agora recebe o nome da loja dinamicamente
export function generateWhatsAppMessage(
  cart: CartItem[],
  customerInfo: {
    name: string;
    phone: string;
    street: string;
    number: string;
    neighborhood: string;
    landmark?: string
  },
  storeName: string // Adicionado
): string {
  let message = `*✨ NOVO PEDIDO - ${storeName.toUpperCase()} ✨*\n`;
  message += `━━━━━━━━━━━━━━━━━━━━━\n\n`;

  message += `👤 *Cliente:* ${customerInfo.name}\n`;
  message += `📞 *WhatsApp:* ${customerInfo.phone}\n\n`;

  message += `📍 *ENDEREÇO DE ENTREGA:*\n`;
  message += `🏠 *Rua:* ${customerInfo.street}, Nº ${customerInfo.number}\n`;
  message += `🏘️ *Bairro:* ${customerInfo.neighborhood}\n`;

  if (customerInfo.landmark) {
    message += `🚩 *Ref:* ${customerInfo.landmark}\n`;
  }

  message += `\n━━━━━━━━━━━━━━━━━━━━━\n`;
  message += `📦 *ITENS DO PEDIDO:*\n\n`;

  let subtotal = 0;

  cart.forEach((item, index) => {
    const itemTotal = item.product.price * item.quantity;
    subtotal += itemTotal;

    message += `${index + 1}. *${item.product.name}*\n`;
    message += `   ${item.quantity}x ${formatPrice(item.product.price)} = ${formatPrice(itemTotal)}\n`;

    item.selectedAddons?.forEach((addonItem) => {
      if (addonItem.quantity > 0) {
        const addonTotal = addonItem.addon.price * addonItem.quantity;
        subtotal += addonTotal;
        message += `   + ${addonItem.quantity}x ${addonItem.addon.name} (${formatPrice(addonTotal)})\n`;
      }
    });

    if (item.observations) {
      message += `   📝 Obs: ${item.observations}\n`;
    }
    message += `\n`;
  });

  message += `━━━━━━━━━━━━━━━━━━━━━\n`;
  message += `💰 *TOTAL: ${formatPrice(subtotal)}*\n\n`;
  message += `_Obrigado pela preferência! 🍻_`;

  return message;
}

// ✅ Agora recebe o número dinamicamente
export function openWhatsApp(message: string, phoneNumber: string): void {
  const cleanNumber = phoneNumber.replace(/\D/g, "");
  const encodedMessage = encodeURIComponent(message);
  const url = `https://wa.me/${cleanNumber}?text=${encodedMessage}`;
  window.open(url, "_blank");
}