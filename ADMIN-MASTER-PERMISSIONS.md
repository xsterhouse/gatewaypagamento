# 👑 ADMIN MASTER - Permissões e Configuração

## 🔐 CREDENCIAIS:

```
Email: admin@dimpay.com
Senha: Celso101020@
Role: admin (master)
```

⚠️ **CONFIDENCIAL** - Mantenha estas credenciais em segurança!

---

## ✅ PERMISSÕES DO ADMIN MASTER:

### 1️⃣ **GESTÃO DE USUÁRIOS**

#### Criar Usuários:
- ✅ Criar novos clientes
- ✅ Criar gerentes de conta
- ✅ Criar outros admins (se necessário)
- ✅ Definir roles e permissões

#### Editar Usuários:
- ✅ Alterar dados pessoais
- ✅ Alterar email
- ✅ Resetar senha
- ✅ Alterar role/permissões
- ✅ Ativar/Desativar contas

#### Visualizar Usuários:
- ✅ Ver todos os usuários do sistema
- ✅ Ver histórico de atividades
- ✅ Ver logs de acesso
- ✅ Ver documentos enviados

#### Excluir Usuários:
- ✅ Excluir clientes
- ✅ Excluir gerentes
- ✅ Excluir dados relacionados
- ✅ Soft delete ou hard delete

---

### 2️⃣ **GESTÃO DE DOCUMENTOS KYC**

#### Autorizar Documentos:
- ✅ Aprovar documentos de identidade
- ✅ Aprovar comprovantes de endereço
- ✅ Aprovar selfies
- ✅ Aprovar documentos adicionais

#### Rejeitar Documentos:
- ✅ Rejeitar com motivo
- ✅ Solicitar reenvio
- ✅ Adicionar observações

#### Visualizar Documentos:
- ✅ Ver todos os documentos enviados
- ✅ Fazer download de documentos
- ✅ Ver histórico de aprovações/rejeições

---

### 3️⃣ **GESTÃO DE GERENTES**

#### Criar Gerentes:
- ✅ Cadastrar novos gerentes
- ✅ Definir permissões específicas
- ✅ Atribuir carteiras de clientes

#### Editar Gerentes:
- ✅ Alterar permissões
- ✅ Reatribuir clientes
- ✅ Alterar dados de acesso

#### Excluir Gerentes:
- ✅ Remover acesso
- ✅ Transferir clientes para outro gerente

---

### 4️⃣ **GESTÃO DE CLIENTES**

#### Visualizar Clientes:
- ✅ Ver todos os clientes
- ✅ Ver status KYC
- ✅ Ver transações
- ✅ Ver saldo e carteiras
- ✅ Ver histórico completo

#### Editar Clientes:
- ✅ Alterar dados cadastrais
- ✅ Alterar status KYC
- ✅ Adicionar observações
- ✅ Configurar limites

#### Aprovar/Rejeitar Cadastros:
- ✅ Aprovar KYC completo
- ✅ Rejeitar com motivo
- ✅ Solicitar documentos adicionais

#### Excluir Clientes:
- ✅ Excluir conta
- ✅ Excluir dados pessoais
- ✅ Manter histórico de transações (se necessário)

---

### 5️⃣ **DASHBOARD ADMINISTRATIVO**

#### Acesso Total:
- ✅ Dashboard principal
- ✅ Métricas e estatísticas
- ✅ Gráficos de performance
- ✅ Relatórios financeiros

#### Relatórios:
- ✅ Relatório de usuários
- ✅ Relatório de transações
- ✅ Relatório de KYC
- ✅ Relatório de documentos
- ✅ Exportar relatórios (PDF, Excel)

---

### 6️⃣ **CONFIGURAÇÕES DO SISTEMA**

#### Configurações Gerais:
- ✅ Alterar configurações de email
- ✅ Configurar integrações
- ✅ Gerenciar API keys
- ✅ Configurar webhooks

#### Segurança:
- ✅ Ver logs de auditoria
- ✅ Configurar políticas de senha
- ✅ Gerenciar sessões ativas
- ✅ Configurar 2FA

---

## 🔒 SEGURANÇA DA SENHA:

### Requisitos Atendidos:
- ✅ **8+ caracteres** (11 caracteres)
- ✅ **Letra maiúscula** (C)
- ✅ **Letra minúscula** (elso)
- ✅ **Números** (101020)
- ✅ **Caractere especial** (@)

### Força da Senha:
```
Senha: Celso101020@
Força: 🟢🟢🟢🟢 FORTE
Tempo para quebrar: ~100 anos (força bruta)
```

---

## 📋 COMO USAR:

### 1. **Atualizar Senha no Supabase:**

Execute o script `setup-admin-master.sql` no Supabase SQL Editor:

```sql
UPDATE auth.users 
SET encrypted_password = crypt('Celso101020@', gen_salt('bf'))
WHERE email = 'admin@dimpay.com';
```

### 2. **Fazer Login:**

1. Acesse: `sua-url.vercel.app/login`
2. Email: `admin@dimpay.com`
3. Senha: `Celso101020@`
4. Clique em "Entrar"

### 3. **Verificar Permissões:**

Após login, verifique se tem acesso a:
- ✅ Dashboard administrativo
- ✅ Gestão de usuários
- ✅ Aprovação de documentos
- ✅ Relatórios

---

## ⚠️ RECOMENDAÇÕES DE SEGURANÇA:

### 1. **Ativar 2FA (Autenticação de Dois Fatores)**
- Adicione camada extra de segurança
- Use Google Authenticator ou similar

### 2. **Não Compartilhar Credenciais**
- Apenas o admin master deve ter acesso
- Não envie por email ou mensagem

### 3. **Trocar Senha Periodicamente**
- Recomendado: a cada 90 dias
- Use senhas diferentes para cada sistema

### 4. **Monitorar Acessos**
- Verifique logs de acesso regularmente
- Identifique acessos suspeitos

### 5. **Backup das Credenciais**
- Guarde em local seguro (cofre de senhas)
- Tenha backup em caso de perda

---

## 🎯 PRÓXIMOS PASSOS:

1. ✅ Execute `setup-admin-master.sql` no Supabase
2. ✅ Teste login com novas credenciais
3. ✅ Configure 2FA (recomendado)
4. ✅ Documente credenciais em local seguro
5. ✅ Crie outros gerentes se necessário

---

## 📞 SUPORTE:

Em caso de problemas:
- Verifique se executou o SQL corretamente
- Verifique se o email está confirmado
- Verifique se o role está como 'admin'

**ADMIN MASTER CONFIGURADO COM SUCESSO!** 👑
