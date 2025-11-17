-- =================================================================
-- FIX: Adicionar Políticas RLS para Tabelas Críticas (10 Tabelas)
-- =================================================================

-- 1. balance_locks (Bloqueios de Saldo) - Apenas Admin/Manager pode ver/gerenciar
ALTER TABLE public.balance_locks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "balance_locks_select_admin" ON public.balance_locks
FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'manager')));

CREATE POLICY "balance_locks_manage_admin" ON public.balance_locks
FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'))
WITH CHECK (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

-- 2. manager_clients (Atribuição Gerente/Cliente) - Apenas Admin/Manager
ALTER TABLE public.manager_clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "manager_clients_select_admin" ON public.manager_clients
FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'manager')));

CREATE POLICY "manager_clients_manage_admin" ON public.manager_clients
FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'))
WITH CHECK (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

-- 3. user_sessions (Sessões de Usuário) - Apenas Admin/Próprio Usuário
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_sessions_select_own" ON public.user_sessions
FOR SELECT TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "user_sessions_select_admin" ON public.user_sessions
FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

-- 4. supported_currencies (Moedas Suportadas) - Leitura Pública
ALTER TABLE public.supported_currencies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "supported_currencies_select_public" ON public.supported_currencies
FOR SELECT USING (is_active = true);

-- 5. system_settings (Configurações Globais) - Apenas Admin
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "system_settings_select_admin" ON public.system_settings
FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "system_settings_manage_admin" ON public.system_settings
FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'))
WITH CHECK (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

-- 6. platform_settings (Configurações de Plataforma) - Apenas Admin
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "platform_settings_select_admin" ON public.platform_settings
FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "platform_settings_manage_admin" ON public.platform_settings
FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'))
WITH CHECK (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

-- 7. api_integrations (Secrets de API) - Apenas Admin
ALTER TABLE public.api_integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "api_integrations_select_admin" ON public.api_integrations
FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "api_integrations_manage_admin" ON public.api_integrations
FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'))
WITH CHECK (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

-- 8. audit_trail (Logs de Auditoria) - Apenas Admin
ALTER TABLE public.audit_trail ENABLE ROW LEVEL SECURITY;

CREATE POLICY "audit_trail_select_admin" ON public.audit_trail
FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

-- 9. user_blocks (Histórico de Bloqueios) - Apenas Admin
ALTER TABLE public.user_blocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_blocks_select_admin" ON public.user_blocks
FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "user_blocks_manage_admin" ON public.user_blocks
FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'))
WITH CHECK (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

-- 10. aml_checks (Verificações AML) - Apenas Admin
ALTER TABLE public.aml_checks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "aml_checks_select_admin" ON public.aml_checks
FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "aml_checks_manage_admin" ON public.aml_checks
FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'))
WITH CHECK (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));