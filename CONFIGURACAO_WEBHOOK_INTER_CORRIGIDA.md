# Configuração Correta do Webhook Banco Inter

## 1. URL do Webhook
A URL que você estava usando estava incorreta (misturava o domínio do seu app com o do Supabase).

**URL Correta:**
```
https://[SEU_ID_DO_SUPABASE].supabase.co/functions/v1/banco-inter-webhook
```
*(Substitua `[SEU_ID_DO_SUPABASE]` pelo ID que aparece na sua URL do Supabase, exemplo: `oxhz...`)*

## 2. Atualizações Realizadas no Código
Atualizamos o código do webhook (`supabase/functions/banco-inter-webhook/index.ts`) para corrigir os seguintes problemas:

- **Correção da Busca:** Agora busca pelo campo `pix_txid` correto, em vez de `transaction_id` que não existia.
- **Status Correto:** Atualiza o status para `paid` (padrão do sistema) em vez de `completed`.
- **Crédito Automático:** Adicionada lógica para **creditar o saldo** na carteira do usuário (`wallets`) e registrar no extrato (`wallet_transactions`). Antes, o webhook apenas marcava como pago mas não entregava o dinheiro.
- **Taxas:** Agora processa e separa a taxa do sistema automaticamente.

## 3. Como Testar
1. Atualize a URL no painel do Banco Inter.
2. Gere um novo PIX no sistema.
3. Faça o pagamento (pode ser R$ 1,00 para teste).
4. Verifique se o saldo caiu na conta do usuário.

> **Nota:** Para pagamentos passados que já foram pagos no banco mas não caíram no sistema, você precisará aprovar manualmente no banco de dados ou fazer um crédito manual para o usuário.
