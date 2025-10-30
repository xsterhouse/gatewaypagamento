-- ==========================================
-- Verificar TODOS os Triggers Ativos
-- ==========================================

-- Ver todos os triggers de activity_logs
SELECT 
  trigger_name,
  event_object_table as tabela,
  event_manipulation as evento,
  action_statement as funcao
FROM information_schema.triggers
WHERE trigger_name LIKE '%log_%'
ORDER BY event_object_table, trigger_name;

-- Ver triggers por tabela
SELECT 
  event_object_table as tabela,
  COUNT(*) as total_triggers
FROM information_schema.triggers
WHERE trigger_name LIKE '%log_%'
GROUP BY event_object_table
ORDER BY total_triggers DESC;

-- Ver funções de log criadas
SELECT 
  routine_name as funcao,
  routine_type as tipo
FROM information_schema.routines
WHERE routine_name LIKE '%log%'
  AND routine_schema = 'public'
ORDER BY routine_name;
