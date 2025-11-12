# ⚠️ ERRO: Adquirente Mercado Pago Não Configurado

## 🔴 Erro Atual:
```
Erro ao buscar adquirente padrão:
Cannot coerce the result to a single JSON object
The result contains 0 rows
```

## ✅ Solução: Executar Script SQL

### Passo 1: Abrir Supabase SQL Editor

1. Acesse: https://supabase.com/dashboard
2. Selecione seu projeto
3. Vá em **SQL Editor** (ícone de banco de dados no menu lateral)

### Passo 2: Executar o Script

Copie e cole este SQL no editor:

```sql
-- 1. Verificar se já existe um adquirente Mercado Pago
SELECT * FROM bank_acquirers WHERE bank_code = 'MP';

-- 2. Atualizar adquirente Mercado Pago se já existir
UPDATE bank_acquirers
SET 
  name = 'Mercado Pago',
  pix_key = 'contato@dimpay.com.br',
  pix_key_type = 'email',
  is_active = true,
  is_default = true,
  environment = 'production',
  status = 'active',
  description = 'Gateway de pagamento Mercado Pago para PIX',
  fee_percentage = 0.035,
  fee_fixed = 0.60,
  transaction_limit = 10000,
  daily_limit = 50000,
  updated_at = now()
WHERE bank_code = 'MP';

-- 3. Criar o adquirente Mercado Pago se NÃO existir
INSERT INTO bank_acquirers (
  name,
  bank_code,
  pix_key,
  pix_key_type,
  is_active,
  is_default,
  environment,
  status,
  description,
  fee_percentage,
  fee_fixed,
  transaction_limit,
  daily_limit
)
SELECT 
  'Mercado Pago',
  'MP',
  'contato@dimpay.com.br',
  'email',
  true,
  true,
  'production',
  'active',
  'Gateway de pagamento Mercado Pago para PIX',
  0.035,
  0.60,
  10000,
  50000
WHERE NOT EXISTS (
  SELECT 1 FROM bank_acquirers WHERE bank_code = 'MP'
);

-- 4. Desativar outros adquirentes como padrão (opcional)
UPDATE bank_acquirers 
SET is_default = false 
WHERE bank_code != 'MP';

-- 5. Verificar configuração final
SELECT 
  id,
  name,
  bank_code,
  is_active,
  is_default,
  environment,
  status,
  fee_percentage,
  fee_fixed,
  created_at
FROM bank_acquirers
ORDER BY is_default DESC, name;
```

### Passo 3: Executar

1. Clique em **Run** (ou pressione Ctrl+Enter)
2. Aguarde a execução
3. Verifique o resultado na parte inferior

**Deve mostrar:**
```
name: Mercado Pago
bank_code: MP
is_active: true
is_default: true
status: active
```

### Passo 4: Recarregar a Página

1. Volte para a aplicação
2. Recarregue a página (F5)
3. Tente gerar QR Code novamente

## 🔍 Verificar se Funcionou

Após executar o SQL, o erro deve sumir e aparecer:

```
🔵 Chamando Mercado Pago para gerar PIX real...
🚀 Criando PIX via backend: {...}
```

## ⚠️ Se o Erro Persistir

Verifique se a tabela `bank_acquirers` existe:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'bank_acquirers';
```

Se não retornar nada, a tabela não existe e você precisa criá-la primeiro.

---

**Execute o SQL AGORA e depois tente gerar o QR Code novamente!**
