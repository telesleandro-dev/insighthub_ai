# 🐛 Debug: produto_identificado não está sendo salvo

## Passos para Descobrir o Problema

### 1. Reinicie o Servidor (IMPORTANTE!)

```powershell
# No terminal do npm run dev:
Ctrl + C

# Execute novamente:
npm run dev
```

Aguarde aparecer `✓ Ready`

---

### 2. Envie o Email de Teste Novamente

```powershell
$headers = @{ "Content-Type" = "application/json" }
$body = Get-Content "test-data\email-critica-negativa.json" -Raw
Invoke-WebRequest -Uri "http://localhost:3000/api/emails/inbound" -Method POST -Headers $headers -Body $body -UseBasicParsing
```

---

### 3. Veja os Logs no Terminal

Procure por estas mensagens no terminal:

```
📊 Análise completa da Gemini: {...}
✅ Produto identificado pela IA: Bíblia Negra da Sedução
🎯 Product matched no banco: uuid-aqui
💾 Salvando no banco: { produto_identificado: '...', product_id: '...' }
```

**OU**

```
❌ Gemini NÃO retornou produto_identificado
```

---

## 🔍 Possíveis Problemas e Soluções

### Problema 1: Gemini NÃO retorna produto_identificado

**Logs mostram:**
```
❌ Gemini NÃO retornou produto_identificado
💾 Salvando no banco: { produto_identificado: undefined, product_id: null }
```

**Solução:**
Verifique se `GEMINI_API_KEY` está configurada em `.env.local`

---

### Problema 2: Produto não encontrado no banco

**Logs mostram:**
```
✅ Produto identificado pela IA: Bíblia Negra da Sedução
⚠️ Produto não encontrado no banco com nome: Bíblia Negra da Sedução
```

**Solução:**
Cadastre o produto no menu **Produtos** com nome exato ou similar.

---

### Problema 3: Colunas não existem

**Logs mostram erro SQL:**
```
column "produto_identificado" does not exist
```

**Solução:**
Execute a migration [`ATIVAR_FILTRO_PRODUTOS.sql`](file:///c:/Users/leandro.teles/Desktop/projetos/insighthub_%20ai/database/migrations/ATIVAR_FILTRO_PRODUTOS.sql)

---

## ✅ Teste Completo

Depois de reiniciar, execute:

```powershell
# Limpar terminal
Clear-Host

# Enviar email
$headers = @{ "Content-Type" = "application/json" }
$body = Get-Content "test-data\email-critica-negativa.json" -Raw
Invoke-WebRequest -Uri "http://localhost:3000/api/emails/inbound" `
  -Method POST `
  -Headers $headers `
  -Body $body `
  -UseBasicParsing

# Ver últimos emails no banco
```

**Depois, verifique no Supabase:**

```sql
SELECT 
  id,
  subject,
  produto_identificado,
  product_id,
  created_at
FROM inbox_messages
ORDER BY created_at DESC
LIMIT 3;
```

---

**Cole os logs aqui se precisar de ajuda!** 📋
