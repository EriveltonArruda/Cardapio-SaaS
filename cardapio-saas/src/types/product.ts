// src/types/product.ts
export interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category_id: string | null;
  image_url: string | null;
  is_cold: boolean | null;
  is_alcoholic: boolean | null;
  has_container: boolean | null;
  is_active: boolean | null;
  is_suggestion: boolean | null;
  sort_order: number | null;
  is_available: boolean | null;
  store_id: string;
  categories?: { name: string; } | null;
}