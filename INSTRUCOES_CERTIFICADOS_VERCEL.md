# 🔐 Como Configurar Certificados do Banco Inter na Vercel

Para que a Serverless Function consiga se autenticar com o Banco Inter, você precisa adicionar seus certificados e credenciais como **variáveis de ambiente** no seu projeto Vercel.

## Passo 1: Converter Certificados para uma Linha

As variáveis de ambiente da Vercel não aceitam quebras de linha. Você precisa converter o conteúdo dos seus arquivos `.pem` (ou `.crt` e `.key`) para uma única linha, substituindo as quebras de linha por `\n`.

### 1.1: Converter o Certificado (`.pem` ou `.crt`)

1.  Abra seu arquivo de certificado (ex: `inter_cert.pem`) em um editor de texto.
2.  Copie todo o conteúdo, incluindo `-----BEGIN CERTIFICATE-----` e `-----END CERTIFICATE-----`.
3.  Cole em um editor de texto simples (como Bloco de Notas ou VS Code).
4.  Substitua todas as quebras de linha por `\n`.

**Exemplo:**

**Original:**
```pem
-----BEGIN CERTIFICATE-----
MIIC...
...XYZ
-----END CERTIFICATE-----
```

**Convertido para uma linha:**
```
-----BEGIN CERTIFICATE-----\nMIIC...\n...XYZ\n-----END CERTIFICATE-----
```

### 1.2: Converter a Chave Privada (`.key`)

1.  Abra seu arquivo de chave privada (ex: `inter_key.pem`).
2.  Faça o mesmo processo: copie tudo e substitua as quebras de linha por `\n`.

**Exemplo:**

**Original:**
```pem
-----BEGIN PRIVATE KEY-----
MIIE...
...ABC
-----END PRIVATE KEY-----
```

**Convertido para uma linha:**
```
-----BEGIN PRIVATE KEY-----\nMIIE...\n...ABC\n-----END PRIVATE KEY-----
```

**Dica:** Em editores como VS Code, você pode usar a função "Localizar e Substituir" (Ctrl+H). Ative a opção de Expressão Regular (.*) e substitua `\n` por `\\n`.

## Passo 2: Adicionar Variáveis de Ambiente na Vercel

1.  Acesse o dashboard do seu projeto na Vercel.
2.  Vá para **Settings -> Environment Variables**.
3.  Adicione as seguintes variáveis, uma por uma:

| Nome da Variável | Valor |
| :--- | :--- |
| `BANCO_INTER_CLIENT_ID` | Seu Client ID do Banco Inter. |
| `BANCO_INTER_CLIENT_SECRET` | Seu Client Secret do Banco Inter. |
| `BANCO_INTER_CERTIFICATE` | O conteúdo do seu **certificado** convertido para uma linha (com `\n`). |
| `BANCO_INTER_CERTIFICATE_KEY` | O conteúdo da sua **chave privada** convertido para uma linha (com `\n`). |
| `BANCO_INTER_PIX_KEY` | A chave PIX principal da sua conta Inter (CNPJ, email, etc.). |
| `WEBHOOK_URL_INTER` | A URL da sua função de webhook (ex: `https://seu-app.vercel.app/api/banco-inter-webhook`). |

**Importante:** Ao adicionar as variáveis, certifique-se de que elas estão habilitadas para os ambientes **Production**, **Preview** e **Development**.

## Passo 3: Fazer Redeploy

Após adicionar todas as variáveis de ambiente, você precisa fazer um novo deploy para que as alterações tenham efeito.

1.  Vá para a aba **Deployments** no seu projeto Vercel.
2.  Encontre o último deploy e clique no menu de três pontos (…).
3.  Selecione **Redeploy**.

## Passo 4: Testar

Após o deploy ser concluído, acesse a nova página que criei para você:

`/admin/inter-setup`

1.  Preencha sua chave PIX.
2.  Clique em "Registrar Webhook".
3.  Verifique o resultado. Se tudo estiver configurado corretamente, você receberá uma mensagem de sucesso!

## Troubleshooting

*   **Erro "Variáveis de ambiente não configuradas":** Verifique se os nomes das variáveis na Vercel estão exatamente como listados acima.
*   **Erro "Falha na autenticação":**
    *   Confirme se o Client ID e Client Secret estão corretos.
    *   Verifique se os certificados foram convertidos corretamente para uma única linha, mantendo os `\n`.
*   **Erro de Certificado Inválido:**
    *   Certifique-se de que copiou o conteúdo completo dos arquivos `.pem`, incluindo as linhas `-----BEGIN...` e `-----END...`.
    *   Verifique se o certificado não está expirado.

Se os problemas persistirem, verifique os logs da função `api/register-inter-webhook` no dashboard da Vercel para obter mais detalhes sobre o erro.