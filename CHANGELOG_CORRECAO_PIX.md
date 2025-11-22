# Correção na Geração de QR Code PIX

## Problema Relatado
O usuário relatou que ao gerar um QR Code PIX, o código "Copia e Cola" ou o QR Code visual diziam ser inválidos no momento do pagamento.

## Diagnóstico
Analisando o código fonte, identificamos que a função de geração manual de Pix (`generatePixCode` em `src/services/bankAcquirerService.ts`) estava construindo o payload EMV de forma incorreta:
1. Os IDs dos campos TLV (Tag-Length-Value) estavam hardcoded e incorretos (ex: concatenando ID e Length como string fixa).
2. O cálculo do tamanho dos campos não era dinâmico, o que quebrava o código se a chave Pix ou o valor tivessem tamanhos diferentes do esperado.
3. A estrutura do campo "Merchant Account Information" (ID 26) estava fora do padrão BR Code.

Isso afetava principalmente usuários que utilizavam adquirentes configurados como "Manual" ou "Outros", ou quando o sistema caía no fallback de geração local.

## Solução Aplicada
A função `generatePixCode` foi completamente reescrita para:
1. **Seguir a especificação BR Code (EMV QRCPS)** do Banco Central.
2. **Cálculo Dinâmico**: Os tamanhos dos campos (Length) agora são calculados automaticamente baseados no conteúdo.
3. **Estrutura Correta**:
   - Payload Format Indicator (00)
   - Merchant Account Information (26) contendo GUI e Chave Pix corretamente aninhados.
   - Merchant Category Code (52)
   - Transaction Currency (53)
   - Transaction Amount (54)
   - Country Code (58)
   - Merchant Name (59)
   - Merchant City (60)
   - Additional Data Field Template (62) contendo o TxID.
   - CRC16 (63) calculado corretamente.

## Como Testar
1. Tente gerar um novo QR Code PIX no sistema.
2. Use o aplicativo do seu banco para ler o QR Code ou use a opção "Pix Copia e Cola".
3. O banco deve reconhecer os dados (Valor, Nome do Recebedor) corretamente e permitir o pagamento.

> Nota: Se você utiliza Mercado Pago ou EFI, o sistema deve priorizar a API desses bancos. Se o erro persistia neles, verifique se as credenciais (Tokens) estão corretas, pois falhas na API podem não estar caindo no fallback corretamente ou o adquirente pode estar configurado incorretamente no banco de dados (campo `bank_code` deve ser 'MP' ou 'EFI'). Mas para geração manual, o problema está resolvido.
