-- ============================================
-- SOLUÇÃO: Permitir deletar transações com CASCADE
-- ============================================

-- OPÇÃO 1: Modificar a constraint para CASCADE DELETE
-- Isso fará com que quando você deletar uma transação,
-- os logs relacionados sejam deletados automaticamente

-- 1. Remover a constraint antiga
ALTER TABLE acquirer_api_logs 
DROP CONSTRAINT IF EXISTS acquirer_api_logs_transaction_id_fkey;

-- 2. Adicionar nova constraint com ON DELETE CASCADE
ALTER TABLE acquirer_api_logs
ADD CONSTRAINT acquirer_api_logs_transaction_id_fkey 
FOREIGN KEY (transaction_id) 
REFERENCES pix_transactions(id) 
ON DELETE CASCADE;

-- Verificar a constraint
SELECT 
    tc.constraint_name, 
    tc.table_name, 
    kcu.column_name,
    rc.delete_rule
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.referential_constraints AS rc
  ON tc.constraint_name = rc.constraint_name
WHERE tc.table_name = 'acquirer_api_logs'
  AND tc.constraint_type = 'FOREIGN KEY';

-- ============================================
-- OPÇÃO 2: Atualizar a função RPC para deletar os logs primeiro
-- ============================================

CREATE OR REPLACE FUNCTION delete_failed_transaction(transaction_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_row pix_transactions%ROWTYPE;
  user_role text;
  logs_deleted integer;
BEGIN
  -- Verificar se o usuário é admin ou master
  SELECT role INTO user_role
  FROM users
  WHERE id = auth.uid();

  IF user_role NOT IN ('admin', 'master') THEN
    RAISE EXCEPTION 'Apenas administradores podem deletar transações';
  END IF;

  -- PRIMEIRO: Deletar os logs relacionados
  DELETE FROM acquirer_api_logs
  WHERE acquirer_api_logs.transaction_id = delete_failed_transaction.transaction_id;
  
  GET DIAGNOSTICS logs_deleted = ROW_COUNT;

  -- DEPOIS: Deletar a transação
  DELETE FROM pix_transactions
  WHERE id = delete_failed_transaction.transaction_id
  AND status = 'failed'
  RETURNING * INTO deleted_row;

  IF deleted_row.id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Transação não encontrada ou não está com status failed'
    );
  END IF;

  RETURN json_build_object(
    'success', true,
    'message', 'Transação e logs deletados com sucesso',
    'deleted_id', deleted_row.id,
    'logs_deleted', logs_deleted
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'message', SQLERRM
    );
END;
$$;

-- Dar permissão
GRANT EXECUTE ON FUNCTION delete_failed_transaction(uuid) TO authenticated;

-- ============================================
-- TESTE
-- ============================================

-- Ver transações falhadas
SELECT id, status, amount 
FROM pix_transactions 
WHERE status = 'failed'
LIMIT 5;

-- Ver logs relacionados
SELECT transaction_id, COUNT(*) as log_count
FROM acquirer_api_logs
WHERE transaction_id IN (
  SELECT id FROM pix_transactions WHERE status = 'failed'
)
GROUP BY transaction_id;

-- Testar a função (substitua o ID)
-- SELECT delete_failed_transaction('SEU-ID-AQUI');
