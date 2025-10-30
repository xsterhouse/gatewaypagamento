-- ============================================
-- INSERIR FATURAS DE TESTE
-- Execute este SQL no Supabase
-- ============================================

-- Inserir faturas para o usuário fabiofr26@gmail.com
INSERT INTO invoices (user_id, amount, due_date, status, description) VALUES
  (
    (SELECT id FROM users WHERE email = 'fabiofr26@gmail.com'),
    150.00,
    CURRENT_DATE + INTERVAL '30 days',
    'pending',
    'Mensalidade - Plano Básico'
  ),
  (
    (SELECT id FROM users WHERE email = 'fabiofr26@gmail.com'),
    250.00,
    CURRENT_DATE + INTERVAL '15 days',
    'pending',
    'Taxa de Serviço Premium'
  ),
  (
    (SELECT id FROM users WHERE email = 'fabiofr26@gmail.com'),
    100.00,
    CURRENT_DATE - INTERVAL '5 days',
    'overdue',
    'Mensalidade Atrasada'
  ),
  (
    (SELECT id FROM users WHERE email = 'fabiofr26@gmail.com'),
    180.00,
    CURRENT_DATE - INTERVAL '30 days',
    'paid',
    'Mensalidade Paga - Mês Anterior'
  );

-- Verificar faturas criadas
SELECT 
  invoice_number,
  amount,
  due_date,
  status,
  description,
  created_at
FROM invoices
WHERE user_id = (SELECT id FROM users WHERE email = 'fabiofr26@gmail.com')
ORDER BY created_at DESC;

SELECT '✅ Faturas de teste criadas com sucesso!' as status;
