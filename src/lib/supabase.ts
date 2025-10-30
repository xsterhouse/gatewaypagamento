import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl) {
  throw new Error(
    '❌ VITE_SUPABASE_URL não configurada!\n\n' +
    'Configure as variáveis de ambiente:\n' +
    '1. Copie .env.example para .env\n' +
    '2. Adicione suas credenciais do Supabase\n' +
    '3. Reinicie o servidor\n\n' +
    'Em produção (Vercel):\n' +
    '1. Vá em Settings → Environment Variables\n' +
    '2. Adicione VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY\n' +
    '3. Faça redeploy'
  )
}

if (!supabaseAnonKey) {
  throw new Error(
    '❌ VITE_SUPABASE_ANON_KEY não configurada!\n\n' +
    'Configure as variáveis de ambiente:\n' +
    '1. Copie .env.example para .env\n' +
    '2. Adicione suas credenciais do Supabase\n' +
    '3. Reinicie o servidor\n\n' +
    'Em produção (Vercel):\n' +
    '1. Vá em Settings → Environment Variables\n' +
    '2. Adicione VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY\n' +
    '3. Faça redeploy'
  )
}

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
