# 📝 Como Editar um Adquirente Bancário

## 🎯 Guia Rápido

### 1. Acessar a Página de Adquirentes

```
Menu Admin → Adquirentes Bancários
URL: /admin/acquirers
```

### 2. Localizar o Adquirente

Na lista de cards, encontre o adquirente que deseja editar (ex: Banco Inter).

### 3. Clicar em "Editar"

Clique no botão **"Editar"** (ícone de lápis) no card do adquirente.

### 4. Navegar pelas Abas

O modal possui **4 abas**:

#### 📋 Aba 1: Básico
- Nome do Banco
- Código do Banco
- Descrição
- URL do Logo
- Ambiente (Sandbox/Produção)

#### 🏦 Aba 2: Dados Bancários
- Chave PIX
- Tipo de Chave
- Agência e Dígito
- Conta e Dígito

#### 🔌 Aba 3: API (IMPORTANTE!)
- **Client ID** ← Cole aqui
- **Client Secret** ← Cole aqui
- URL Base da API
- URL de Autenticação
- URL PIX

#### 💰 Aba 4: Taxas
- Limite por Transação
- Limite Diário
- Taxa Percentual
- Taxa Fixa

### 5. Inserir Credenciais da API

**Na Aba API:**

1. Clique na aba **"API"** (terceira aba)
2. Cole o **Client ID** no primeiro campo
3. Cole o **Client Secret** no segundo campo (aparecerá como senha)
4. Preencha as URLs da API

**Exemplo para Banco Inter:**
```
Client ID: a1b2c3d4-e5f6-7890-abcd-ef1234567890
Client Secret: xYz123AbC456DeF789...
URL Base: https://cdpj.partners.bancointer.com.br
URL Auth: https://cdpj.partners.bancointer.com.br/oauth/v2/token
URL PIX: https://cdpj.partners.bancointer.com.br/banking/v2/pix
```

### 6. Navegar entre Abas

**Opção 1: Clique nas abas**
- Clique diretamente no nome da aba (Básico, Dados Bancários, API, Taxas)

**Opção 2: Use os botões de navegação**
- **← Anterior**: Volta para aba anterior
- **Próximo →**: Avança para próxima aba

### 7. Salvar Alterações

Após preencher todos os dados:
1. Clique em **"Atualizar Adquirente"**
2. Aguarde a confirmação
3. ✅ Pronto! Adquirente atualizado

---

## 🔧 Dicas Importantes

### ✅ Campos Obrigatórios
- Nome do Banco *
- Código do Banco *

### 🔐 Credenciais da API
- **Não são obrigatórias** para criar o adquirente
- **São necessárias** para processar transações reais
- Podem ser adicionadas depois

### 🧪 Testando sem API
Se não tiver credenciais ainda:
1. Deixe os campos da API vazios
2. O sistema gerará códigos PIX simulados
3. Adicione as credenciais depois quando obtê-las

### 📱 Onde Obter Credenciais

**Banco Inter:**
- Portal: https://developers.bancointer.com.br/
- Crie uma aplicação PIX
- Copie Client ID e Client Secret

**Outros Bancos:**
- Consulte o portal de desenvolvedores do banco
- Procure por "API PIX" ou "Integração PIX"

---

## 🐛 Problemas Comuns

### ❌ "Não consigo editar os campos"
**Solução:** Certifique-se de que clicou em "Editar" no card do adquirente.

### ❌ "Não encontro a aba API"
**Solução:** 
1. Verifique se o modal está aberto
2. Procure pelas 4 abas no topo do formulário
3. Clique em "API" (terceira aba)
4. Ou use o botão "Próximo →" para navegar

### ❌ "Client Secret não aparece"
**Solução:** O campo é do tipo senha por segurança. Digite normalmente, os caracteres ficarão ocultos (•••).

### ❌ "Salvei mas não funcionou"
**Solução:**
1. Verifique se preencheu os campos obrigatórios (*)
2. Confira se as credenciais estão corretas
3. Veja os logs de erro no console do navegador (F12)

---

## 📊 Verificar se Funcionou

### 1. Após Salvar
Você verá uma mensagem: **"Adquirente atualizado com sucesso!"**

### 2. Verificar no Card
O card do adquirente mostrará:
- ✅ Ícone verde se estiver ativo
- Dados atualizados
- Estatísticas (se houver transações)

### 3. Testar Gerando PIX
1. Acesse como cliente
2. Dashboard → Adicionar Saldo
3. Gere um PIX de teste
4. Verifique se o código é gerado

### 4. Verificar no Banco de Dados
```sql
-- No Supabase SQL Editor
SELECT 
  name,
  client_id,
  api_base_url,
  is_active
FROM bank_acquirers
WHERE name = 'Banco Inter';
```

---

## 🎓 Passo a Passo Completo (Exemplo Real)

### Cenário: Adicionar credenciais do Banco Inter

**1. Obter Credenciais**
- Acesse: https://developers.bancointer.com.br/
- Faça login
- Crie aplicação PIX
- Anote: Client ID e Client Secret

**2. Abrir Modal de Edição**
- Menu Admin → Adquirentes Bancários
- Localize card "Banco Inter"
- Clique em "Editar"

**3. Preencher Aba Básico**
- Nome: Banco Inter ✓
- Código: 077 ✓
- Descrição: Adquirente principal
- Ambiente: Produção

**4. Preencher Aba Dados Bancários**
- Chave PIX: 12.345.678/0001-90
- Tipo: CNPJ
- Agência: 0001
- Conta: 123456-7

**5. Preencher Aba API** ⭐
- Client ID: [Cole aqui]
- Client Secret: [Cole aqui]
- URL Base: https://cdpj.partners.bancointer.com.br
- URL Auth: https://cdpj.partners.bancointer.com.br/oauth/v2/token
- URL PIX: https://cdpj.partners.bancointer.com.br/banking/v2/pix

**6. Preencher Aba Taxas**
- Limite/Transação: 5000.00
- Limite Diário: 50000.00
- Taxa %: 0.0350
- Taxa Fixa: 0.60

**7. Salvar**
- Clique em "Atualizar Adquirente"
- Aguarde confirmação
- ✅ Pronto!

---

## 📞 Precisa de Ajuda?

- 📖 Consulte: `SISTEMA_ADQUIRENTES_GUIA.md`
- 📖 Exemplo: `BANCO_INTER_CONFIG_EXEMPLO.md`
- 🎫 Abra um ticket de suporte
- 📧 Entre em contato com o administrador

---

**Última atualização:** 2024  
**Versão:** 1.0.0
