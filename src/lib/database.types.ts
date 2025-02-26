export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      restaurants: {
        Row: {
          id: string
          name: string
          address: string
          phone: string | null
          email: string | null
          alias: string
          user_id: string
          created_at: string
          updated_at: string
          currency_code: string
          business_type: string
        }
        Insert: {
          id?: string
          name: string
          address: string
          phone?: string | null
          email?: string | null
          alias: string
          user_id: string
          created_at?: string
          updated_at?: string
          currency_code?: string
          business_type?: string
        }
        Update: {
          id?: string
          name?: string
          address?: string
          phone?: string | null
          email?: string | null
          alias?: string
          user_id?: string
          created_at?: string
          updated_at?: string
          currency_code?: string
          business_type?: string
        }
      }
      menu_categories: {
        Row: {
          id: string
          name: string
          description: string | null
          order: number
          restaurant_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          order?: number
          restaurant_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          order?: number
          restaurant_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      menu_items: {
        Row: {
          id: string
          name: string
          description: string | null
          price: number
          category_id: string
          order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          price: number
          category_id: string
          order?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          price?: number
          category_id?: string
          order?: number
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}