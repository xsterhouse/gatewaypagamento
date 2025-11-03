# 🏦 Sistema de Adquirentes Bancários - Guia Completo

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Instalação](#instalação)
3. [Configuração do Banco Inter](#configuração-banco-inter)
4. [Como Usar](#como-usar)
5. [Gerenciamento de Adquirentes](#gerenciamento-de-adquirentes)
6. [Integração PIX](#integração-pix)
7. [API e Webhooks](#api-e-webhooks)
8. [Troubleshooting](#troubleshooting)

---

## 🎯 Visão Geral

O Sistema de Adquirentes Bancários permite que você configure e gerencie múltiplos bancos (como Banco Inter, Nubank, etc.) para processar transações PIX. Cada cliente que enviar ou receber PIX utilizará o adquirente bancário configurado.

### Funcionalidades Principais

✅ **Gerenciamento de até 3 adquirentes bancários**
✅ **Seleção de adquirente padrão**
✅ **Integração automática com PIX**
✅ **Logs de transações e API**
✅ **Estatísticas por adquirente**
✅ **Configuração de taxas e limites**
✅ **Ambiente sandbox e produção**

---

## 🚀 Instalação

### 1. Executar Script SQL

Acesse o **Supabase SQL Editor** e execute o arquivo:

```
CRIAR_SISTEMA_ADQUIRENTES.sql
```

Este script irá criar:
- Tabela `bank_acquirers` (adquirentes bancários)
- Tabela `pix_transactions` (transações PIX)
- Tabela `acquirer_api_logs` (logs de API)
- Triggers automáticos
- Políticas RLS
- View de estatísticas

### 2. Verificar Instalação

Execute no SQL Editor:

```sql
-- Verificar se as tabelas foram criadas
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('bank_acquirers', 'pix_transactions', 'acquirer_api_logs');

-- Verificar adquirente padrão
SELECT * FROM bank_acquirers WHERE is_default = true;
```

---

## 🏦 Configuração do Banco Inter

### Passo 1: Obter Credenciais da API

1. Acesse o **Portal de Desenvolvedores do Banco Inter**
   - URL: https://developers.bancointer.com.br/

2. Crie uma aplicação:
   - Tipo: **PIX**
   - Ambiente: **Sandbox** (para testes) ou **Produção**

3. Anote as credenciais:
   - **Client ID**: `seu-client-id`
   - **Client Secret**: `seu-client-secret`
   - **Certificado Digital**: (se necessário)

### Passo 2: Configurar Chave PIX

1. No app do Banco Inter, crie uma chave PIX:
   - Tipo: CNPJ (recomendado para empresas)
   - Anote a chave: `12.345.678/0001-90`

### Passo 3: Cadastrar no Sistema

1. Acesse: **Admin → Adquirentes Bancários**
2. Clique em **"Novo Adquirente"**
3. Preencha os dados:

#### Aba Básico
- **Nome do Banco**: Banco Inter
- **Código do Banco**: 077
- **Descrição**: Adquirente principal para PIX
- **Ambiente**: Produção (ou Sandbox para testes)

#### Aba Dados Bancários
- **Chave PIX**: Sua chave PIX do Inter
- **Tipo de Chave**: CNPJ
- **Agência**: 0001
- **Conta**: 123456-7

#### Aba API
- **Client ID**: (cole o Client ID)
- **Client Secret**: (cole o Client Secret)
- **URL Base da API**: `https://cdpj.partners.bancointer.com.br`
- **URL de Autenticação**: `https://cdpj.partners.bancointer.com.br/oauth/v2/token`
- **URL PIX**: `https://cdpj.partners.bancointer.com.br/banking/v2/pix`

#### Aba Taxas
- **Limite por Transação**: 5000.00
- **Limite Diário**: 50000.00
- **Taxa Percentual**: 0.0350 (3.5%)
- **Taxa Fixa**: 0.60

4. Clique em **"Criar Adquirente"**

---

## 📖 Como Usar

### Para Administradores

#### 1. Acessar Painel de Adquirentes

```
Menu Admin → Adquirentes Bancários
```

#### 2. Visualizar Estatísticas

O painel mostra:
- Total de adquirentes cadastrados
- Adquirentes ativos
- Adquirente padrão atual
- Volume total processado

#### 3. Gerenciar Adquirentes

**Criar Novo:**
- Botão "Novo Adquirente"
- Preencher formulário em abas
- Salvar

**Editar:**
- Clique no botão "Editar" no card do adquirente
- Modifique os dados necessários
- Salvar

**Definir como Padrão:**
- Clique em "Definir Padrão" no card
- Apenas um adquirente pode ser padrão por vez
- O sistema automaticamente desmarca os outros

**Excluir:**
- Clique no botão vermelho de lixeira
- Confirme a exclusão
- ⚠️ Não é possível excluir se houver transações vinculadas

### Para Clientes

#### Gerar PIX (Depósito)

1. Acesse **Dashboard → Adicionar Saldo**
2. Digite o valor e descrição
3. Clique em **"Gerar QR Code"**
4. O sistema automaticamente:
   - Seleciona o adquirente padrão
   - Gera código PIX válido
   - Cria QR Code
   - Registra a transação

#### Acompanhar Transação

```
Menu → Depósitos → Ver histórico
```

---

## 🔧 Gerenciamento de Adquirentes

### Limite de Adquirentes

O sistema permite cadastrar **até 3 adquirentes bancários**. Para adicionar mais:

1. Exclua um adquirente existente (se não tiver transações)
2. Ou entre em contato com o suporte

### Alternar Adquirente Padrão

**Método 1: Via Interface**
1. Acesse **Admin → Adquirentes Bancários**
2. Localize o adquirente desejado
3. Clique em **"Definir Padrão"**
4. ✅ Pronto! Todas as novas transações usarão este adquirente

**Método 2: Via SQL**
```sql
-- Definir Banco Inter como padrão
UPDATE bank_acquirers 
SET is_default = true 
WHERE name = 'Banco Inter';
```

### Status dos Adquirentes

- **🟢 Active**: Funcionando normalmente
- **🔴 Inactive**: Desativado temporariamente
- **🟡 Maintenance**: Em manutenção

Para alterar status:
```sql
UPDATE bank_acquirers 
SET status = 'maintenance' 
WHERE id = 'uuid-do-adquirente';
```

---

## 💳 Integração PIX

### Como Funciona

1. **Cliente solicita depósito**
   - Sistema busca adquirente padrão
   - Valida limites e taxas
   - Gera código PIX EMV

2. **Código PIX é gerado**
   - Formato padrão brasileiro (EMV)
   - QR Code válido
   - Expira em 30 minutos (padrão)

3. **Transação é registrada**
   - Tabela `pix_transactions`
   - Status: `pending`
   - Vinculada ao adquirente

4. **Cliente paga**
   - Via app bancário
   - Escaneia QR Code ou cola código

5. **Confirmação** (webhook ou manual)
   - Status muda para `completed`
   - Saldo é creditado

### Fluxo de Dados

```
Cliente → GerarPixModal → bankAcquirerService → bank_acquirers
                                ↓
                          pix_transactions
                                ↓
                          deposits (compatibilidade)
```

### Códigos de Status

| Status | Descrição |
|--------|-----------|
| `pending` | Aguardando pagamento |
| `processing` | Processando |
| `completed` | Pago e confirmado |
| `failed` | Falhou |
| `cancelled` | Cancelado |

---

## 🔌 API e Webhooks

### Endpoints Disponíveis

O serviço `bankAcquirerService` expõe:

```typescript
// Criar pagamento PIX
await bankAcquirerService.createPixPayment({
  amount: 100.00,
  description: 'Depósito',
  user_id: 'uuid-usuario',
  acquirer_id: 'uuid-adquirente', // Opcional
  expires_in_minutes: 30 // Opcional
})

// Verificar status
await bankAcquirerService.checkPixTransactionStatus('transaction-id')

// Confirmar pagamento
await bankAcquirerService.confirmPixPayment('transaction-id', 'e2e-id')

// Cancelar transação
await bankAcquirerService.cancelPixTransaction('transaction-id', 'Motivo')
```

### Logs de API

Todas as chamadas à API do banco são registradas em `acquirer_api_logs`:

```sql
-- Ver últimos logs
SELECT * FROM acquirer_api_logs 
ORDER BY created_at DESC 
LIMIT 50;

-- Ver logs com erro
SELECT * FROM acquirer_api_logs 
WHERE success = false 
ORDER BY created_at DESC;
```

### Webhook (Futuro)

Para receber notificações automáticas do banco:

1. Configure URL de webhook no portal do banco
2. Implemente endpoint: `/api/webhooks/pix`
3. Valide assinatura do banco
4. Atualize status da transação

---

## 🐛 Troubleshooting

### Problema: "Nenhum adquirente disponível"

**Causa**: Não há adquirente padrão configurado

**Solução**:
```sql
-- Verificar adquirentes
SELECT * FROM bank_acquirers WHERE is_active = true;

-- Definir um como padrão
UPDATE bank_acquirers 
SET is_default = true 
WHERE id = 'uuid-do-adquirente';
```

### Problema: "Erro ao gerar PIX"

**Causa**: Credenciais inválidas ou API fora do ar

**Solução**:
1. Verificar logs:
```sql
SELECT * FROM acquirer_api_logs 
WHERE success = false 
ORDER BY created_at DESC 
LIMIT 10;
```

2. Testar credenciais no portal do banco
3. Verificar se está em ambiente correto (sandbox/produção)

### Problema: PIX não confirma automaticamente

**Causa**: Webhook não configurado

**Solução**:
- Confirmar manualmente via SQL:
```sql
UPDATE pix_transactions 
SET status = 'completed', 
    completed_at = NOW() 
WHERE id = 'transaction-id';
```

### Problema: Taxas incorretas

**Causa**: Configuração errada no adquirente

**Solução**:
1. Editar adquirente
2. Aba "Taxas"
3. Ajustar valores:
   - Taxa percentual: 0.0350 = 3.5%
   - Taxa fixa: 0.60 = R$ 0,60

---

## 📊 Relatórios e Estatísticas

### View de Estatísticas

```sql
-- Ver estatísticas de todos os adquirentes
SELECT * FROM acquirer_statistics;

-- Estatísticas de um adquirente específico
SELECT * FROM acquirer_statistics 
WHERE name = 'Banco Inter';
```

### Relatório de Transações

```sql
-- Transações por adquirente (últimos 30 dias)
SELECT 
  ba.name,
  COUNT(*) as total,
  SUM(pt.amount) as volume,
  SUM(pt.fee_amount) as taxas
FROM pix_transactions pt
JOIN bank_acquirers ba ON ba.id = pt.acquirer_id
WHERE pt.created_at >= NOW() - INTERVAL '30 days'
GROUP BY ba.name
ORDER BY volume DESC;
```

### Exportar Dados

```sql
-- Exportar transações para CSV
COPY (
  SELECT 
    pt.created_at,
    ba.name as banco,
    pt.amount,
    pt.status,
    pt.description
  FROM pix_transactions pt
  JOIN bank_acquirers ba ON ba.id = pt.acquirer_id
  WHERE pt.created_at >= NOW() - INTERVAL '30 days'
) TO '/tmp/transacoes.csv' WITH CSV HEADER;
```

---

## 🔐 Segurança

### Boas Práticas

1. **Nunca compartilhe credenciais**
   - Client Secret é sensível
   - Armazene de forma segura

2. **Use ambiente sandbox para testes**
   - Evite transações reais em desenvolvimento

3. **Monitore logs regularmente**
   - Detecte tentativas de fraude
   - Identifique problemas de API

4. **Rotacione credenciais periodicamente**
   - A cada 90 dias (recomendado)
   - Após qualquer incidente

5. **Configure limites adequados**
   - Limite por transação
   - Limite diário
   - Protege contra fraudes

---

## 📞 Suporte

### Banco Inter

- Portal: https://developers.bancointer.com.br/
- Suporte: suporte@bancointer.com.br
- Telefone: 3003-4070

### Sistema

- Logs: `Admin → Logs de Atividades`
- Tickets: `Admin → Tickets de Suporte`

---

## 🎉 Conclusão

Agora você tem um sistema completo de adquirentes bancários configurado! 

**Próximos Passos:**

1. ✅ Execute o SQL de criação
2. ✅ Cadastre o Banco Inter
3. ✅ Defina como padrão
4. ✅ Teste gerando um PIX
5. ✅ Monitore as transações

**Dúvidas?** Consulte este guia ou acesse o suporte.

---

**Versão**: 1.0.0  
**Última atualização**: 2024  
**Autor**: Sistema Gateway Pagamento
