-- ============================================
-- CRIAR FUNÇÃO RPC PARA DELETAR TRANSAÇÕES FALHADAS
-- ============================================

-- Esta função permite que admins deletem transações falhadas
-- mesmo se houver problemas com RLS

CREATE OR REPLACE FUNCTION delete_failed_transaction(transaction_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER -- Executa com privilégios do dono da função
AS $$
DECLARE
  deleted_row pix_transactions%ROWTYPE;
  user_role text;
BEGIN
  -- Verificar se o usuário é admin ou master
  SELECT role INTO user_role
  FROM users
  WHERE id = auth.uid();

  -- Se não for admin/master, retornar erro
  IF user_role NOT IN ('admin', 'master') THEN
    RAISE EXCEPTION 'Apenas administradores podem deletar transações';
  END IF;

  -- Deletar a transação e retornar os dados deletados
  DELETE FROM pix_transactions
  WHERE id = transaction_id
  AND status = 'failed' -- Só permite deletar transações falhadas
  RETURNING * INTO deleted_row;

  -- Se nenhuma linha foi deletada
  IF deleted_row.id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Transação não encontrada ou não está com status failed'
    );
  END IF;

  -- Retornar sucesso
  RETURN json_build_object(
    'success', true,
    'message', 'Transação deletada com sucesso',
    'deleted_id', deleted_row.id
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'message', SQLERRM
    );
END;
$$;

-- Dar permissão para usuários autenticados executarem a função
GRANT EXECUTE ON FUNCTION delete_failed_transaction(uuid) TO authenticated;

-- ============================================
-- TESTE DA FUNÇÃO
-- ============================================

-- Verificar seu role
SELECT id, email, role FROM users WHERE id = auth.uid();

-- Ver transações falhadas disponíveis
SELECT id, status, amount, created_at 
FROM pix_transactions 
WHERE status = 'failed'
ORDER BY created_at DESC
LIMIT 5;

-- Testar a função (substitua o ID)
-- SELECT delete_failed_transaction('SEU-ID-AQUI');
