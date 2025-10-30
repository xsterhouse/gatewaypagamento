-- ==========================================
-- Políticas de Segurança para activity_logs
-- ==========================================

-- 1. Desabilitar RLS temporariamente para debug (REMOVA EM PRODUÇÃO)
ALTER TABLE activity_logs DISABLE ROW LEVEL SECURITY;

-- OU se preferir manter RLS ativo, use as políticas abaixo:

-- 2. Habilitar RLS
-- ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- 3. Permitir admins lerem todos os logs
-- CREATE POLICY "Admins podem ler logs"
-- ON activity_logs FOR SELECT
-- TO authenticated
-- USING (
--   EXISTS (
--     SELECT 1 FROM users 
--     WHERE users.id = auth.uid() 
--     AND users.role = 'admin'
--   )
-- );

-- 4. Permitir inserção de logs pelo sistema
-- CREATE POLICY "Sistema pode inserir logs"
-- ON activity_logs FOR INSERT
-- TO authenticated
-- WITH CHECK (true);

-- ==========================================
-- Verificar se há logs na tabela
-- ==========================================

SELECT COUNT(*) as total_logs FROM activity_logs;

SELECT * FROM activity_logs ORDER BY created_at DESC LIMIT 5;
