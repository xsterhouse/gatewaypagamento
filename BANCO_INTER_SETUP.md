# Configuração do Banco Inter para Envio de PIX

## Pré-requisitos

1. **Conta PJ no Banco Inter** com API Banking habilitada
2. **Certificado Digital** (e-CPF ou e-CNPJ)
3. **Acesso ao Portal de APIs** do Banco Inter

## Passo a Passo

### 1. Obter Credenciais no Portal do Banco Inter

1. Acesse: https://developers.bancointer.com.br/
2. Faça login com sua conta PJ
3. Vá em **"Minhas Aplicações"** > **"Nova Aplicação"**
4. Preencha os dados da aplicação:
   - Nome: Gateway de Pagamento
   - Tipo: Banking
   - Escopos necessários:
     - `pix-pagamento.write` (Enviar PIX)
     - `pix-pagamento.read` (Consultar PIX)

5. Após criar, você receberá:
   - **Client ID**
   - **Client Secret**

### 2. Configurar Certificado Digital

O Banco Inter requer certificado digital para autenticação. Você precisa:

1. **Certificado (.crt ou .pem)**
2. **Chave privada (.key)**

Se você tem um arquivo .pfx/.p12, converta para .pem:

```bash
# Extrair certificado
openssl pkcs12 -in certificado.pfx -clcerts -nokeys -out certificado.pem

# Extrair chave privada
openssl pkcs12 -in certificado.pfx -nocerts -nodes -out chave-privada.key
```

### 3. Configurar Variáveis de Ambiente no Supabase

No painel do Supabase, vá em **Settings** > **Edge Functions** > **Environment Variables** e adicione:

```env
BANCO_INTER_CLIENT_ID=seu_client_id_aqui
BANCO_INTER_CLIENT_SECRET=seu_client_secret_aqui
BANCO_INTER_CERTIFICATE=conteudo_do_certificado_pem_em_base64
BANCO_INTER_CERTIFICATE_KEY=conteudo_da_chave_privada_em_base64
BANCO_INTER_ACCOUNT_NUMBER=numero_da_conta_corrente
```

**Importante:** Os certificados devem ser codificados em Base64:

```bash
# Linux/Mac
cat certificado.pem | base64 -w 0

# Windows (PowerShell)
[Convert]::ToBase64String([IO.File]::ReadAllBytes("certificado.pem"))
```

### 4. Número da Conta Corrente

O número da conta deve estar no formato: `XXXXXXX` (apenas números, sem dígito verificador)

Exemplo: Se sua conta é `12345678-9`, use apenas `12345678`

## Testando a Integração

### Ambiente de Homologação (Sandbox)

O Banco Inter oferece um ambiente de testes. Para usar:

1. Altere a `baseUrl` em `bancoInter.ts`:
```typescript
private baseUrl = 'https://cdpj-sandbox.partners.bancointer.com.br'
```

2. Use as credenciais de sandbox fornecidas pelo Banco Inter

### Ambiente de Produção

Certifique-se de:
- ✅ Ter saldo suficiente na conta
- ✅ Limites de PIX configurados
- ✅ Certificado válido e não expirado
- ✅ Todas as variáveis de ambiente configuradas

## Limites e Taxas

- **Limite por transação**: Até R$ 100.000,00
- **Limite diário**: Configurável no app do Banco Inter
- **Taxa por PIX**: Consulte seu gerente (geralmente isento para PJ)

## Troubleshooting

### Erro: "Invalid certificate"
- Verifique se o certificado está em formato PEM
- Confirme que o certificado não está expirado
- Certifique-se que o certificado está em Base64

### Erro: "Unauthorized"
- Verifique Client ID e Client Secret
- Confirme que os escopos estão corretos
- Tente gerar novas credenciais no portal

### Erro: "Insufficient funds"
- Verifique o saldo da conta
- Confirme os limites de PIX no app

### Erro: "Invalid account"
- Verifique o número da conta (sem dígito verificador)
- Confirme que a conta tem API Banking habilitada

## Documentação Oficial

- Portal de Desenvolvedores: https://developers.bancointer.com.br/
- Documentação da API: https://developers.bancointer.com.br/reference
- Suporte: suporte.api@bancointer.com.br

## Segurança

⚠️ **IMPORTANTE:**
- Nunca commite certificados ou chaves privadas no Git
- Use sempre variáveis de ambiente
- Mantenha as credenciais seguras
- Renove certificados antes do vencimento
- Monitore logs de acesso à API
