-- ==========================================
-- Criar Tabela de Transações
-- ==========================================

-- 1. Criar tabela transactions (se não existir)
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending',
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Adicionar colunas se não existirem (caso tabela já exista)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='transactions' AND column_name='type') THEN
    ALTER TABLE transactions ADD COLUMN type TEXT NOT NULL DEFAULT 'credit';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='transactions' AND column_name='description') THEN
    ALTER TABLE transactions ADD COLUMN description TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='transactions' AND column_name='status') THEN
    ALTER TABLE transactions ADD COLUMN status TEXT DEFAULT 'pending';
  END IF;
END $$;

-- 2. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_transactions_user ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at DESC);

-- 3. Criar tabela de bloqueios de saldo (se não existir)
CREATE TABLE IF NOT EXISTS balance_locks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  amount DECIMAL(15,2) NOT NULL,
  reason TEXT NOT NULL,
  lock_type TEXT DEFAULT 'manual',
  locked_at TIMESTAMP DEFAULT NOW(),
  unlocked_at TIMESTAMP,
  status TEXT DEFAULT 'active',
  locked_by UUID REFERENCES users(id),
  metadata JSONB
);

-- 4. Criar índices para balance_locks
CREATE INDEX IF NOT EXISTS idx_balance_locks_user ON balance_locks(user_id);
CREATE INDEX IF NOT EXISTS idx_balance_locks_status ON balance_locks(status);

-- 5. Desabilitar RLS para visualização
ALTER TABLE transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE balance_locks DISABLE ROW LEVEL SECURITY;

-- 6. Inserir algumas transações de exemplo
-- Primeiro, buscar IDs de usuários existentes
DO $$
DECLARE
  user_ids UUID[];
  user_id UUID;
  i INTEGER;
BEGIN
  -- Buscar até 5 usuários quaisquer
  SELECT ARRAY_AGG(id) INTO user_ids FROM users LIMIT 5;
  
  -- Se não houver usuários, não insere nada
  IF user_ids IS NULL OR array_length(user_ids, 1) = 0 THEN
    RAISE NOTICE 'Nenhum usuário encontrado. Não é possível inserir transações de exemplo.';
    RETURN;
  END IF;
  
  -- Inserir 20 transações distribuídas entre os usuários
  FOR i IN 1..20 LOOP
    -- Selecionar usuário aleatório da lista
    user_id := user_ids[1 + floor(random() * array_length(user_ids, 1))::int];
    
    INSERT INTO transactions (user_id, type, amount, description, status, payment_method) VALUES (
      user_id,
      CASE 
        WHEN random() < 0.4 THEN 'credit'
        WHEN random() < 0.7 THEN 'debit'
        WHEN random() < 0.85 THEN 'pix_send'
        ELSE 'pix_receive'
      END,
      (50 + random() * 950)::DECIMAL(15,2),
      CASE 
        WHEN random() < 0.25 THEN 'PIX Recebido'
        WHEN random() < 0.5 THEN 'PIX Enviado'
        WHEN random() < 0.75 THEN 'Depósito'
        ELSE 'Saque'
      END,
      CASE 
        WHEN random() < 0.7 THEN 'completed'
        WHEN random() < 0.9 THEN 'pending'
        ELSE 'failed'
      END,
      CASE 
        WHEN random() < 0.5 THEN 'pix'
        WHEN random() < 0.8 THEN 'bank_transfer'
        ELSE 'cash'
      END
    );
  END LOOP;
  
  RAISE NOTICE 'Inseridas 20 transações de exemplo';
END $$;

-- ==========================================
-- Consultas Úteis
-- ==========================================

-- Ver total de transações
SELECT COUNT(*) as total FROM transactions;

-- Ver transações recentes
SELECT 
  t.id,
  u.name as user_name,
  t.type,
  t.amount,
  t.status,
  t.description,
  t.created_at
FROM transactions t
LEFT JOIN users u ON u.id = t.user_id
ORDER BY t.created_at DESC
LIMIT 10;

-- Estatísticas por tipo
SELECT 
  type,
  status,
  COUNT(*) as total,
  SUM(amount) as volume
FROM transactions
GROUP BY type, status
ORDER BY type, status;
