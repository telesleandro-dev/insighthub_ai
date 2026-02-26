# 🤖 Arquitetura de Integração — InsightHub AI + n8n

**Data da Análise:** 19/02/2026  
**Versão do Sistema:** 0.3.2  

---

## 🎯 Visão Estratégica

O n8n opera como **infraestrutura interna invisível** do InsightHub. O usuário final (infovendedor) nunca precisará configurar, acessar ou entender o n8n — ele apenas cola a URL do webhook na plataforma de vendas.

```
[VISÃO DO USUÁRIO]
    Kiwify/Hotmart  →  InsightHub  (simples, 1 etapa)

[REALIDADE DA INFRAESTRUTURA]
    Kiwify/Hotmart  →  n8n (interno)  →  InsightHub
```

---

## 🏗️ Componentes do Sistema

### 1. Adaptadores de Plataformas (`src/lib/platforms/`)

O webhook unificado detecta automaticamente a plataforma de origem pelo formato do payload:

| Arquivo | Plataforma | Detecção |
|---|---|---|
| `kiwify.adapter.ts` | Kiwify | Campo `order_status` + `customer.email` |
| `hotmart.adapter.ts` | Hotmart | Campo `event` + `data.buyer.email` |
| `eduzz.adapter.ts` | Eduzz | Campo `key` + `customer_email` |
| `monetizze.adapter.ts` | Monetizze | Campo `statusName` + `Cliente.email` |
| `insighthub.adapter.ts` | **n8n / Genérico** | Campo `x-api-key` header presente |

Quando o n8n envia dados, o `insighthub.adapter` processa o payload normalizado — **sem precisar de adaptador por plataforma**.

---

### 2. Endpoints da API (Contratos para o n8n)

#### `POST /api/webhook/unified?user_id={USER_ID}`
**Função:** Porta de entrada de todos os eventos de venda.

**Autenticação:**
```http
x-api-key: {WEBHOOK_SECRET ou api_key do usuário}
```

**Payload do n8n → InsightHub:**
```json
{
  "order_id": "pedido-externo-123",
  "order_status": "abandoned",
  "customer": {
    "full_name": "João Silva",
    "email": "joao@email.com",
    "mobile": "5511999998888"
  },
  "Product": {
    "product_name": "Nome do Produto"
  },
  "order_amount": 49700
}
```

**Status suportados:**

| Status no Payload | Ação no InsightHub |
|---|---|
| `abandoned` | Cria/atualiza lead como `pending` |
| `waiting_payment` | Atualiza `last_interaction_at` (não muda status) |
| `refused` / `rejected` | Cria/atualiza lead como `pending` + tag `ERRO_TECNICO` |
| `paid` / `approved` / `complete` | Converte lead (`converted` ou `direct_sale`) |

---

#### `POST /api/leads/update-profile`
**Função:** O n8n envia o dossiê da IA e promove o lead para `processed` (visível no frontend).

**Autenticação:**
```http
x-api-key: {WEBHOOK_SECRET}
```

**Payload:**
```json
{
  "email": "joao@email.com",
  "user_id": "uuid-do-usuario-insighthub",
  "service_status": "processed",
  "lead_summary": "💡 DOSSIÊ: Lead reincidente, alta intenção de compra. Abandou 2x no mesmo produto..."
}
```

**Resposta:**
```json
{ "success": true, "message": "Perfil enriquecido com sucesso.", "status": "processed" }
```

> **⚠️ Idempotência:** Se o lead já estiver `processed` com o mesmo dossiê, a chamada é ignorada sem erro, prevenindo loops no n8n.

---

#### `POST /api/ai/recuperar`
**Função:** Gera a mensagem da Bruna IA para o vendedor enviar via WhatsApp. **Chamado pelo frontend**, não pelo n8n.

**Payload:**
```json
{
  "leadEmail": "joao@email.com",
  "discountLink": "https://oferta.com/desconto-especial"
}
```

> **Otimização:** Se a chamada vier de automação (User-Agent contendo `n8n` ou `axios`) e o lead já tiver dossiê, a IA reutiliza a análise existente sem chamar o Gemini novamente.

---

## 🔄 Fluxo Completo (Produção)

```
1. Cliente abandona carrinho na KIWIFY
         ↓
2. Kiwify dispara webhook para URL do n8n
   POST https://n8n.seudominio.com/webhook/kiwify
         ↓
3. n8n normaliza o payload e envia para InsightHub
   POST https://insighthub.ai/api/webhook/unified?user_id=c048be53
   Header: x-api-key: insight@...
   Body: { "order_status": "abandoned", "customer": {...} }
         ↓
4. InsightHub cria lead como [pending]
   - Score calculado automaticamente
   - Tags de comportamento definidas
         ↓
5. n8n aguarda Xmin (tempo de cooldown configurável no workflow)
         ↓
6. n8n chama Gemini ou IA própria para gerar dossiê
         ↓
7. n8n envia dossiê para InsightHub
   POST /api/leads/update-profile
   Body: { "email": ..., "service_status": "processed", "lead_summary": "..." }
         ↓
8. Lead aparece na tela de "Inteligência de Vendas" ✅
         ↓
9. Vendedor vê o lead, clica "Chamar no Zap" → status = contacted
         ↓
10. Lead compra → Webhook de pagamento → status = converted → KPI atualizado 💰
```

---

## 📊 Ciclo de Vida do Lead (ROI Sniper)

```
[pending]    → Invisível. Aguardando IA.
[processed]  → Visível em "Em Atendimento". Pronto para abordagem.
[contacted]  → Marcado para ROI. Se comprar → conta no gráfico.
[converted]  → Comprou depois de contacted. Conta no "Em Caixa". ✅
[direct_sale]→ Comprou sem ser contacted. NÃO conta no ROI (venda orgânica). Oculto.
```

> **Regra de ROI Puro:** Apenas leads que passaram por `contacted` antes da compra são contabilizados no faturamento recuperado.

---

## ✅ Status de Prontidão

| Componente | Status | Observação |
|---|---|---|
| Adaptadores de plataformas | ✅ Pronto | Kiwify, Hotmart, Eduzz, Monetizze, Genérico |
| Recepção de eventos via n8n | ✅ Pronto | `insighthub.adapter` + auth por API Key |
| Score automático de leads | ✅ Pronto | Calculado no webhook |
| Promoção de lead para `processed` | ✅ Pronto | `/api/leads/update-profile` |
| IA de abordagem (Bruna IA) | ✅ Pronto | Gemini + base de conhecimento + ai_tone |
| Notificação Telegram por venda | ✅ Pronto | Configurável por usuário |
| Multi-tenant (isolamento de dados) | ✅ Pronto | RLS no Supabase |
| **Workflow n8n criado** | ✅ Pronto | Workflow configurado e funcional |
| **n8n hospedado publicamente** | ⚠️ Pendente | Railway, Render ou VPS |

---

## 🔑 Variáveis de Ambiente Necessárias

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...

# IA
GEMINI_API_KEY=...

# Segurança do Webhook (Master Key para n8n)
WEBHOOK_SECRET=...

# Telegram (opcional — alertas por venda)
TELEGRAM_BOT_TOKEN=...
TELEGRAM_CHAT_ID=...
```

---

## 📋 Próximos Passos para n8n em Produção

1. **Hospedar o n8n** em servidor público (Railway, Render, ou VPS)
2. **Criar o workflow** no n8n:
   - Trigger: Webhook da plataforma (Kiwify, Hotmart, etc.)
   - Node de normalização: mapear campos para o formato InsightHub
   - Node HTTP Request: `POST /api/webhook/unified` com `x-api-key`
   - Wait Node: aguardar cooldown (ex: 5 minutos)
   - Node de IA: Gemini/OpenAI para gerar dossiê
   - Node HTTP Request: `POST /api/leads/update-profile`
3. **Configurar URL do n8n** nas plataformas de venda (no lugar da URL direta do InsightHub)
4. **Testar** end-to-end com lead real

---

**Última atualização:** 19/02/2026  
**Responsável:** Leandro Teles / InsightHub AI
