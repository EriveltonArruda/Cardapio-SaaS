// src/types/index.ts

export type PlanType = 'starter' | 'pro';

export interface Store {
  id: string;
  user_id: string; // O dono da loja
  name: string;
  slug: string;
  plan_type: PlanType;
  primary_color: string;
  secondary_color: string;
  text_color: string;
  logo_url: string | null;
  is_open: boolean;
  is_active: boolean;
  address?: string | null;             // ✅ Adicionado | null
  whatsapp_number?: string | null;     // ✅ Adicionado | null
  opening_hours_week?: string | null;    // ✅ Adicionado | null
  opening_hours_weekend?: string | null; // ✅ Adicionado | null
  opening_hours_sunday?: string | null;  // ✅ Adicionado | null
  accept_pix: boolean;
  accept_card_credit: boolean;
  accept_card_debt: boolean;
  accept_cash: boolean;
  pix_key?: string | null;
}

export interface Product {
  id: string;
  store_id: string;
  category_id: string | null;
  name: string;
  description: string | null;
  price: number;
  promo_price?: number | null;
  image_url: string | null;
  is_available: boolean;
  is_active: boolean;
  sort_order: number;
  is_cold: boolean;
  is_alcoholic: boolean;
  has_container: boolean;
  is_suggestion: boolean;
  is_featured?: boolean;
  is_artisanal?: boolean;
  is_new?: boolean;
  is_veggie?: boolean;
  is_wood_fire?: boolean;
}

export interface Category {
  id: string;
  store_id: string;
  name: string;
  slug?: string | null; // ✅ Opcional e aceita null
  icon?: string | null; // ✅ Opcional e aceita null
  is_active?: boolean | null; // ✅ O segredo para matar o erro do CategoriesTab
  sort_order?: number | null;
}

export interface ProductAddon {
  id: string;
  store_id: string;
  name: string;
  price: number;
  category_id: string | null;
  is_active: boolean;
  created_at?: string;
  // Join opcional
  categories?: {
    name: string;
  } | null;
}

export interface StoreSettings {
  id?: string;
  store_id: string;
  store_name: string;
  phone?: string | null;
  address?: string | null;
  opening_hours_week?: string | null;
  opening_hours_weekend?: string | null;
  opening_hours_sunday?: string | null;
  logo_url?: string | null;
  primary_color: string;
  secondary_color?: string | null;
  text_color: string;
  is_open: boolean;
  accept_pix: boolean;
  accept_card_credit: boolean;
  accept_card_debt: boolean;
  accept_cash: boolean;
  pix_key?: string | null;
  updated_at?: string;
}

export interface CartSuggestion {
  id: string;
  store_id: string;
  product_id: string;
  category_id?: string | null;
  category_ids?: string[] | null;
  is_active: boolean;
  created_at?: string;
  // Joins para visualização na listagem
  products?: {
    name: string;
    price: number;
    image_url: string | null;
  };
}

export interface Order {
  id: string;
  store_id: string;
  customer_name: string;
  customer_phone: string;
  total_amount: number;
  payment_method: string;
  status: 'pendente' | 'concluido' | 'cancelado';
  address_street: string;
  address_number: string;
  address_neighborhood: string;
  address_landmark?: string | null;
  items: any; // Armazena o JSON dos produtos, adicionais e observações
  created_at: string;
}

export interface Coupon {
  id: string;
  store_id: string;
  code: string;
  type: 'fixed' | 'percentage';
  value: number;
  min_purchase: number;
  is_active: boolean;
  created_at?: string;
}

export interface Promotion {
  id: string;
  store_id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  is_active: boolean;
  sort_order: number;
}