# 🧪 Guia: Testar Webhook Kiwify Localmente com Insomnia

## 📋 Pré-requisitos

1. ✅ **Servidor local rodando**
   ```powershell
   cd c:\Users\leandro.teles\Desktop\projetos\insighthub_ ai
   npm run dev
   ```
   Aguarde aparecer: `✓ Ready in [tempo]ms`

2. ✅ **Insomnia instalado**  
   Se não tiver: https://insomnia.rest/download

3. ✅ **Seu UUID de usuário**
   Pegue no Supabase:
   ```sql
   SELECT id FROM profiles WHERE email = 'seu-email@exemplo.com';
   ```
   Exemplo: `c048be53-fff6-4446-a8b8-6abf79fce171`

---

## 🎯 Passo a Passo no Insomnia

### **1. Criar Nova Request**

1. Abra o Insomnia
2. Clique em **"New HTTP Request"** ou `Ctrl+N`
3. Renomeie para: `Webhook Kiwify - Local`

---

### **2. Configurar Request**

#### **Método:**
```
POST
```

#### **URL:**
```
http://localhost:3000/api/webhook/kiwify?user_id=SEU-UUID-AQUI
```

**⚠️ IMPORTANTE:** Substitua `SEU-UUID-AQUI` pelo UUID real!

**Exemplo completo:**
```
http://localhost:3000/api/webhook/kiwify?user_id=c048be53-fff6-4446-a8b8-6abf79fce171
```

---

### **3. Configurar Headers**

Vá na aba **Headers** e adicione:

| Key | Value |
|-----|-------|
| `Content-Type` | `application/json` |

---

### **4. Configurar Body**

1. Vá na aba **Body**
2. Selecione: `JSON`
3. Cole o payload abaixo:

```json
{
  "product_id": "PROD-BIBLIA-001",
  "product_name": "Bíblia Negra da Sedução e Poder",
  "order_amount": 19700,
  "status": "paid",
  "Customer": {
    "email": "joao.silva@gmail.com",
    "full_name": "João Silva Santos",
    "mobile": "11987654321"
  },
  "order_id": "KW-12345-67890",
  "order_ref": "REF-TEST-001",
  "created_at": "2026-02-03T14:30:00.000Z"
}
```

---

### **5. Enviar Request**

1. Clique no botão **Send** (ou `Ctrl+Enter`)
2. Aguarde a resposta

---

## ✅ Resposta Esperada (Sucesso)

### **Status Code:** `200 OK`

### **Body:**
```json
{
  "success": true,
  "product": {
    "id": "uuid-do-produto-no-banco",
    "name": "Bíblia Negra da Sedução e Poder",
    "external_id": "PROD-BIBLIA-001"
  }
}
```

---

## 🔍 Verificar nos Logs

No terminal onde está rodando `npm run dev`, você verá:

```
📦 Webhook Kiwify recebido: { "product_id": "PROD-BIBLIA-001", ... }
🔑 user_id da URL: c048be53-fff6-4446-a8b8-6abf79fce171
🔍 Buscando UUID no banco: c048be53-fff6-4446-a8b8-6abf79fce171
📊 Dados extraídos: {
  productName: 'Bíblia Negra da Sedução e Poder',
  externalProductId: 'PROD-BIBLIA-001',
  customerEmail: 'joao.silva@gmail.com',
  status: 'paid',
  amount: 197
}
💾 Fazendo upsert do produto...
✅ Produto salvo/atualizado: { id: '...', ... }
💾 Registrando venda...
✅ Venda registrada com sucesso
✅ Webhook processado com sucesso
```

---

## 🗂️ Payloads de Teste Adicionais

### **Carrinho Abandonado**
```json
{
  "product_id": "PROD-EXCEL-002",
  "product_name": "Curso de Excel Avançado",
  "order_amount": 9900,
  "status": "waiting_payment",
  "Customer": {
    "email": "maria.santos@hotmail.com",
    "full_name": "Maria Santos",
    "mobile": "11912345678"
  },
  "order_id": "KW-ABANDONED-001",
  "created_at": "2026-02-03T14:35:00.000Z"
}
```

### **Venda Cancelada**
```json
{
  "product_id": "PROD-MENTORIA-003",
  "product_name": "Mentoria Premium",
  "order_amount": 49700,
  "status": "refunded",
  "Customer": {
    "email": "carlos.oliveira@outlook.com",
    "full_name": "Carlos Oliveira",
    "mobile": "21987654321"
  },
  "order_id": "KW-REFUND-001",
  "created_at": "2026-02-03T14:40:00.000Z"
}
```

---

## ❌ Possíveis Erros

### **Erro 400 - user_id ausente**
```json
{
  "error": "user_id ausente na URL"
}
```
**Solução:** Verifique se adicionou `?user_id=UUID` na URL

---

### **Erro 401 - Usuário não localizado**
```json
{
  "error": "Usuário não localizado"
}
```
**Solução:** UUID está incorreto. Verifique no Supabase.

---

### **Erro 500 - Erro no banco**
```json
{
  "error": "Erro no banco de dados",
  "details": "..."
}
```
**Solução:** 
1. Verifique se `.env.local` tem as variáveis corretas
2. Verifique se tabelas `products` e `sales_events` existem

---

## 🔧 Verificar Dados no Supabase

Após enviar o webhook, verifique se foi salvo:

```sql
-- Ver produto criado
SELECT * FROM products 
WHERE platform = 'kiwify' 
ORDER BY created_at DESC 
LIMIT 1;

-- Ver venda registrada
SELECT * FROM sales_events 
WHERE platform_origin = 'kiwify' 
ORDER BY created_at DESC 
LIMIT 1;
```

---

## 📱 Testar Notificação Telegram (Opcional)

Se configurou Telegram:

1. Certifique-se que `telegram_token` e `telegram_chat_id` estão na tabela `user_configs`
2. Envie o webhook
3. Você receberá notificação no Telegram!

---

## 💡 Dicas

### **Salvar Request no Insomnia**
1. Após configurar, clique em `Ctrl+S`
2. Organize em pastas: `InsightHub AI > Webhooks > Kiwify`

### **Testar Múltiplas Vezes**
1. Use atalho `Ctrl+Enter` para reenviar rapidinho
2. Mude o `product_id` ou `email` para criar registros diferentes

### **Ver Response Time**
No Insomnia, veja o tempo de resposta no canto inferior direito.
- ✅ Ideal: < 2000ms
- ⚠️ Lento: > 5000ms

---

## ✅ Checklist Completo

- [ ] Servidor local rodando (`npm run dev`)
- [ ] Insomnia instalado
- [ ] Request criada com método POST
- [ ] URL com `user_id` correto
- [ ] Header `Content-Type: application/json`
- [ ] Body JSON colado
- [ ] Enviou request (Send)
- [ ] Recebeu 200 OK
- [ ] Logs aparecem no terminal
- [ ] Produto aparece no Supabase
- [ ] Venda aparece no Supabase

---

**Pronto! Agora você pode testar o webhook Kiwify localmente quantas vezes quiser!** 🚀

Se tiver erro, **copie a mensagem de erro e os logs do terminal** e me envie!
