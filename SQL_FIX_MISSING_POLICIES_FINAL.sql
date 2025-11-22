-- =================================================================
-- FIX FINAL: Adicionar Políticas RLS para Tabelas Críticas (10 Tabelas)
-- =================================================================
-- Este script garante que as políticas sejam criadas de forma idempotente.

-- Função auxiliar para verificar se o usuário é admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin');
$$;

-- Função auxiliar para verificar se o usuário é admin ou manager
CREATE OR REPLACE FUNCTION is_admin_or_manager()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'manager'));
$$;

-- 1. aml_checks (Verificações AML) - Apenas Admin
DROP POLICY IF EXISTS "aml_checks_select_admin" ON public.aml_checks;
DROP POLICY IF EXISTS "aml_checks_manage_admin" ON public.aml_checks;

CREATE POLICY "aml_checks_select_admin" ON public.aml_checks
FOR SELECT TO authenticated
USING (is_admin());

CREATE POLICY "aml_checks_manage_admin" ON public.aml_checks
FOR ALL TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

-- 2. api_integrations (Secrets de API) - Apenas Admin
DROP POLICY IF EXISTS "api_integrations_select_admin" ON public.api_integrations;
DROP POLICY IF EXISTS "api_integrations_manage_admin" ON public.api_integrations;

CREATE POLICY "api_integrations_select_admin" ON public.api_integrations
FOR SELECT TO authenticated
USING (is_admin());

CREATE POLICY "api_integrations_manage_admin" ON public.api_integrations
FOR ALL TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

-- 3. balance_locks (Bloqueios de Saldo) - Apenas Admin/Manager
DROP POLICY IF EXISTS "balance_locks_select_admin" ON public.balance_locks;
DROP POLICY IF EXISTS "balance_locks_manage_admin" ON public.balance_locks;

CREATE POLICY "balance_locks_select_admin" ON public.balance_locks
FOR SELECT TO authenticated
USING (is_admin_or_manager());

CREATE POLICY "balance_locks_manage_admin" ON public.balance_locks
FOR ALL TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

-- 4. manager_clients (Atribuição Gerente/Cliente) - Apenas Admin/Manager
DROP POLICY IF EXISTS "manager_clients_select_admin" ON public.manager_clients;
DROP POLICY IF EXISTS "manager_clients_manage_admin" ON public.manager_clients;

CREATE POLICY "manager_clients_select_admin" ON public.manager_clients
FOR SELECT TO authenticated
USING (is_admin_or_manager());

CREATE POLICY "manager_clients_manage_admin" ON public.manager_clients
FOR ALL TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

-- 5. platform_settings (Configurações de Plataforma) - Apenas Admin
DROP POLICY IF EXISTS "platform_settings_select_admin" ON public.platform_settings;
DROP POLICY IF EXISTS "platform_settings_manage_admin" ON public.platform_settings;

CREATE POLICY "platform_settings_select_admin" ON public.platform_settings
FOR SELECT TO authenticated
USING (is_admin());

CREATE POLICY "platform_settings_manage_admin" ON public.platform_settings
FOR ALL TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

-- 6. supported_currencies (Moedas Suportadas) - Leitura Pública
DROP POLICY IF EXISTS "supported_currencies_select_public" ON public.supported_currencies;

CREATE POLICY "supported_currencies_select_public" ON public.supported_currencies
FOR SELECT USING (is_active = true);

-- 7. system_settings (Configurações Globais) - Apenas Admin
DROP POLICY IF EXISTS "system_settings_select_admin" ON public.system_settings;
DROP POLICY IF EXISTS "system_settings_manage_admin" ON public.system_settings;

CREATE POLICY "system_settings_select_admin" ON public.system_settings
FOR SELECT TO authenticated
USING (is_admin());

CREATE POLICY "system_settings_manage_admin" ON public.system_settings
FOR ALL TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

-- 8. user_blocks (Histórico de Bloqueios) - Apenas Admin
DROP POLICY IF EXISTS "user_blocks_select_admin" ON public.user_blocks;
DROP POLICY IF EXISTS "user_blocks_manage_admin" ON public.user_blocks;

CREATE POLICY "user_blocks_select_admin" ON public.user_blocks
FOR SELECT TO authenticated
USING (is_admin());

CREATE POLICY "user_blocks_manage_admin" ON public.user_blocks
FOR ALL TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

-- 9. user_sessions (Sessões de Usuário) - Próprio Usuário e Admin
DROP POLICY IF EXISTS "user_sessions_select_own" ON public.user_sessions;
DROP POLICY IF EXISTS "user_sessions_select_admin" ON public.user_sessions;

CREATE POLICY "user_sessions_select_own" ON public.user_sessions
FOR SELECT TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "user_sessions_select_admin" ON public.user_sessions
FOR SELECT TO authenticated
USING (is_admin());

-- 10. webhooks (Logs de Webhook) - Apenas Admin
DROP POLICY IF EXISTS "webhooks_select_admin" ON public.webhooks;
DROP POLICY IF EXISTS "webhooks_manage_admin" ON public.webhooks;

CREATE POLICY "webhooks_select_admin" ON public.webhooks
FOR SELECT TO authenticated
USING (is_admin());

CREATE POLICY "webhooks_manage_admin" ON public.webhooks
FOR ALL TO authenticated
USING (is_admin())
WITH CHECK (is_admin());