-- ========================================
-- ADICIONAR COLUNAS DE WEBHOOK
-- Migration para adicionar campos de webhook na tabela existente
-- ========================================

-- Adicionar coluna webhook_url
ALTER TABLE public.bank_acquirers 
ADD COLUMN IF NOT EXISTS webhook_url TEXT;

-- Adicionar coluna webhook_secret
ALTER TABLE public.bank_acquirers 
ADD COLUMN IF NOT EXISTS webhook_secret TEXT;

-- Adicionar coluna webhook_events
ALTER TABLE public.bank_acquirers 
ADD COLUMN IF NOT EXISTS webhook_events JSONB DEFAULT '[]'::jsonb;

-- Adicionar coluna webhook_enabled
ALTER TABLE public.bank_acquirers 
ADD COLUMN IF NOT EXISTS webhook_enabled BOOLEAN DEFAULT false;

-- Adicionar comentário
COMMENT ON COLUMN public.bank_acquirers.webhook_events IS 'Array JSON de eventos de webhook habilitados (ex: ["pix.created", "pix.completed"])';

-- Verificar se as colunas foram adicionadas
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'bank_acquirers'
AND column_name LIKE 'webhook%'
ORDER BY column_name;
