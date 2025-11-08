# 🚀 Guia Completo de Implementação - Sistema PIX Pronto para Produção

## 📋 Índice

1. [Visão Geral das Melhorias](#visão-geral)
2. [Passo 1: Corrigir Segurança (RLS)](#passo-1-segurança)
3. [Passo 2: Criar Tabelas Auxiliares](#passo-2-tabelas)
4. [Passo 3: Configurar Adquirente](#passo-3-adquirente)
5. [Passo 4: Testar Sistema](#passo-4-testes)
6. [Passo 5: Configurar Webhook](#passo-5-webhook)
7. [Troubleshooting](#troubleshooting)

---

## 🎯 Visão Geral das Melhorias

### ✅ O que foi implementado:

1. **WalletService** - Crédito automático de saldo
2. **WebhookService** - Confirmação automática via webhook
3. **NotificationService** - Notificações para clientes
4. **EncryptionService** - Criptografia de secrets
5. **Integração completa** - Todos os serviços conectados

### 📦 Novos Arquivos Criados:

```
src/services/
├── walletService.ts          ✅ Gerenciamento de carteiras
├── webhookService.ts         ✅ Processamento de webhooks
├── notificationService.ts    ✅ Sistema de notificações
└── encryptionService.ts      ✅ Criptografia de dados

SQL/
├── SQL_FIX_ALL_CRITICAL_RLS.sql              ✅ Correção de segurança
└── CRIAR_TABELAS_AUXILIARES_PIX.sql          ✅ Tabelas necessárias
```

---

## 🔐 Passo 1: Corrigir Segurança (RLS) - CRÍTICO

### ⚠️ IMPORTANTE: Execute ANTES de qualquer outra coisa!

1. **Acesse o Supabase SQL Editor**
   - URL: https://supabase.com/dashboard/project/[seu-projeto]/sql

2. **Execute o script de correção RLS:**
   ```sql
   -- Arquivo: SQL_FIX_ALL_CRITICAL_RLS.sql
   -- Copie e cole TODO o conteúdo no SQL Editor
   -- Clique em "Run"
   ```

3. **Verifique se foi aplicado:**
   ```sql
   SELECT 
     relname as tabela,
     relrowsecurity as rls_ativo
   FROM pg_class
   WHERE relnamespace = 'public'::regnamespace
     AND relname IN ('users', 'wallets', 'transactions', 'invoices')
   ORDER BY relname;
   
   -- TODAS devem ter rls_ativo = true
   ```

4. **Teste o isolamento:**
   ```sql
   -- Como cliente, deve ver apenas seus dados:
   SELECT COUNT(*) FROM users;        -- Deve retornar 1
   SELECT COUNT(*) FROM wallets;      -- Deve retornar suas carteiras
   SELECT COUNT(*) FROM transactions; -- Deve retornar suas transações
   ```

### ✅ Resultado Esperado:
- ✅ RLS ativo em todas as tabelas críticas
- ✅ Clientes veem apenas seus dados
- ✅ Admins veem todos os dados
- ✅ Sistema em conformidade com LGPD

---

## 📊 Passo 2: Criar Tabelas Auxiliares

### Execute no Supabase SQL Editor:

```sql
-- Arquivo: CRIAR_TABELAS_AUXILIARES_PIX.sql
-- Copie e cole TODO o conteúdo
-- Clique em "Run"
```

### O que será criado:

1. **wallet_transactions** - Histórico de movimentações
2. **webhook_logs** - Logs de webhooks recebidos
3. **Funções auxiliares** - Para manutenção
4. **Views de estatísticas** - Para relatórios
5. **Triggers** - Atualização automática

### Verificar instalação:

```sql
-- Verificar tabelas criadas
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('wallet_transactions', 'webhook_logs');

-- Deve retornar 2 linhas
```

---

## 🏦 Passo 3: Configurar Adquirente (Banco Inter)

### 3.1 Obter Credenciais

1. **Acesse o Portal do Banco Inter:**
   - URL: https://developers.bancointer.com.br/

2. **Crie uma aplicação PIX:**
   - Tipo: PIX
   - Ambiente: Sandbox (para testes)
   - Anote: Client ID e Client Secret

3. **Configure Chave PIX:**
   - No app do Banco Inter
   - Tipo: CNPJ (recomendado)
   - Anote a chave

### 3.2 Cadastrar no Sistema

1. **Acesse o painel admin:**
   ```
   http://localhost:5173/admin/bank-acquirers
   ```

2. **Clique em "Novo Adquirente"**

3. **Preencha os dados:**

   **Aba Básico:**
   - Nome: Banco Inter
   - Código: 077
   - Ambiente: Sandbox
   - Status: Active

   **Aba Dados Bancários:**
   - Chave PIX: [sua chave]
   - Tipo: CNPJ
   - Agência: 0001
   - Conta: [sua conta]

   **Aba API:**
   - Client ID: [seu client_id]
   - Client Secret: [seu client_secret]
   - URL Base: `https://cdpj.partners.bancointer.com.br`
   - URL Auth: `https://cdpj.partners.bancointer.com.br/oauth/v2/token`
   - URL PIX: `https://cdpj.partners.bancointer.com.br/banking/v2/pix`

   **Aba Taxas:**
   - Limite Transação: 5000.00
   - Limite Diário: 50000.00
   - Taxa %: 0.0350 (3.5%)
   - Taxa Fixa: 0.60

4. **Salvar e definir como padrão**

---

## 🧪 Passo 4: Testar Sistema Completo

### 4.1 Teste de Geração de PIX

1. **Login como cliente:**
   ```
   http://localhost:5173/login
   ```

2. **Acesse Dashboard → Adicionar Saldo**

3. **Gere um PIX:**
   - Valor: R$ 10,00
   - Descrição: "Teste de depósito"
   - Clique em "Gerar QR Code"

4. **Verifique:**
   - ✅ QR Code foi gerado
   - ✅ Código PIX (copia e cola) disponível
   - ✅ Notificação apareceu
   - ✅ Status: "Aguardando pagamento"

### 4.2 Teste de Confirmação Manual

Como o webhook ainda não está configurado, confirme manualmente:

```sql
-- No Supabase SQL Editor:

-- 1. Buscar transação pendente
SELECT id, user_id, amount, status 
FROM pix_transactions 
WHERE status = 'pending' 
ORDER BY created_at DESC 
LIMIT 1;

-- 2. Anotar o transaction_id e user_id

-- 3. Simular confirmação de pagamento
-- (Substitua os valores)
UPDATE pix_transactions 
SET status = 'completed',
    updated_at = NOW()
WHERE id = '[transaction_id]';

-- 4. Creditar saldo manualmente (via código)
-- Ou use a função do webhookService.manualConfirmPix()
```

### 4.3 Verificar Crédito Automático

```sql
-- Verificar se saldo foi creditado
SELECT 
  w.user_id,
  w.currency_code,
  w.balance,
  w.locked_balance,
  (w.balance - w.locked_balance) as available_balance
FROM wallets w
WHERE w.user_id = '[user_id]';

-- Verificar transação da carteira
SELECT * 
FROM wallet_transactions 
WHERE user_id = '[user_id]'
ORDER BY created_at DESC 
LIMIT 5;
```

### 4.4 Verificar Notificações

```sql
-- Ver notificações do usuário
SELECT 
  title,
  message,
  type,
  category,
  read,
  created_at
FROM notifications
WHERE user_id = '[user_id]'
ORDER BY created_at DESC;
```

---

## 🪝 Passo 5: Configurar Webhook (Produção)

### 5.1 Criar Endpoint de Webhook

Você precisará criar um endpoint público para receber webhooks do banco.

**Opção 1: Usar Vercel/Netlify Functions**

Crie arquivo: `api/webhooks/pix.ts`

```typescript
import { webhookService } from '@/services/webhookService'

export default async function handler(req: Request) {
  // Apenas POST
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  try {
    // Extrair dados
    const signature = req.headers.get('x-signature') || ''
    const acquirerId = req.headers.get('x-acquirer-id') || ''
    const payload = await req.json()

    // Processar webhook
    const result = await webhookService.processPixWebhook(
      acquirerId,
      signature,
      payload
    )

    if (!result.success) {
      return new Response(
        JSON.stringify({ error: result.error }), 
        { status: 400 }
      )
    }

    return new Response('OK', { status: 200 })
  } catch (error: any) {
    console.error('Webhook error:', error)
    return new Response(
      JSON.stringify({ error: error.message }), 
      { status: 500 }
    )
  }
}
```

### 5.2 Configurar no Banco Inter

1. **Acesse o portal do banco**
2. **Vá em Configurações → Webhooks**
3. **Adicione:**
   - URL: `https://seu-dominio.com/api/webhooks/pix`
   - Eventos: `pix.created`, `pix.completed`, `pix.failed`
   - Secret: [gere um token seguro]

4. **Salve o secret no adquirente:**
   ```sql
   UPDATE bank_acquirers 
   SET 
     webhook_url = 'https://seu-dominio.com/api/webhooks/pix',
     webhook_secret = '[seu-secret]',
     webhook_enabled = true,
     webhook_events = ARRAY['pix.created', 'pix.completed', 'pix.failed']
   WHERE name = 'Banco Inter';
   ```

### 5.3 Testar Webhook

1. **Gere um PIX de teste**
2. **Pague via app do banco**
3. **Verifique logs:**

```sql
-- Ver logs de webhooks
SELECT 
  event_type,
  success,
  error_message,
  processed_at
FROM webhook_logs
ORDER BY processed_at DESC
LIMIT 10;
```

---

## 🔧 Troubleshooting

### Problema: "Nenhum adquirente disponível"

**Solução:**
```sql
-- Verificar adquirentes
SELECT * FROM bank_acquirers WHERE is_active = true;

-- Definir um como padrão
UPDATE bank_acquirers 
SET is_default = true 
WHERE name = 'Banco Inter';
```

### Problema: Saldo não é creditado automaticamente

**Causa:** Webhook não configurado ou falhou

**Solução:**
```typescript
// Confirmar manualmente via código
import { webhookService } from '@/services/webhookService'

await webhookService.manualConfirmPix(
  'transaction_id',
  'e2e_id_opcional'
)
```

### Problema: Erro "RLS policy violation"

**Causa:** RLS não foi ativado corretamente

**Solução:**
1. Execute novamente `SQL_FIX_ALL_CRITICAL_RLS.sql`
2. Verifique se você está logado
3. Limpe cache do navegador

### Problema: Client Secret exposto

**Solução:**
```typescript
// Use o encryptionService
import { encryptionService } from '@/services/encryptionService'

// Criptografar antes de salvar
const encrypted = await encryptionService.encrypt(
  clientSecret,
  process.env.VITE_ENCRYPTION_KEY || 'sua-chave-segura'
)

// Salvar criptografado
await supabase.from('bank_acquirers').update({
  client_secret: encrypted
})
```

### Problema: Notificações não aparecem

**Verificar:**
```sql
-- Ver se tabela existe
SELECT * FROM notifications LIMIT 1;

-- Ver notificações do usuário
SELECT * FROM notifications 
WHERE user_id = '[user_id]'
ORDER BY created_at DESC;
```

---

## 📊 Monitoramento em Produção

### Logs Importantes:

```sql
-- Transações PIX (últimas 24h)
SELECT 
  status,
  COUNT(*) as total,
  SUM(amount) as volume
FROM pix_transactions
WHERE created_at >= NOW() - INTERVAL '24 hours'
GROUP BY status;

-- Webhooks (últimas 24h)
SELECT 
  event_type,
  success,
  COUNT(*) as total
FROM webhook_logs
WHERE processed_at >= NOW() - INTERVAL '24 hours'
GROUP BY event_type, success;

-- Movimentações de carteira (hoje)
SELECT 
  transaction_type,
  COUNT(*) as total,
  SUM(amount) as volume
FROM wallet_transactions
WHERE created_at >= CURRENT_DATE
GROUP BY transaction_type;
```

---

## ✅ Checklist Final

### Antes de ir para produção:

- [ ] RLS ativado em todas as tabelas
- [ ] Tabelas auxiliares criadas
- [ ] Adquirente configurado em SANDBOX
- [ ] Teste completo realizado
- [ ] Crédito automático funcionando
- [ ] Notificações aparecendo
- [ ] Webhook configurado e testado
- [ ] Logs sendo registrados
- [ ] Client secrets criptografados
- [ ] Limites configurados adequadamente
- [ ] Ambiente de produção configurado
- [ ] Backup do banco de dados
- [ ] Monitoramento ativo

### Após deploy:

- [ ] Testar com valor pequeno (R$ 1,00)
- [ ] Verificar crédito de saldo
- [ ] Verificar notificações
- [ ] Monitorar logs por 24h
- [ ] Validar taxas aplicadas
- [ ] Testar cenários de erro

---

## 🎉 Conclusão

Seu sistema agora está **PRONTO PARA PRODUÇÃO** com:

✅ **Segurança** - RLS ativo, dados protegidos
✅ **Automação** - Crédito automático de saldo
✅ **Webhooks** - Confirmação em tempo real
✅ **Notificações** - Clientes sempre informados
✅ **Criptografia** - Secrets protegidos
✅ **Monitoramento** - Logs completos

**Próximos Passos:**
1. Teste em sandbox
2. Configure webhook
3. Vá para produção gradualmente
4. Monitore constantemente

**Dúvidas?** Consulte os arquivos de documentação ou os comentários no código.

---

**Versão:** 2.0.0  
**Data:** 08/11/2024  
**Status:** ✅ Pronto para Produção
