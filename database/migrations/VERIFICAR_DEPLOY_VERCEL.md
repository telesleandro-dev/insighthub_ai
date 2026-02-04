# 🔍 Checklist de Verificação - Deploy Vercel

## 1. Verificar Status do Deploy

1. Acesse https://vercel.com/dashboard
2. Vá no projeto **insighthub-ai**
3. Aba **Deployments**
4. Verifique o último deploy (commit `0abff1b`)

**Status possíveis:**
- ✅ **Ready** → Deploy completou
- 🔄 **Building** → Ainda deployando (aguarde)
- ❌ **Error** → Erro no build (me envie o log)

---

## 2. Se Status = Ready, Verificar Logs

1. Clique no deployment **Ready**
2. Vá em **Functions**
3. Escolha a region (geralmente `iad1` ou `gru1`)
4. Clique em **Logs**
5. Envie webhook de teste
6. Procure por:
   ```
   [Webhook] Recovery Status: ...
   ```

**O que procurar:**
- ✅ `[Webhook] Recovery Status: eligible` → Correto!
- ❌ `[Webhook] Recovery Status: pending` → Código antigo ainda

---

## 3. Se Status = Error

1. Clique no deployment com erro
2. Vá em **Build Logs**
3. Procure por erros relacionados a:
   - `SaleStatus`
   - `abandoned`
   - Type errors

**Me envie o erro** se encontrar!

---

## 4. Forçar Novo Deploy (se necessário)

Se o deploy está **Ready** mas código antigo:

```bash
# No terminal local:
git commit --allow-empty -m "trigger: forçar redeploy Vercel"
git push origin main
```

Aguarde ~2 minutos e teste novamente.

---

## 5. Teste Alternativo - Localhost

Enquanto Vercel não funciona, teste localmente:

1. **URL:** `http://localhost:3000/api/webhook/unified?user_id=c048be53-fff6-4446-a8b8-6abf79fce171`
2. Mesmo payload
3. Deve funcionar imediatamente

---

## ✅ Ação Imediata

**Verifique o status do último deploy na Vercel** e me diga:
- Status do deploy?
- Há erros nos logs?
