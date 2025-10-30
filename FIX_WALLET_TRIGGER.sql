-- ========================================
-- FIX TRIGGER DE CRIAÇÃO DE CARTEIRA
-- ========================================

-- 1. Remover coluna currency_name se existir (provavelmente não existe)
ALTER TABLE wallets DROP COLUMN IF EXISTS currency_name;

-- 2. Recriar função de criação de carteira padrão SEM currency_name
CREATE OR REPLACE FUNCTION create_default_wallet()
RETURNS TRIGGER AS $$
BEGIN
  -- Criar carteira BRL automaticamente para novos usuários
  INSERT INTO public.wallets (
    user_id,
    currency_code,
    currency_type,
    balance,
    available_balance,
    blocked_balance,
    is_active
  ) VALUES (
    NEW.id,
    'BRL',
    'fiat',
    0,
    0,
    0,
    true
  )
  ON CONFLICT (user_id, currency_code) DO NOTHING;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log o erro mas não falha a criação do usuário
    RAISE WARNING 'Erro ao criar carteira padrão: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Verificar estrutura da tabela wallets
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns
WHERE table_name = 'wallets'
ORDER BY ordinal_position;
