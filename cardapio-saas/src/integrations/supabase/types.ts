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
          primary_color: string | null
          secondary_color: string | null
          is_active: boolean | null
          is_open: boolean | null
          address: string | null
        }
        Insert: {
          id?: string
          name: string
          slug: string
          logo_url?: string | null
          created_at?: string | null
          updated_at?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          is_active?: boolean | null
          is_open?: boolean | null
          address?: string | null
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          logo_url?: string | null
          created_at?: string | null
          updated_at?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          is_active?: boolean | null
          is_open?: boolean | null
          address?: string | null
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
      orders: {
        Row: {
          id: string
          store_id: string
          customer_name: string
          customer_phone: string
          address_street: string
          address_number: string
          address_neighborhood: string
          address_landmark: string
          items: Json
          total_amount: number
          status: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          store_id: string
          customer_name: string
          customer_phone: string
          address_street: string
          address_number: string
          address_neighborhood: string
          address_landmark: string
          items: Json
          total_amount: number
          status?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          store_id?: string
          customer_name?: string
          customer_phone?: string
          address_street?: string
          address_number?: string
          address_neighborhood?: string
          address_landmark?: string
          items?: Json
          total_amount?: number
          status?: string | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_store_id_fkey"
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
          promotion_id: string | null
          name: string
          description: string | null
          price: number
          original_price: number | null
          promo_price: number | null
          image_url: string | null
          is_cold: boolean | null
          is_alcoholic: boolean | null
          has_container: boolean | null
          is_suggestion: boolean | null
          sort_order: number | null
          is_active: boolean | null
          is_available: boolean | null
          is_promo: boolean | null
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
          original_price?: number | null
          promo_price?: number | null
          image_url?: string | null
          is_cold?: boolean | null
          is_alcoholic?: boolean | null
          has_container?: boolean | null
          is_suggestion?: boolean | null
          sort_order?: number | null
          is_active?: boolean | null
          is_available?: boolean | null
          is_promo?: boolean | null
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
          original_price?: number | null
          promo_price?: number | null
          image_url?: string | null
          is_cold?: boolean | null
          is_alcoholic?: boolean | null
          has_container?: boolean | null
          is_suggestion?: boolean | null
          sort_order?: number | null
          is_active?: boolean | null
          is_available?: boolean | null
          is_promo?: boolean | null
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
      promotions: {
        Row: {
          id: string
          store_id: string
          title: string
          description: string | null
          image_url: string | null
          is_active: boolean | null
          sort_order: number
          created_at: string | null
        }
        Insert: {
          id?: string
          store_id: string
          title: string
          description?: string | null
          image_url?: string | null
          is_active?: boolean | null
          sort_order?: number
          created_at?: string | null
        }
        Update: {
          id?: string
          store_id?: string
          title?: string
          description?: string | null
          image_url?: string | null
          is_active?: boolean | null
          sort_order?: number
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
      store_settings: {
        Row: {
          id: string
          store_id: string
          store_name: string
          phone: string | null
          address: string | null
          logo_url: string | null
          banner_url: string | null
          primary_color: string | null
          secondary_color: string | null
          opening_hours_week: string | null
          opening_hours_weekend: string | null
          opening_hours_sunday: string | null
          is_open: boolean | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          store_id: string
          store_name: string
          phone?: string | null
          address?: string | null
          logo_url?: string | null
          banner_url?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          opening_hours_week?: string | null
          opening_hours_weekend?: string | null
          opening_hours_sunday?: string | null
          is_open?: boolean | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          store_id?: string
          store_name?: string
          phone?: string | null
          address?: string | null
          logo_url?: string | null
          banner_url?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          opening_hours_week?: string | null
          opening_hours_weekend?: string | null
          opening_hours_sunday?: string | null
          is_open?: boolean | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "store_settings_store_id_fkey"
            columns: ["store_id"]
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