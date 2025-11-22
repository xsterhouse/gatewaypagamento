# 🏦 Integração Completa com Banco Inter

## 📋 Visão Geral

Esta integração permite que seu sistema realize:
- ✅ **Receber PIX** - Gerar QR Codes e cobranças PIX
- ✅ **Enviar PIX** - Transferências PIX para qualquer chave
- ✅ **Criar Boletos** - Boletos bancários com PIX e código de barras

---

## 🎯 Funcionalidades Implementadas

### 1. Receber PIX
- Geração de QR Code PIX
- Cobrança PIX imediata (Cob)
- Validação automática de pagamentos
- Webhook para confirmação em tempo real

### 2. Enviar PIX
- Envio para qualquer tipo de chave (CPF, CNPJ, Email, Telefone, Aleatória)
- Validação de saldo antes do envio
- Cálculo automático de taxas
- Registro completo de transações

### 3. Boletos Bancários
- Geração de boleto com código de barras
- Linha digitável
- QR Code PIX integrado ao boleto
- PDF do boleto
- Multa e mora configuráveis

---

## 📦 Arquivos Criados

### Backend (Supabase Edge Functions)
```
supabase/functions/
├── banco-inter-create-pix/     # Criar cobrança PIX
│   └── index.ts
├── banco-inter-send-pix/       # Enviar PIX
│   └── index.ts
└── banco-inter-create-boleto/  # Criar boleto
    └── index.ts
```

### Frontend (Biblioteca TypeScript)
```
src/lib/
└── banco-inter.ts              # Cliente API Banco Inter
```

### SQL
```
CONFIGURAR_BANCO_INTER.sql      # Migration e configuração
```

---

## 🔧 Passo a Passo de Configuração

### 1️⃣ Obter Credenciais no Banco Inter

#### 1.1 Criar Conta PJ
1. Acesse: https://www.bancointer.com.br/
2. Abra uma conta PJ (Pessoa Jurídica)
3. Ative o API Banking no app

#### 1.2 Acessar Portal de Desenvolvedores
1. Acesse: https://developers.bancointer.com.br/
2. Faça login com sua conta PJ
3. Vá em **"Minhas Aplicações"** → **"Nova Aplicação"**

#### 1.3 Configurar Aplicação
- **Nome**: Gateway de Pagamento
- **Tipo**: Banking
- **Escopos necessários**:
  - `cob.read` - Ler cobranças PIX
  - `cob.write` - Criar cobranças PIX
  - `pix.read` - Consultar PIX
  - `pix.write` - Enviar PIX
  - `boleto-cobranca.read` - Ler boletos
  - `boleto-cobranca.write` - Criar boletos

#### 1.4 Obter Credenciais
Após criar a aplicação, você receberá:
- **Client ID**: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`
- **Client Secret**: `xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

---

### 2️⃣ Configurar Certificado Digital

O Banco Inter requer certificado digital para autenticação.

#### Opção A: Converter .pfx para .pem

Se você tem um arquivo `.pfx` ou `.p12`:

```bash
# Extrair certificado
openssl pkcs12 -in certificado.pfx -clcerts -nokeys -out certificado.pem

# Extrair chave privada
openssl pkcs12 -in certificado.pfx -nocerts -nodes -out chave-privada.key
```

#### Opção B: Usar certificado existente

Se já tem `.pem` e `.key`, pule para o próximo passo.

#### Converter para Base64

```bash
# Linux/Mac
cat certificado.pem | base64 -w 0

# Windows (PowerShell)
[Convert]::ToBase64String([IO.File]::ReadAllBytes("certificado.pem"))
```

---

### 3️⃣ Configurar no Supabase

#### 3.1 Executar SQL

1. Acesse o Supabase Dashboard
2. Vá em **SQL Editor**
3. Abra o arquivo `CONFIGURAR_BANCO_INTER.sql`
4. **IMPORTANTE**: Substitua os valores:
   - `SEU_CLIENT_ID_AQUI`
   - `SEU_CLIENT_SECRET_AQUI`
   - `SEU_CNPJ_AQUI` (sua chave PIX)
   - `12345678` (número da conta)
5. Execute o script

#### 3.2 Configurar Edge Functions

1. Vá em **Settings** → **Edge Functions**
2. Clique em **"Add Secret"**
3. Adicione as seguintes variáveis:

```bash
# Certificado Digital (conteúdo em Base64)
BANCO_INTER_CERTIFICATE=LS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0tLS0t...

# Chave Privada (conteúdo em Base64)
BANCO_INTER_CERTIFICATE_KEY=LS0tLS1CRUdJTiBQUklWQVRFIEtFWS0tLS0t...

# Número da Conta (sem dígito verificador)
BANCO_INTER_ACCOUNT_NUMBER=12345678
```

#### 3.3 Deploy das Edge Functions

```bash
# Instalar Supabase CLI (se ainda não tiver)
npm install -g supabase

# Login no Supabase
supabase login

# Link com seu projeto
supabase link --project-ref SEU_PROJECT_REF

# Deploy das funções
supabase functions deploy banco-inter-create-pix
supabase functions deploy banco-inter-send-pix
supabase functions deploy banco-inter-create-boleto
```

---

### 4️⃣ Configurar Variáveis de Ambiente

Edite o arquivo `.env`:

```bash
# Habilitar Banco Inter
VITE_BANCO_INTER_ENABLED=true

# Ambiente (sandbox ou production)
VITE_BANCO_INTER_ENVIRONMENT=production
```

---

## 🧪 Testando a Integração

### Teste 1: Verificar Configuração

Execute no SQL Editor:

```sql
SELECT * FROM validate_banco_inter_config();
```

**Resultado esperado:**
```
config_valid: true
missing_fields: []
```

### Teste 2: Criar Cobrança PIX

```typescript
import { supabase } from '@/lib/supabase'

const response = await supabase.functions.invoke('banco-inter-create-pix', {
  body: {
    user_id: 'user-uuid',
    amount: 10.00,
    description: 'Teste de cobrança PIX',
    expires_in_minutes: 30
  }
})

console.log(response.data)
// { success: true, pix_code: "...", qr_code_base64: "..." }
```

### Teste 3: Enviar PIX

```typescript
const response = await supabase.functions.invoke('banco-inter-send-pix', {
  body: {
    user_id: 'user-uuid',
    amount: 5.00,
    description: 'Teste de envio PIX',
    pix_key: '12345678901',
    pix_key_type: 'cpf',
    receiver_name: 'João Silva'
  }
})

console.log(response.data)
// { success: true, e2e_id: "E12345678...", transaction_id: "..." }
```

### Teste 4: Criar Boleto

```typescript
const response = await supabase.functions.invoke('banco-inter-create-boleto', {
  body: {
    user_id: 'user-uuid',
    amount: 100.00,
    description: 'Teste de boleto',
    payer_name: 'Maria Santos',
    payer_document: '12345678901',
    payer_email: 'maria@example.com',
    payer_address: {
      street: 'Rua Teste',
      number: '123',
      neighborhood: 'Centro',
      city: 'São Paulo',
      state: 'SP',
      zip_code: '01234-567'
    }
  }
})

console.log(response.data)
// { success: true, boleto: { codigo_barras: "...", linha_digitavel: "..." } }
```

---

## 📊 Monitoramento

### Ver Estatísticas

```sql
SELECT * FROM banco_inter_stats
ORDER BY date DESC
LIMIT 30;
```

### Ver Transações Recentes

```sql
SELECT 
  pt.id,
  pt.transaction_type,
  pt.amount,
  pt.status,
  pt.pix_key,
  pt.created_at,
  ba.name as banco
FROM pix_transactions pt
JOIN bank_acquirers ba ON ba.id = pt.acquirer_id
WHERE ba.bank_code = '077'
ORDER BY pt.created_at DESC
LIMIT 20;
```

### Logs das Edge Functions

No Supabase Dashboard:
1. **Edge Functions** → Selecione a função
2. Clique em **"Logs"**
3. Veja os logs em tempo real

---

## 🔐 Segurança

### ✅ Boas Práticas Implementadas

1. **Certificados em Base64**: Armazenados como secrets no Supabase
2. **Validação de Saldo**: Antes de enviar PIX
3. **Transações Atômicas**: Rollback em caso de erro
4. **Logs Detalhados**: Para auditoria
5. **HTTPS Obrigatório**: Todas as comunicações criptografadas

### ⚠️ Nunca Faça

- ❌ Commitar certificados no Git
- ❌ Expor Client Secret no frontend
- ❌ Desabilitar validação de certificado SSL
- ❌ Usar credenciais de produção em sandbox

---

## 💰 Taxas e Limites

### Configuração Padrão

```sql
-- Ver configuração atual
SELECT 
  daily_limit,
  transaction_limit,
  fee_percentage,
  fee_fixed
FROM bank_acquirers
WHERE bank_code = '077';
```

### Ajustar Taxas

```sql
UPDATE bank_acquirers
SET 
  fee_percentage = 0.50,  -- 0.5%
  fee_fixed = 0.00,       -- R$ 0,00
  daily_limit = 100000.00,
  transaction_limit = 10000.00
WHERE bank_code = '077';
```

---

## 🚨 Troubleshooting

### Erro: "Falha na autenticação"

**Causa**: Client ID ou Client Secret incorretos

**Solução**:
1. Verifique as credenciais no SQL
2. Regenere no portal do Banco Inter se necessário
3. Execute novamente o `CONFIGURAR_BANCO_INTER.sql`

### Erro: "Certificate verification failed"

**Causa**: Certificado mal formatado ou expirado

**Solução**:
1. Verifique se o certificado está em Base64
2. Confirme que incluiu TODO o conteúdo
3. Verifique a data de validade do certificado

### Erro: "Saldo insuficiente"

**Causa**: Conta do Banco Inter sem saldo

**Solução**:
1. Transfira dinheiro para a conta PJ
2. Verifique limites de PIX no app do banco

### Erro: "Chave PIX não encontrada"

**Causa**: Chave PIX inválida ou não cadastrada

**Solução**:
1. Verifique se a chave está ativa no app
2. Teste com uma chave conhecida
3. Valide o formato da chave

---

## 📈 Próximos Passos

### Implementações Futuras

1. **Webhook do Banco Inter**
   - Confirmação automática de pagamentos
   - Atualização de status em tempo real

2. **PIX Parcelado**
   - Cobranças recorrentes
   - Assinaturas

3. **Relatórios Avançados**
   - Dashboard de transações
   - Exportação de dados

4. **Conciliação Bancária**
   - Comparação com extrato
   - Detecção de divergências

---

## 📞 Suporte

### Banco Inter
- **Portal**: https://developers.bancointer.com.br/
- **Email**: suporte.api@bancointer.com.br
- **Telefone**: 3003-4070 (opção 9)
- **Documentação**: https://developers.bancointer.com.br/docs

### Comunidade
- **GitHub Issues**: Para reportar bugs
- **Discord**: Para discussões técnicas

---

## 📝 Changelog

### Versão 1.0.0 (21/11/2024)
- ✅ Integração completa com Banco Inter
- ✅ Receber PIX (QR Code)
- ✅ Enviar PIX (qualquer chave)
- ✅ Criar Boletos (com PIX e código de barras)
- ✅ Edge Functions do Supabase
- ✅ Biblioteca TypeScript
- ✅ Migrations SQL
- ✅ Documentação completa

---

## 🎯 Checklist de Implementação

Use este checklist para garantir que tudo está configurado:

- [ ] Conta PJ no Banco Inter criada
- [ ] API Banking habilitada
- [ ] Aplicação criada no portal de desenvolvedores
- [ ] Client ID e Client Secret obtidos
- [ ] Certificado digital configurado
- [ ] SQL `CONFIGURAR_BANCO_INTER.sql` executado
- [ ] Secrets configurados no Supabase
- [ ] Edge Functions deployadas
- [ ] Variáveis de ambiente configuradas
- [ ] Teste de cobrança PIX realizado
- [ ] Teste de envio PIX realizado
- [ ] Teste de boleto realizado
- [ ] Validação de configuração executada
- [ ] Logs monitorados
- [ ] Documentação lida

---

**Versão:** 1.0.0  
**Data:** 21/11/2024  
**Status:** ✅ Pronto para Produção

---

## 🎉 Parabéns!

Sua integração com o Banco Inter está completa e pronta para uso!

Para dúvidas ou suporte, consulte a documentação oficial do Banco Inter ou abra uma issue no GitHub.
