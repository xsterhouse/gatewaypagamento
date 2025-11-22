# Guia de Implementação do Sistema de Faturas

## 📋 Overview

Sistema completo de cadastro de clientes e geração de faturas em PDF com QR code e código de barras para o painel do cliente.

## 🗄️ 1. Configuração do Banco de Dados

Execute o seguinte SQL no seu banco de dados Supabase:

```sql
-- Execute o arquivo CREATE_INVOICES_CUSTOMERS_TABLES.sql
```

Este script criará:
- Tabela `customers` para dados dos clientes
- Tabela `invoices` para as faturas
- Índices e políticas RLS de segurança
- Triggers para atualização automática de timestamps

## 🧩 2. Componentes Criados

### Componentes UI
- `CustomerForm.tsx` - Formulário completo de cadastro de cliente em 2 passos
- `InvoiceModal.tsx` - Modal para gerenciar todas as faturas
- `InvoicePDF.tsx` - Gerador de PDF com QR code e código de barras

### Componentes UI Adicionais
- `textarea.tsx` - Campo de texto multilinha
- `switch.tsx` - Toggle para juros
- `popover.tsx` - Popover para calendário
- `calendar.tsx` - Calendário para seleção de data

### Types
- `types/invoice.ts` - Interfaces TypeScript para Customer e Invoice

## 🚀 3. Funcionalidades Implementadas

### Cadastro de Cliente
- ✅ Nome completo
- ✅ Endereço completo
- ✅ CEP (com formatação automática)
- ✅ Telefone (com formatação automática)
- ✅ Email (com validação)
- ✅ CPF (com formatação automática)

### Fatura
- ✅ Descrição detalhada da cobrança
- ✅ Valor (com formatação de moeda)
- ✅ Data de vencimento (com calendário)
- ✅ Opção de juros por atraso
- ✅ Taxa de juros configurável

### PDF da Fatura
- ✅ Layout profissional
- ✅ Dados completos do cliente
- ✅ Descrição e valor da cobrança
- ✅ QR Code para pagamento PIX
- ✅ Código de barras
- ✅ Status da fatura
- ✅ Download automático

## 📱 4. Como Usar

### Acessando o Sistema
1. Vá para a página de Depósitos no painel do cliente
2. Clique no botão "Faturas" (ícone de receipt)
3. O modal de gerenciamento de faturas abrirá

### Criando Nova Fatura
1. No modal, clique em "Nova Fatura" ou "Começar Cadastro"
2. **Passo 1**: Preencha todos os dados do cliente
3. **Passo 2**: Configure os dados da fatura
4. Clique em "Criar Fatura"

### Gerenciando Faturas
- **Visualizar**: Todas as faturas aparecem na lista
- **Download PDF**: Clique no botão "PDF" para baixar
- **Enviar**: Botão "Enviar" (funcionalidade de email em desenvolvimento)

## 🔧 5. Dependências

As seguintes dependências foram instaladas:
```bash
npm install date-fns @radix-ui/react-switch @radix-ui/react-popover react-day-picker
```

## 📄 6. Estrutura dos Arquivos

```
src/
├── components/
│   ├── ui/
│   │   ├── textarea.tsx (novo)
│   │   ├── switch.tsx (novo)
│   │   ├── popover.tsx (novo)
│   │   └── calendar.tsx (novo)
│   ├── CustomerForm.tsx (novo)
│   ├── InvoiceModal.tsx (novo)
│   └── InvoicePDF.tsx (novo)
├── types/
│   └── invoice.ts (novo)
└── pages/
    └── Deposits.tsx (atualizado)
```

## ⚙️ 7. Configurações Adicionais

### Personalização do PDF
Edite `InvoicePDF.tsx` para personalizar:
- Logo da empresa
- Cores e fontes
- Informações de contato
- Layout do QR Code

### Configuração PIX
Atualize as funções em `InvoicePDF.tsx`:
- `generatePIXData()` - Configure sua chave PIX
- Dados do cobrador (nome, cidade)

## 🐛 8. Solução de Problemas

### Erros Comuns
1. **Permissões negadas**: Verifique as políticas RLS no Supabase
2. **Componentes não encontrados**: Verifique se todos os imports estão corretos
3. **PDF não gera**: Verifique as dependências `jspdf` e `qrcode`

### Debug
- Use o console do navegador para verificar erros
- Verifique a aba Network do DevTools
- Teste o SQL diretamente no Supabase Dashboard

## 🔄 9. Próximos Passos

### Melhorias Sugeridas
- [ ] Integração com API de email real
- [ ] Configuração de chave PIX dinâmica
- [ ] Histórico de pagamentos
- [ ] Notificações de vencimento
- [ ] Relatórios de faturas
- [ ] Exportação em lote

### Segurança
- [ ] Validação de CPF mais robusta
- [ ] Rate limiting para geração de PDF
- [ ] Logs de auditoria
- [ ] Backup automático

## 📞 10. Suporte

Para dúvidas ou problemas:
1. Verifique os logs no console
2. Teste o SQL no Supabase
3. Verifique as dependências no package.json
4. Revise este guia passo a passo

---

**Sistema desenvolvido com ❤️ usando React, TypeScript, Supabase e jsPDF**
