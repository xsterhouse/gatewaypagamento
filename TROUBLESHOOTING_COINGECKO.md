# 🔧 Troubleshooting - CoinGecko API

## ❌ Erro: Preço NULL

### **Sintoma:**
```
Error: can't access property "toLocaleString", coin.current_price is null
```

### **Causa:**
A API do CoinGecko pode retornar `null` para alguns preços por diversos motivos:
- Moeda em manutenção
- API temporariamente indisponível
- Moeda descontinuada
- Problemas de conexão
- Rate limit atingido

---

## ✅ Solução Implementada

### **1. Filtragem de Dados Null**

**Antes (com erro):**
```typescript
const prices = data.map(coin => ({
  price_brl: coin.current_price  // ❌ pode ser null
}))
```

**Depois (sem erro):**
```typescript
const prices = data
  .filter(coin => coin.current_price !== null)  // ✅ filtra null
  .map(coin => ({
    price_brl: coin.current_price  // ✅ sempre válido
  }))
```

### **2. Logs para Debug**

```typescript
// Avisar quando houver preços null
const validData = data.filter(coin => {
  if (coin.current_price === null) {
    console.warn(`⚠️ Preço null para ${coin.symbol}`)
    return false
  }
  return true
})

console.log(`${validData.length} moedas com preços válidos`)
```

### **3. Valores Padrão**

```typescript
price_brl: coin.current_price || 0,
change_24h: coin.price_change_percentage_24h || 0,
volume_24h: coin.total_volume || 0
```

---

## 🧪 Como Testar se Está Corrigido

### **Teste 1: HTML (TESTE_COINGECKO_API.html)**
```
1. Abra o arquivo no navegador
2. Abra Console (F12)
3. ✅ Sem erros
4. ⚠️ Avisos de preços null (se houver)
5. ✅ Moedas válidas aparecem
```

### **Teste 2: Exchange**
```
1. npm run dev
2. Acesse /exchange
3. Abra Console (F12)
4. ✅ Logs: "CoinGecko retornou X moedas"
5. ✅ Logs: "Y moedas com preços válidos"
6. ⚠️ Avisos: "Preço null para SYMBOL"
7. ✅ Interface mostra apenas moedas válidas
```

---

## 🔍 Outros Erros Comuns

### **1. CORS Error**
```
Access to fetch has been blocked by CORS policy
```

**Causa:** Navegador bloqueando requisições

**Solução:**
- API pública do CoinGecko permite CORS
- Verificar se URL está correta
- Testar em navegador diferente
- Usar servidor de desenvolvimento (`npm run dev`)

### **2. 429 Too Many Requests**
```
Error 429: Rate limit exceeded
```

**Causa:** Muitas requisições/minuto

**Solução:**
- Aumentar intervalo de atualização
- Usar cache mais agressivo
- Aguardar 1 minuto antes de tentar novamente

```typescript
// Aumentar intervalo
useCryptoPrices({ 
  updateInterval: 10  // 5 → 10 minutos
})
```

### **3. Timeout Error**
```
Failed to fetch: NetworkError
```

**Causa:** API demorou muito para responder

**Solução:**
```typescript
// Adicionar timeout
const controller = new AbortController()
const timeoutId = setTimeout(() => controller.abort(), 10000)

fetch(url, { signal: controller.signal })
  .finally(() => clearTimeout(timeoutId))
```

### **4. Moeda Não Encontrada**
```
Preço sempre 0 para uma moeda específica
```

**Causa:** ID do CoinGecko incorreto

**Solução:**
```typescript
// Verificar mapeamento
const COIN_ID_MAP = {
  'BTC': 'bitcoin',     // ✅ Correto
  'ETH': 'ethereum',    // ✅ Correto
  'DOGE': 'doge'        // ❌ Errado - deveria ser 'dogecoin'
}

// Buscar ID correto
// https://api.coingecko.com/api/v3/coins/list
```

---

## 📊 Monitoramento

### **Console Logs Úteis:**

```typescript
// Sucesso
✅ CoinGecko retornou 8 moedas
✅ 8 moedas com preços válidos

// Aviso
⚠️ Preço null para MATIC
⚠️ Preço null para DOT
✅ 6 moedas com preços válidos

// Erro
❌ CoinGecko API error: 429
❌ NetworkError: Failed to fetch
```

### **No Hook useCryptoPrices:**

```typescript
const { prices, error, loading } = useCryptoPrices()

// Verificar estado
console.log('Preços:', prices.length)
console.log('Erro:', error)
console.log('Carregando:', loading)
```

---

## 🛡️ Estratégias de Fallback

### **1. Cache Inteligente**

```typescript
// Se API falhar, usar cache do banco
try {
  const apiPrices = await fetchFromAPI()
  saveToDatabase(apiPrices)
} catch (error) {
  console.warn('API falhou, usando cache')
  return loadFromDatabase()
}
```

### **2. Dados Mock para Desenvolvimento**

```typescript
const MOCK_PRICES = [
  { symbol: 'BTC', price_brl: 350000, change_24h: 2.5 },
  { symbol: 'ETH', price_brl: 18000, change_24h: 1.2 }
]

// Usar se em desenvolvimento E API falhar
if (isDevelopment && apiError) {
  return MOCK_PRICES
}
```

### **3. Toast de Erro Amigável**

```typescript
catch (error) {
  toast.error('Erro ao atualizar preços. Usando dados em cache.')
  // Continua funcionando com dados antigos
}
```

---

## ✅ Checklist de Saúde

Verifique periodicamente:

- [ ] Console sem erros vermelhos
- [ ] Todos os preços aparecem (ou aviso de null)
- [ ] Atualização automática funciona
- [ ] Botão manual funciona
- [ ] Toast de sucesso aparece
- [ ] Horário atualiza
- [ ] Sem rate limit errors
- [ ] Cache funcionando

---

## 🔄 Fluxo Completo Corrigido

```
Página carrega
    ↓
Hook useCryptoPrices
    ↓
Busca cache (banco)
    ↓
    ├─ Cache válido → Usa cache
    └─ Cache inválido → Chama API
        ↓
        API CoinGecko
        ↓
        ├─ Sucesso
        │   ↓
        │   Filtra preços null ✅
        │   ↓
        │   Salva no banco
        │   ↓
        │   Atualiza interface
        │
        └─ Erro
            ↓
            Usa cache antigo ✅
            ↓
            Mostra toast de aviso
```

---

## 📝 Resumo das Correções

| Problema | Solução |
|----------|---------|
| Preço null | ✅ Filtrar antes de processar |
| Sem feedback | ✅ Logs e avisos |
| App quebra | ✅ Try/catch e fallback |
| Dados antigos | ✅ Indicador de desatualizado |
| Rate limit | ✅ Intervalo adequado (5min) |

---

**✅ Erro corrigido e sistema robusto!**

**Sistema agora lida com preços null graciosamente!**
