# 🧪 Testes Insomnia - Simulando Kiwify

## 📋 Configuração Inicial

### **URL do Webhook:**
```
POST http://localhost:3000/api/webhook/unified?user_id=c048be53-fff6-4446-a8b8-6abf79fce171
```

**Produção:**
```
POST https://insighthub-ai.vercel.app/api/webhook/unified?user_id=c048be53-fff6-4446-a8b8-6abf79fce171
```

### **Header:**
```
Content-Type: application/json
```

---

## 🎯 Cenários de Teste

### **1. Carrinho Abandonado** ✅ Deve Aparecer

**Recovery Status:** `eligible`  
**Aparece em "Recuperação":** ✅ SIM

```json
{
  "checkout_link": "abc123",
  "country": "br",
  "cpf": "12345678900",
  "created_at": "2026-02-03T16:30:00.000Z",
  "email": "cliente@example.com",
  "id": "abandoned_test_001",
  "name": "João da Silva",
  "offer_name": null,
  "phone": "(11) 99999-9999",
  "product_id": "39d44200-ce1d-11ef-8947-f71889bde439",
  "product_name": "Bíblia negra da sedução e poder",
  "status": "abandoned",
  "store_id": "STORE123",
  "subscription_plan": null
}
```

---

### **2. PIX Gerado (Aguardando)** 🔒 NÃO Deve Aparecer

**Recovery Status:** `pending`  
**Aparece em "Recuperação":** ❌ NÃO

```json
{
  "checkout_link": "xyz456",
  "country": "br",
  "cpf": "98765432100",
  "created_at": "2026-02-03T16:35:00.000Z",
  "email": "maria@example.com",
  "id": "pix_pending_001",
  "name": "Maria Santos",
  "offer_name": null,
  "phone": "(21) 98888-8888",
  "product_id": "39d44200-ce1d-11ef-8947-f71889bde439",
  "product_name": "Bíblia negra da sedução e poder",
  "status": "waiting_payment",
  "store_id": "STORE123",
  "subscription_plan": null
}
```

---

### **3. Cartão Recusado** ✅ Deve Aparecer

**Recovery Status:** `eligible`  
**Aparece em "Recuperação":** ✅ SIM

```json
{
  "checkout_link": "def789",
  "country": "br",
  "cpf": "11122233344",
  "created_at": "2026-02-03T16:40:00.000Z",
  "email": "carlos@example.com",
  "id": "refused_test_001",
  "name": "Carlos Oliveira",
  "offer_name": null,
  "phone": "(31) 97777-7777",
  "product_id": "39d44200-ce1d-11ef-8947-f71889bde439",
  "product_name": "Bíblia negra da sedução e poder",
  "status": "refused",
  "store_id": "STORE123",
  "subscription_plan": null
}
```

---

### **4. PIX Expirado** ✅ Deve Aparecer

**Recovery Status:** `eligible`  
**Aparece em "Recuperação":** ✅ SIM

```json
{
  "checkout_link": "ghi012",
  "country": "br",
  "cpf": "55566677788",
  "created_at": "2026-02-03T16:45:00.000Z",
  "email": "ana@example.com",
  "id": "expired_test_001",
  "name": "Ana Costa",
  "offer_name": null,
  "phone": "(41) 96666-6666",
  "product_id": "39d44200-ce1d-11ef-8947-f71889bde439",
  "product_name": "Bíblia negra da sedução e poder",
  "status": "expired",
  "store_id": "STORE123",
  "subscription_plan": null
}
```

---

### **5. Pagamento Aprovado** 🧹 Auto-Limpa Anteriores

**Recovery Status:** `converted`  
**Aparece em "Recuperação":** ❌ NÃO  
**Efeito:** Remove eventos anteriores do mesmo cliente/produto

```json
{
  "checkout_link": "jkl345",
  "country": "br",
  "cpf": "12345678900",
  "created_at": "2026-02-03T16:50:00.000Z",
  "email": "joao@example.com",
  "id": "paid_test_001",
  "name": "João da Silva",
  "offer_name": null,
  "phone": "(11) 99999-9999",
  "product_id": "39d44200-ce1d-11ef-8947-f71889bde439",
  "product_name": "Bíblia negra da sedução e poder",
  "status": "paid",
  "store_id": "STORE123",
  "subscription_plan": null,
  "order_amount": 6990
}
```

---

## 🧪 Sequência de Teste Completa

### **Cenário: Lead Abandona → Gera PIX → Paga**

1. **Enviar #1:** Carrinho Abandonado
   - ✅ Aparece em "Recuperação de Leads"
   - 💰 KPI "Ação Necessária" +R$ 69,90

2. **Enviar #2:** PIX Gerado (mesmo cliente)
   - ❌ NÃO sobrescreve
   - ✅ Carrinho abandonado continua na lista
   - ⚠️ PIX pendente NÃO aparece

3. **Enviar #3:** Pagamento Aprovado (mesmo cliente)
   - 🧹 Auto-limpa eventos anteriores
   - ❌ Some da lista de recuperação
   - 💰 KPI "Ação Necessária" -R$ 69,90

---

## 📊 Verificar Resultados

### **1. Dashboard - KPI "Ação Necessária"**
Só deve contar leads com `recovery_status = 'eligible'`

### **2. Tela "Recuperação de Leads"**
Só deve listar leads com `recovery_status = 'eligible'`

### **3. Logs da Vercel/Local**
```
[Webhook] Recovery Status: abandoned → eligible ✅
[Webhook] Recovery Status: waiting_payment → pending 🔒
[Webhook] Recovery Status: refused → eligible ✅
[Webhook] Recovery Status: expired → eligible ✅
[Webhook] Recovery Status: paid → converted 🧹
🧹 [Auto-Limpeza] Convertidos X eventos anteriores
```

---

## 🛠️ Dicas Insomnia

### **Salvar Requests**
1. Crie uma **Collection** "InsightHub - Webhooks"
2. Salve cada cenário como request separada
3. Use variáveis de ambiente para URL

### **Testar Rapidamente**
- Atalho: `Ctrl+Enter` para reenviar
- Mude apenas o `email` ou `id` para criar novos leads
- Teste sequência: Abandoned → Waiting → Paid

---

## ✅ Checklist de Validação

- [ ] Carrinho abandonado aparece em "Recuperação"
- [ ] PIX gerado NÃO aparece em "Recuperação"
- [ ] Cartão recusado aparece em "Recuperação"
- [ ] PIX expirado aparece em "Recuperação"
- [ ] Pagamento aprovado remove leads anteriores
- [ ] KPI conta apenas leads `eligible`
- [ ] Logs mostram `recovery_status` correto
