import { supabase } from '@/lib/supabase'

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    console.log('🗄️ Criando tabela de transações de boleto...')

    // SQL para criar a tabela
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS boleto_transactions (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id UUID REFERENCES auth.users(id) NOT NULL,
        amount DECIMAL(15,2) NOT NULL,
        description TEXT,
        charge_id VARCHAR(255) NOT NULL,
        loc_id VARCHAR(255) NOT NULL,
        status VARCHAR(50) DEFAULT 'pending',
        due_date DATE NOT NULL,
        barcode TEXT,
        linha_digitavel TEXT,
        pix_code TEXT,
        paid_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      -- Criar índices
      CREATE INDEX IF NOT EXISTS idx_boleto_user_id ON boleto_transactions(user_id);
      CREATE INDEX IF NOT EXISTS idx_boleto_status ON boleto_transactions(status);
      CREATE INDEX IF NOT EXISTS idx_boleto_charge_id ON boleto_transactions(charge_id);
    `

    const { error } = await supabase.rpc('exec_sql', { sql_query: createTableSQL })

    if (error) {
      console.error('❌ Erro ao criar tabela:', error)
      return res.status(500).json({ error: 'Failed to create table' })
    }

    console.log('✅ Tabela boleto_transactions criada com sucesso!')

    return res.status(200).json({
      success: true,
      message: 'Tabela boleto_transactions criada com sucesso!'
    })

  } catch (error: any) {
    console.error('❌ Erro ao criar tabela:', error)
    return res.status(500).json({ 
      success: false, 
      error: error.message 
    })
  }
}
