# Especificações Técnicas - InsightHub AI

Este documento detalha a infraestrutura de dados e os contratos de comunicação do projeto.

---

## 🏗️ Schema do Banco de Dados (SQL)

O projeto utiliza **Supabase (PostgreSQL)** com as seguintes tabelas principais:

### 1. `leads_profiles`
Armazena o perfil consolidado de cada lead (pessoa física/jurídica).
- `id` (uuid, PK): Identificador único.
- `user_id` (uuid, FK): Referência ao dono do lead (Auth).
- `email` (text): Email do lead.
- `name` (text): Nome completo.
- `phone` (text): WhatsApp/Telefone.
- `lead_score` (int): Pontuação de intenção (0 a 100).
- `behavior_tags` (text[]): Tags de comportamento (ex: `ALTA_INTENCAO`, `REINCIDENTE`).
- `product_history` (text[]): Lista de produtos que o lead já demonstrou interesse.
- `service_status` (text): Status no pipeline (`pending`, `processed`, `contacted`, `converted`).
- `lead_summary` (text): Dossiê/Análise gerada pela IA (Bruna IA).
- `potential_value` (numeric): Valor total em aberto/carrinho.
- `converted_value` (numeric): Valor real recuperado/pago.
- `last_platform` (text): Última plataforma que enviou o evento.
- `created_at`, `updated_at`, `last_interaction_at` (timestamptz).

### 2. `sales_events`
Log de todas as transações e eventos de checkout.
- `id` (uuid, PK).
- `user_id` (uuid, FK): Dono do evento.
- `lead_profile_id` (uuid, FK): Link com o perfil consolidado.
- `product_name` (text): Nome do produto vendido/abandonado.
- `status` (text): Status cru da plataforma (ex: `paid`, `waiting_payment`).
- `value` (numeric): Valor da transação.
- `platform_origin` (text): Plataforma (Kiwify, Hotmart, etc).
- `external_transaction_id` (text): ID da transação no checkout.
- `recovery_status` (text): Status de recuperação (`eligible`, `pending`, `converted`, `cleared`).
- `custom_discount_link` (text): Link de oferta gerado manualmente.

### 3. `user_configs`
Configurações de integração por usuário.
- `user_id` (uuid, PK/FK).
- `api_key` (text): Chave para integrações externas (ih_...).
- `webhook_secret` (text): Segredo para validação de webhooks.
- `telegram_token` / `telegram_chat_id` (text): Credenciais do Bot de alertas.
- `ai_tone` (text): Tom de voz da Bruna IA (`consultivo`, `persuasivo`, `cordial`).

### 4. `knowledge_files`
Base de conhecimento para a IA.
- `user_id` (uuid, FK).
- `file_name`, `file_path`, `file_size` (text).
- `extracted_text` (text): Texto puro extraído via OCR/PDF Parse.
- `processing_status` (text): `completed`, `processing`, `error`.

---

## 🔌 Contratos de API (JSON)

### 1. Webhook Unificado
**Endpoint:** `POST /api/webhook/unified?user_id=[USER_ID]`  
**Header:** `x-api-key: [SUMA_CHAVE_OU_MASTER_SECRET]`

**Payload (Exemplo Kiwify):**
```json
{
  "order_status": "waiting_payment",
  "customer": {
    "full_name": "João Silva",
    "email": "joao@exemplo.com",
    "mobile": "5511999998888"
  },
  "product": { "product_name": "Curso Sniper IA" },
  "price_str": "497.00"
}
```

### 2. Recuperação IA (Bruna IA)
**Endpoint:** `POST /api/ai/recuperar`

**Request:**
```json
{
  "leadId": "UUID",
  "leadEmail": "lead@email.com",
  "productName": "Produto X",
  "discountLink": "https://oferta.com/desconto"
}
```

**Response (Sucesso):**
```json
{
  "message": "Mensagem gerada com sucesso",
  "dossie": "🤖 DOSSIÊ SNIPER: Lead com alta intenção...",
  "suggestedMessage": "Olá João, vi que você teve um problema no pagamento..."
}
```

### 3. Enriquecimento de Perfil (Update Profile)
**Endpoint:** `POST /api/leads/update-profile`  
**Header:** `x-api-key: [MASTER_WEBHOOK_SECRET]`

**Request:**
```json
{
  "user_id": "UUID",
  "email": "lead@email.com",
  "service_status": "processed",
  "lead_summary": "Análise externa da IA...",
  "lead_notes": "Observações adicionais"
}
```

### 4. Gerenciamento de Chave (API Key)
**Endpoint:** `POST /api/settings/api-key?user_id=[USER_ID]&action=generate`

**Response:**
```json
{
  "success": true,
  "api_key": "ih_64c8f...b2a",
  "message": "API Key gerada com sucesso"
}
```

---
> [!NOTE]
> Todos os campos de data seguem o padrão ISO 8601 UTC.
