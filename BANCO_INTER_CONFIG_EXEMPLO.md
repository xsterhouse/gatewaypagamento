# 🏦 Configuração do Banco Inter - Exemplo Prático

## 📋 Dados Necessários

### 1. Credenciais da API

Obtenha no portal: https://developers.bancointer.com.br/

```
Client ID: a1b2c3d4-e5f6-7890-abcd-ef1234567890
Client Secret: xYz123AbC456DeF789GhI012JkL345MnO678PqR901StU234VwX567YzA890BcD123
```

### 2. Chave PIX

Configure no app do Banco Inter:

```
Tipo: CNPJ
Chave: 12.345.678/0001-90
```

### 3. Dados Bancários

```
Banco: 077 (Banco Inter)
Agência: 0001
Conta: 123456
Dígito: 7
```

---

## 🔧 Configuração no Sistema

### Passo 1: Acessar Painel Admin

```
URL: https://seu-dominio.com/admin/acquirers
Menu: Admin → Adquirentes Bancários
```

### Passo 2: Criar Novo Adquirente

Clique em **"Novo Adquirente"** e preencha:

#### 📝 Aba Básico

| Campo | Valor |
|-------|-------|
| Nome do Banco | Banco Inter |
| Código do Banco | 077 |
| Descrição | Adquirente principal para transações PIX |
| Ambiente | Produção |

#### 🏦 Aba Dados Bancários

| Campo | Valor |
|-------|-------|
| Chave PIX | 12.345.678/0001-90 |
| Tipo de Chave | CNPJ |
| Agência | 0001 |
| Dígito Agência | (deixe vazio se não houver) |
| Conta | 123456 |
| Dígito Conta | 7 |

#### 🔌 Aba API

| Campo | Valor |
|-------|-------|
| Client ID | a1b2c3d4-e5f6-7890-abcd-ef1234567890 |
| Client Secret | xYz123AbC456DeF789GhI012JkL345MnO678PqR901StU234VwX567YzA890BcD123 |
| URL Base da API | https://cdpj.partners.bancointer.com.br |
| URL de Autenticação | https://cdpj.partners.bancointer.com.br/oauth/v2/token |
| URL PIX | https://cdpj.partners.bancointer.com.br/banking/v2/pix |

#### 💰 Aba Taxas

| Campo | Valor | Observação |
|-------|-------|------------|
| Limite por Transação | 5000.00 | R$ 5.000,00 |
| Limite Diário | 50000.00 | R$ 50.000,00 |
| Taxa Percentual | 0.0350 | 3.5% |
| Taxa Fixa | 0.60 | R$ 0,60 |

---

## 🧪 Ambiente de Testes (Sandbox)

Para testar sem transações reais:

### URLs Sandbox

```
URL Base: https://cdpj-sandbox.partners.bancointer.com.br
URL Auth: https://cdpj-sandbox.partners.bancointer.com.br/oauth/v2/token
URL PIX: https://cdpj-sandbox.partners.bancointer.com.br/banking/v2/pix
```

### Credenciais de Teste

Solicite credenciais sandbox no portal do Banco Inter.

### Configuração

1. Crie um segundo adquirente
2. Nome: "Banco Inter - Sandbox"
3. Ambiente: **Sandbox**
4. Use as URLs e credenciais de teste

---

## 📊 Exemplo de Cálculo de Taxas

### Transação de R$ 100,00

```
Valor solicitado: R$ 100,00
Taxa percentual (3.5%): R$ 3,50
Taxa fixa: R$ 0,60
Total de taxas: R$ 4,10
Valor líquido: R$ 95,90
```

### Transação de R$ 10,00

```
Valor solicitado: R$ 10,00
Taxa percentual (3.5%): R$ 0,35
Taxa fixa: R$ 0,60
Total de taxas: R$ 0,95
Valor líquido: R$ 9,05
```

---

## 🔐 Segurança das Credenciais

### ⚠️ IMPORTANTE

**NUNCA** compartilhe ou exponha:
- Client Secret
- Certificados digitais
- Tokens de acesso

### Onde as credenciais são armazenadas?

```
Banco de dados: Supabase
Tabela: bank_acquirers
Colunas: client_id, client_secret (criptografadas)
```

### Como rotacionar credenciais?

1. Gere novas credenciais no portal do Banco Inter
2. Acesse **Admin → Adquirentes Bancários**
3. Edite o adquirente
4. Atualize Client ID e Client Secret
5. Salve

---

## 🧪 Testar Configuração

### Teste 1: Verificar Adquirente

```sql
-- No Supabase SQL Editor
SELECT 
  name,
  bank_code,
  is_default,
  is_active,
  status,
  environment
FROM bank_acquirers
WHERE name = 'Banco Inter';
```

**Resultado esperado:**
```
name: Banco Inter
bank_code: 077
is_default: true
is_active: true
status: active
environment: production
```

### Teste 2: Gerar PIX

1. Acesse o sistema como cliente
2. Vá em **Dashboard → Adicionar Saldo**
3. Digite: R$ 10,00
4. Descrição: "Teste de integração"
5. Clique em **"Gerar QR Code"**

**Resultado esperado:**
- ✅ QR Code gerado
- ✅ Código PIX válido
- ✅ Transação registrada

### Teste 3: Verificar Transação

```sql
-- No Supabase SQL Editor
SELECT 
  pt.id,
  pt.amount,
  pt.status,
  ba.name as banco,
  pt.created_at
FROM pix_transactions pt
JOIN bank_acquirers ba ON ba.id = pt.acquirer_id
ORDER BY pt.created_at DESC
LIMIT 1;
```

---

## 🚨 Problemas Comuns

### Erro: "Client ID inválido"

**Causa**: Credenciais incorretas

**Solução**:
1. Verifique se copiou corretamente do portal
2. Confirme que está usando ambiente correto (sandbox/produção)
3. Regenere as credenciais se necessário

### Erro: "Chave PIX não encontrada"

**Causa**: Chave PIX não cadastrada ou inativa

**Solução**:
1. Abra o app do Banco Inter
2. Vá em **PIX → Minhas Chaves**
3. Verifique se a chave está ativa
4. Copie exatamente como aparece

### Erro: "Limite excedido"

**Causa**: Valor acima do limite configurado

**Solução**:
1. Edite o adquirente
2. Aba **Taxas**
3. Aumente o limite por transação
4. Salve

---

## 📱 Contatos Banco Inter

### Suporte Técnico

- **Portal**: https://developers.bancointer.com.br/
- **E-mail**: suporte.api@bancointer.com.br
- **Telefone**: 3003-4070 (opção 9)

### Documentação Oficial

- **API PIX**: https://developers.bancointer.com.br/docs/pix
- **Autenticação**: https://developers.bancointer.com.br/docs/autenticacao
- **Webhooks**: https://developers.bancointer.com.br/docs/webhooks

---

## ✅ Checklist de Configuração

Use este checklist para garantir que tudo está configurado:

- [ ] Credenciais obtidas no portal do Banco Inter
- [ ] Chave PIX criada e ativa no app
- [ ] Adquirente cadastrado no sistema
- [ ] Ambiente correto selecionado (produção/sandbox)
- [ ] URLs da API configuradas
- [ ] Taxas e limites definidos
- [ ] Adquirente definido como padrão
- [ ] Teste de geração de PIX realizado
- [ ] Transação registrada no banco de dados
- [ ] Logs de API verificados

---

## 🎯 Próximos Passos

Após configurar o Banco Inter:

1. **Adicionar mais adquirentes** (até 3 total)
   - Nubank
   - PicPay
   - Mercado Pago

2. **Configurar webhooks**
   - Confirmação automática de pagamentos
   - Notificações em tempo real

3. **Monitorar estatísticas**
   - Volume por adquirente
   - Taxa de sucesso
   - Tempo médio de confirmação

4. **Otimizar taxas**
   - Negociar com o banco
   - Comparar entre adquirentes
   - Escolher o mais vantajoso

---

**Dúvidas?** Consulte o arquivo `SISTEMA_ADQUIRENTES_GUIA.md` para mais informações.
