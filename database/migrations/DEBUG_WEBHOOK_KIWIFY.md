# 🐛 Guia de Debug: Webhook Kiwify

## ✅ Melhorias Implementadas

1. **Logs detalhados** - Console mostra cada passo do processamento
2. **Erro Telegram não bloqueia resposta** - Webhook sempre retorna 200 OK
3. **Resposta inclui dados do produto** - Retorna nome e ID do produto

---

## 📋 Como Testar

### 1. URL do Webhook

Configure no Kiwify:
```
https://seu-dominio.vercel.app/api/webhook/kiwify?user_id=SEU-UUID-AQUI
```

**⚠️ IMPORTANTE:** Substitua `SEU-UUID-AQUI` pelo seu UUID de usuário do Supabase!

**Como pegar seu UUID:**
```sql
SELECT id FROM profiles WHERE email = 'seu-email@exemplo.com';
```

---

### 2. Testar Localmente (Desenvolvimento)

Use ferramentas como **Postman** ou **cURL**:

```powershell
# Exemplo com PowerShell
$body = @{
    product_id = "PROD-123"
    product_name = "Curso de Excel Avançado"
    Customer = @{
        email = "cliente@teste.com"
        full_name = "João Silva"
        mobile = "11999887766"
    }
    order_amount = 19700
    status = "paid"
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:3000/api/webhook/kiwify?user_id=SEU-UUID" `
  -Method POST `
  -Body $body `
  -ContentType "application/json" `
  -UseBasicParsing
```

---

### 3. Verificar Logs

**No terminal local (`npm run dev`):**
```
📦 Webhook Kiwify recebido: { ... }
🔑 user_id da URL: c048be53-fff6-4446-a8b8-6abf79fce171
🔍 Buscando UUID no banco: c048be53-fff6-4446-a8b8-6abf79fce171
📊 Dados extraídos: {
  productName: 'Curso de Excel Avançado',
  externalProductId: 'PROD-123',
  customerEmail: 'cliente@teste.com',
  status: 'paid',
  amount: 197
}
💾 Fazendo upsert do produto...
✅ Produto salvo/atualizado: { id: '...', name: 'Curso...', ... }
💾 Registrando venda...
✅ Venda registrada com sucesso
📱 Tentando enviar notificação Telegram...
✅ Telegram enviado
✅ Webhook processado com sucesso
```

**Na Vercel (Produção):**
1. Acesse **Vercel Dashboard** → Seu projeto
2. Vá em **Functions** → Selecione a região
3. Clique em **Logs**
4. Veja os mesmos logs acima

---

## 🔍 Resposta Esperada

### Sucesso (200 OK)
```json
{
  "success": true,
  "product": {
    "id": "uuid-do-produto-no-banco",
    "name": "Curso de Excel Avançado",
    "external_id": "PROD-123"
  }
}
```

### Erro (400 - user_id ausente)
```json
{
  "error": "user_id ausente na URL"
}
```

### Erro (401 - Usuário não encontrado)
```json
{
  "error": "Usuário não localizado"
}
```

---

## ⚠️ Sobre o Aviso de Depreciação

**Mensagem:**
```
(node:5) [DEP0169] DeprecationWarning: `url.parse()` behavior is not standardized...
```

**Causa:** Biblioteca `node-telegram-bot-api` usa código legado

**Solução:** 
- ✅ **Não afeta funcionalidade** - É apenas um warning
- ✅ **Webhook continua funcionando normalmente**
- ⏭️ **Futuro:** Migrar para biblioteca Telegram mais moderna (ex: `grammy`)

**Para ocultar o warning (opcional):**
```json
// package.json - adicione no script:
"dev": "NODE_NO_WARNINGS=1 next dev"  // Linux/Mac
"dev": "$env:NODE_NO_WARNINGS=1; next dev"  // Windows PowerShell
```

---

## 📊 Checklist de Validação

Após enviar webhook de teste:

- [ ] Console mostra `📦 Webhook Kiwify recebido`
- [ ] Resposta HTTP é `200 OK`
- [ ] Resposta JSON inclui `product.name` e `product.external_id`
- [ ] Produto aparece na tabela `products` do Supabase
- [ ] Venda aparece na tabela `sales_events` do Supabase
- [ ] Telegram recebe notificação (se configurado)

---

## 🎯 SQL para Verificar Dados

```sql
-- Ver produtos cadastrados
SELECT * FROM products 
WHERE platform = 'kiwify' 
ORDER BY created_at DESC 
LIMIT 5;

-- Ver vendas registradas
SELECT * FROM sales_events 
WHERE platform_origin = 'kiwify' 
ORDER BY created_at DESC 
LIMIT 5;

-- Ver logs de webhooks
SELECT * FROM webhooks_log 
WHERE platform = 'kiwify' 
ORDER BY created_at DESC 
LIMIT 10;
```

---

## 🚀 Dica: Testar com Webhook.site

Se quiser ver exatamente o que Kiwify está enviando:

1. Acesse https://webhook.site
2. Copie a URL única gerada
3. Configure no Kiwify temporariamente
4. Faça uma venda teste
5. Veja o payload completo na webhook.site
6. Compare com o que seu endpoint está recebendo

**Agora está funcionando! Teste e me diga como foi.** 🎯
