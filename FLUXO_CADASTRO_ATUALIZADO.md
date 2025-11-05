# Fluxo de Cadastro Atualizado - 4 Etapas

## 📋 Novo Fluxo Implementado

O fluxo de cadastro foi atualizado para incluir o **upload de documentos ANTES da verificação de email**, conforme solicitado.

### Ordem das Etapas:

```
Step 1: Dados Básicos
   ↓
Step 2: Upload de Documentos (NOVO POSICIONAMENTO)
   ↓
Step 3: Verificação de Email (Código OTP)
   ↓
Step 4: Confirmação e Criação da Conta
```

## 🔄 Mudanças Implementadas

### **Step 1 - Dados Básicos**
- ✅ Validação de todos os campos
- ✅ Verificação se email já existe
- ✅ **NÃO cria a conta ainda** (apenas valida)
- ✅ Avança para Step 2

### **Step 2 - Upload de Documentos** 
- ✅ Usuário seleciona os 4 documentos obrigatórios:
  - Documento de identidade (RG, CPF ou CNH)
  - Comprovante de endereço
  - Selfie do rosto
  - Selfie segurando documento
- ✅ Preview dos arquivos selecionados
- ✅ Validação de tipo e tamanho
- ✅ **Documentos ficam em memória** (não são enviados ainda)
- ✅ Gera código OTP de 6 dígitos
- ✅ Avança para Step 3

### **Step 3 - Verificação de Email** (NOVA ETAPA)
- ✅ Exibe código OTP (modo desenvolvimento)
- ✅ Usuário digita o código recebido
- ✅ Valida o código
- ✅ **Ao validar o código:**
  1. Cria a conta no Supabase Auth
  2. Cria registro na tabela `users`
  3. Faz upload de TODOS os documentos
  4. Atualiza status para `awaiting_verification`
- ✅ Avança para Step 4

### **Step 4 - Confirmação**
- ✅ Mensagem de sucesso
- ✅ Informações sobre próximos passos
- ✅ Botão para ir ao login

## 🎯 Vantagens do Novo Fluxo

1. **Segurança**: Documentos só são enviados após validação do email
2. **UX**: Usuário vê todos os documentos antes de criar a conta
3. **Eficiência**: Evita uploads desnecessários se o email for inválido
4. **Validação**: Garante que o usuário tem acesso ao email antes de criar a conta

## 🔐 Fluxo de Segurança

```
1. Usuário preenche dados → Validação local
2. Usuário seleciona documentos → Validação de tipo/tamanho
3. Sistema gera OTP → Envia para email (em produção)
4. Usuário valida OTP → Cria conta + Upload documentos
```

## 📝 Detalhes Técnicos

### Estado da Aplicação por Step:

| Step | Conta Criada? | Documentos Enviados? | Status |
|------|---------------|---------------------|--------|
| 1    | ❌ Não        | ❌ Não              | Validando dados |
| 2    | ❌ Não        | ❌ Não              | Documentos em memória |
| 3    | ✅ Sim        | ✅ Sim              | Upload em progresso |
| 4    | ✅ Sim        | ✅ Sim              | `awaiting_verification` |

### Funções Principais:

```typescript
// Step 1 → Step 2
handleStep1Submit() {
  - Valida dados
  - Verifica se email existe
  - Avança para Step 2
}

// Step 2 → Step 3
handleStep2Submit() {
  - Valida documentos selecionados
  - Gera código OTP
  - Avança para Step 3
}

// Step 3 → Step 4
handleStep3Submit() {
  - Valida código OTP
  - Cria conta no Auth
  - Cria registro na tabela users
  - Faz upload de todos os documentos
  - Atualiza status para awaiting_verification
  - Avança para Step 4
}
```

## 🎨 Interface

### Barra de Progresso
```
[████] [████] [████] [████]
  1      2      3      4
```

### Botões de Navegação
- **Step 1**: "Continuar" →
- **Step 2**: "← Voltar" | "Continuar" →
- **Step 3**: "← Voltar" | "Verificar e Criar Conta" →
- **Step 4**: "Ir para Login"

## 🚀 Como Testar

1. Acesse `/register-kyc`
2. Preencha todos os dados básicos
3. Clique em "Continuar"
4. Selecione os 4 documentos obrigatórios
5. Clique em "Continuar"
6. Copie o código OTP exibido na tela
7. Cole no campo de verificação
8. Clique em "Verificar e Criar Conta"
9. Aguarde o upload dos documentos
10. Veja a mensagem de confirmação

## ⚠️ Observações Importantes

1. **Modo Desenvolvimento**: O código OTP é exibido na tela para facilitar testes
2. **Produção**: Em produção, o código deve ser enviado por email
3. **Upload**: Os documentos só são enviados após validação do email
4. **Rollback**: Se o upload falhar, a conta já foi criada mas sem documentos
5. **Reenvio**: Usuário pode acessar `/kyc-documents` para reenviar documentos

## 📊 Comparação: Antes vs Depois

### Antes (3 Steps):
```
Step 1: Dados → Cria conta → Envia OTP
Step 2: Valida OTP → Cria registro
Step 3: Upload documentos
```

### Depois (4 Steps):
```
Step 1: Dados → Valida
Step 2: Seleciona documentos → Gera OTP
Step 3: Valida OTP → Cria conta + Upload
Step 4: Confirmação
```

## ✅ Checklist de Validações

- [x] Email único
- [x] Senha mínimo 8 caracteres
- [x] Senhas coincidem
- [x] Telefone válido
- [x] Data de nascimento preenchida
- [x] 4 documentos selecionados
- [x] Arquivos com tipo válido (JPG, PNG, PDF)
- [x] Arquivos com tamanho máximo 5MB
- [x] Código OTP correto
- [x] Upload bem-sucedido de todos os documentos

## 🎉 Resultado Final

Após completar todas as etapas:
- ✅ Conta criada no Supabase Auth
- ✅ Registro na tabela `users` com status `awaiting_verification`
- ✅ 4 documentos enviados para o Storage
- ✅ 4 registros na tabela `kyc_documents`
- ✅ Usuário pode fazer login
- ✅ Admin pode visualizar e aprovar documentos
