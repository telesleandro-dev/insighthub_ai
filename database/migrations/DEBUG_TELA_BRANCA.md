# 🔍 Debug: Tela Branca em Produção

## 1️⃣ **Verificar Console do Navegador**

Abra o DevTools (F12) e vá em **Console**:

```
Pressione F12 → Aba Console
```

**Procure por erros em vermelho:**
- ❌ `Uncaught TypeError`
- ❌ `Cannot read property 'X' of undefined`
- ❌ `Supabase error`
- ❌ `Network error`

**Me envie a mensagem de erro completa!**

---

## 2️⃣ **Verificar Aba Network (Requisições)**

No DevTools, vá em **Network** → **Fetch/XHR**:

**Procure por requisições:**
- 🔴 Status 500 (erro do servidor)
- 🔴 Status 401/403 (erro de autenticação)
- ⏳ Requisições que ficam "pending" por muito tempo

**Qual requisição está travando?**

---

## 3️⃣ **Possível Causa: Migration `recovered_at` Não Foi Executada**

Se o erro for algo como:
```
column "recovered_at" does not exist
```

**Solução:**
Execute a migration no Supabase:
[`009_add_recovered_at.sql`](file:///c:/Users/leandro.teles/Desktop/projetos/insighthub_%20ai/database/migrations/009_add_recovered_at.sql)

---

## 4️⃣ **Teste Rápido: Limpar Cache**

1. Abra DevTools (F12)
2. **Clique e segure** no botão de reload (🔄)
3. Escolha **"Esvaziar cache e atualizar de forma forçada"**

---

## 5️⃣ **Verificar Última View Acessada**

Qual tela você está tentando acessar?
- 📊 Dashboard?
- 🔄 Recuperação de Vendas?
- 🧠 Inteligência de Produtos?

---

## ✅ **Ação Imediata**

**Abra o Console (F12) e me envie:**
1. Mensagens de erro em vermelho
2. Última requisição que ficou travada (Network → Fetch/XHR)

Vou corrigir o problema imediatamente!
