import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          name: string
          role: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          name: string
          role?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string
          role?: string
          created_at?: string
          updated_at?: string
        }
      }
      transactions: {
        Row: {
          id: string
          user_id: string
          amount: number
          status: string
          payment_method: string
          description: string | null
          customer_name: string | null
          customer_email: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          amount: number
          status: string
          payment_method: string
          description?: string | null
          customer_name?: string | null
          customer_email?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          amount?: number
          status?: string
          payment_method?: string
          description?: string | null
          customer_name?: string | null
          customer_email?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      invoices: {
        Row: {
          id: string
          user_id: string
          transaction_id: string
          amount: number
          due_date: string
          status: string
          created_at: string
          updated_at: string
        }
      }
      rewards: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          points: number
          status: string
          created_at: string
          updated_at: string
        }
      }
      checkout_links: {
        Row: {
          id: string
          user_id: string
          title: string
          amount: number
          link_code: string
          status: string
          expires_at: string | null
          created_at: string
          updated_at: string
        }
      }
      settings: {
        Row: {
          id: string
          user_id: string
          key: string
          value: any
          created_at: string
          updated_at: string
        }
      }
      messages: {
        Row: {
          id: string
          user_id: string
          subject: string
          message: string
          status: string
          created_at: string
          updated_at: string
        }
      }
    }
  }
}
