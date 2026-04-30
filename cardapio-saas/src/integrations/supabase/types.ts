export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      stores: {
        Row: {
          id: string
          name: string
          slug: string
          logo_url: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          name: string
          slug: string
          logo_url?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          logo_url?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      addons: {
        Row: {
          id: string
          store_id: string
          name: string
          price: number
          is_active: boolean | null
          created_at: string | null
        }
        Insert: {
          id?: string
          store_id: string
          name: string
          price?: number
          is_active?: boolean | null
          created_at?: string | null
        }
        Update: {
          id?: string
          store_id?: string
          name?: string
          price?: number
          is_active?: boolean | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "addons_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          }
        ]
      }
      categories: {
        Row: {
          id: string
          store_id: string
          name: string
          slug: string | null
          icon: string | null
          sort_order: number | null
          is_active: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          store_id: string
          name: string
          slug?: string | null
          icon?: string | null
          sort_order?: number | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          store_id?: string
          name?: string
          slug?: string | null
          icon?: string | null
          sort_order?: number | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "categories_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          }
        ]
      }
      products: {
        Row: {
          id: string
          store_id: string
          category_id: string | null
          promotion_id: string | null // ✅ Adicionado para o vínculo com ofertas
          name: string
          description: string | null
          price: number
          image_url: string | null
          is_cold: boolean | null
          is_alcoholic: boolean | null
          has_container: boolean | null
          is_suggestion: boolean | null
          sort_order: number | null
          is_active: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          store_id: string
          category_id?: string | null
          promotion_id?: string | null
          name: string
          description?: string | null
          price: number
          image_url?: string | null
          is_cold?: boolean | null
          is_alcoholic?: boolean | null
          has_container?: boolean | null
          is_suggestion?: boolean | null
          sort_order?: number | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          store_id?: string
          category_id?: string | null
          promotion_id?: string | null
          name?: string
          description?: string | null
          price?: number
          image_url?: string | null
          is_cold?: boolean | null
          is_alcoholic?: boolean | null
          has_container?: boolean | null
          is_suggestion?: boolean | null
          sort_order?: number | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_promotion_id_fkey"
            columns: ["promotion_id"]
            isOneToOne: false
            referencedRelation: "promotions"
            referencedColumns: ["id"]
          }
        ]
      }
      promotions: { // ✅ TABELA DE PROMOÇÕES COMPLETA
        Row: {
          id: string
          store_id: string
          title: string
          description: string | null
          image_url: string | null
          is_active: boolean | null
          created_at: string | null
        }
        Insert: {
          id?: string
          store_id: string
          title: string
          description?: string | null
          image_url?: string | null
          is_active?: boolean | null
          created_at?: string | null
        }
        Update: {
          id?: string
          store_id?: string
          title?: string
          description?: string | null
          image_url?: string | null
          is_active?: boolean | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "promotions_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          }
        ]
      }
      product_suggestions: {
        Row: {
          id: string
          product_id: string
          suggested_product_id: string
          created_at: string | null
        }
        Insert: {
          id?: string
          product_id: string
          suggested_product_id: string
          created_at?: string | null
        }
        Update: {
          id?: string
          product_id?: string
          suggested_product_id?: string
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_suggestions_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_suggestions_suggested_product_id_fkey"
            columns: ["suggested_product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          }
        ]
      }
      store_settings: {
        Row: {
          id: string
          delivery_fee: number | null
          minimum_order: number | null
          opening_hours: string
          updated_at: string | null
          whatsapp_number: string
          created_at: string | null
        }
        Insert: {
          id: string
          delivery_fee?: number | null
          minimum_order?: number | null
          opening_hours?: string
          updated_at?: string | null
          whatsapp_number: string
          created_at?: string | null
        }
        Update: {
          id?: string
          delivery_fee?: number | null
          minimum_order?: number | null
          opening_hours?: string
          updated_at?: string | null
          whatsapp_number?: string
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "store_settings_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "stores"
            referencedColumns: ["id"]
          }
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
          store_id: string
          created_at: string | null
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
          store_id: string
          created_at?: string | null
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
          store_id?: string
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: { [_ in never]: never }
    Functions: {
      has_role: {
        Args: { _role: Database["public"]["Enums"]["app_role"]; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
    }
    CompositeTypes: { [_ in never]: never }
  }
}

// Helpers de utilitários para facilitar o uso no frontend
type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">
type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  T extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
> = (DefaultSchema["Tables"] & DefaultSchema["Views"])[T] extends { Row: infer R } ? R : never

export type TablesInsert<
  T extends keyof DefaultSchema["Tables"]
> = DefaultSchema["Tables"][T] extends { Insert: infer I } ? I : never

export type TablesUpdate<
  T extends keyof DefaultSchema["Tables"]
> = DefaultSchema["Tables"][T] extends { Update: infer U } ? U : never

export type Enums<
  T extends keyof DefaultSchema["Enums"]
> = DefaultSchema["Enums"][T]