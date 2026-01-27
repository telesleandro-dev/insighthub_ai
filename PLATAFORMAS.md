# 🔌 Documentação das Plataformas Suportadas

**Versão**: 2.0.0  
**Última atualização**: 2026-01-27

---

## 📋 Índice

- [Kiwify](#-kiwify)
- [Hotmart](#-hotmart)
- [Eduzz](#-eduzz)
- [Monetizze](#-monetizze)
- [Como Adicionar Nova Plataforma](#-como-adicionar-nova-plataforma)

---

## 🥝 Kiwify

### Informações Gerais

- **Nome**: Kiwify
- **Site**: https://kiwify.com.br
- **Documentação**: https://developers.kiwify.com.br/webhooks
- **Status**: ✅ Totalmente suportado

### Configuração

1. Acesse sua conta Kiwify
2. Vá em **Configurações** > **Webhooks**
3. Adicione a URL:
   ```
   https://seu-dominio.com/api/webhook/unified?user_id=SEU_UUID
   ```
4. Selecione os eventos:
   - ✅ `order.paid`
   - ✅ `order.waiting_payment`
   - ✅ `order.refused`
   - ✅ `order.refunded`

### Estrutura do Payload

```json
{
  "product_name": "Nome do Produto",
  "product_id": "123",
  "order_amount": 9900,
  "order_id": "KW-ABC123",
  "status": "paid",
  "Customer": {
    "full_name": "João Silva",
    "email": "joao@exemplo.com",
    "mobile": "11999999999"
  }
}
```

### Mapeamento de Status

| Status Kiwify | Status Normalizado |
|---------------|-------------------|
| `paid` | `paid` |
| `approved` | `paid` |
| `waiting_payment` | `waiting_payment` |
| `pending` | `waiting_payment` |
| `refused` | `refused` |
| `cancelled` | `refused` |
| `refunded` | `refunded` |
| `chargeback` | `chargeback` |

### Observações

- ⚠️ Valores são enviados em **centavos** (9900 = R$ 99,00)
- ⚠️ Não possui validação de assinatura HMAC
- ✅ Suporta assinaturas/recorrência

---

## 🔥 Hotmart

### Informações Gerais

- **Nome**: Hotmart
- **Site**: https://hotmart.com
- **Documentação**: https://developers.hotmart.com/docs/pt-BR/v1/webhooks/
- **Status**: ✅ Totalmente suportado

### Configuração

1. Acesse sua conta Hotmart
2. Vá em **Ferramentas** > **Webhooks**
3. Adicione a URL:
   ```
   https://seu-dominio.com/api/webhook/unified?user_id=SEU_UUID
   ```
4. Selecione os eventos:
   - ✅ `PURCHASE_COMPLETE`
   - ✅ `PURCHASE_APPROVED`
   - ✅ `PURCHASE_CANCELED`
   - ✅ `PURCHASE_REFUNDED`
   - ✅ `PURCHASE_CHARGEBACK`

### Estrutura do Payload

```json
{
  "hottok": "abc123...",
  "event": "PURCHASE_COMPLETE",
  "data": {
    "buyer": {
      "name": "João Silva",
      "email": "joao@exemplo.com",
      "phone": "5511999999999"
    },
    "product": {
      "id": 123456,
      "name": "Nome do Produto"
    },
    "purchase": {
      "transaction": "HP-ABC123",
      "status": "approved",
      "price": {
        "value": 99.90
      }
    }
  }
}
```

### Mapeamento de Status

| Status Hotmart | Status Normalizado |
|----------------|-------------------|
| `approved` | `paid` |
| `complete` | `paid` |
| `waiting_payment` | `waiting_payment` |
| `under_analysis` | `waiting_payment` |
| `refunded` | `refunded` |
| `cancelled` | `refused` |
| `blocked` | `refused` |
| `chargeback` | `chargeback` |

### Observações

- ✅ Valores já em **reais** (99.90 = R$ 99,90)
- ✅ Possui validação via **hottok**
- ✅ Suporta múltiplos eventos
- ⚠️ Estrutura de dados pode variar por evento

---

## ⚡ Eduzz

### Informações Gerais

- **Nome**: Eduzz
- **Site**: https://eduzz.com
- **Documentação**: https://atendimento.eduzz.com/portal/pt-br/kb/articles/webhooks
- **Status**: ✅ Totalmente suportado

### Configuração

1. Acesse sua conta Eduzz
2. Vá em **Configurações** > **Webhooks**
3. Adicione a URL:
   ```
   https://seu-dominio.com/api/webhook/unified?user_id=SEU_UUID
   ```
4. Selecione os eventos desejados

### Estrutura do Payload

```json
{
  "sale_id": "123456",
  "contract_id": "789",
  "invoice_id": "INV-123",
  "client_name": "João Silva",
  "client_email": "joao@exemplo.com",
  "client_cel": "11999999999",
  "product_name": "Nome do Produto",
  "product_id": "456",
  "sale_value": "99.90",
  "sale_status_name": "Finalizada"
}
```

### Mapeamento de Status

| Status Eduzz | Status Normalizado |
|--------------|-------------------|
| `Finalizada` | `paid` |
| `Paga` | `paid` |
| `Aguardando pagamento` | `waiting_payment` |
| `Pendente` | `waiting_payment` |
| `Cancelada` | `refused` |
| `Reembolsada` | `refunded` |
| `Chargeback` | `chargeback` |

### Observações

- ✅ Valores em **reais como string** ("99.90")
- ⚠️ Não possui validação de assinatura
- ✅ Envia dados de produtor e afiliado

---

## 💰 Monetizze

### Informações Gerais

- **Nome**: Monetizze
- **Site**: https://monetizze.com.br
- **Documentação**: https://docs.monetizze.com.br/webhooks
- **Status**: ✅ Totalmente suportado

### Configuração

1. Acesse sua conta Monetizze
2. Vá em **Configurações** > **Postback**
3. Adicione a URL:
   ```
   https://seu-dominio.com/api/webhook/unified?user_id=SEU_UUID
   ```
4. Configure os eventos desejados

### Estrutura do Payload

```json
{
  "venda": {
    "codigo": "MON-123456",
    "valor": "99.90",
    "status": "2",
    "tipo_pagamento": "Cartão de Crédito"
  },
  "comprador": {
    "nome": "João Silva",
    "email": "joao@exemplo.com",
    "telefone": "11999999999"
  },
  "produto": {
    "codigo": "789",
    "nome": "Nome do Produto"
  }
}
```

### Mapeamento de Status

| Status Monetizze | Status Normalizado |
|------------------|-------------------|
| `2` ou `Paga` | `paid` |
| `Finalizada` | `paid` |
| `1` ou `Aguardando` | `waiting_payment` |
| `Pendente` | `waiting_payment` |
| `3` ou `Cancelada` | `refused` |
| `4` ou `Reembolsada` | `refunded` |
| `5` ou `Chargeback` | `chargeback` |

### Observações

- ✅ Valores em **reais como string** ("99.90")
- ⚠️ Status pode ser **número ou texto**
- ⚠️ Não possui validação de assinatura robusta
- ✅ Envia dados de comissão e afiliado

---

## ➕ Como Adicionar Nova Plataforma

### Passo 1: Criar o Adapter

Crie um arquivo `src/lib/platforms/suaplataforma.adapter.ts`:

```typescript
import { PlatformAdapter, NormalizedSaleData, MissingDataError, SaleStatus } from './index';

export class SuaPlataformaAdapter implements PlatformAdapter {
  readonly name = 'suaplataforma';
  readonly displayName = 'Sua Plataforma';

  detectPayload(payload: any): boolean {
    // Lógica para detectar se o payload é desta plataforma
    return !!(payload.campo_unico_da_plataforma);
  }

  normalizeData(payload: any): NormalizedSaleData {
    // Validar campos obrigatórios
    if (!payload.email) {
      throw new MissingDataError('email', this.name);
    }

    // Normalizar dados
    return {
      customerName: payload.nome || 'Cliente Sem Nome',
      customerEmail: payload.email,
      customerPhone: payload.telefone || '',
      productName: payload.produto || 'Produto Desconhecido',
      productId: String(payload.produto_id || '000'),
      amount: parseFloat(payload.valor) || 0,
      status: this.normalizeStatus(payload.status),
      transactionId: payload.transacao_id || '',
      metadata: {
        // Dados específicos da plataforma
      }
    };
  }

  private normalizeStatus(status: string): SaleStatus {
    const statusMap: Record<string, SaleStatus> = {
      'pago': 'paid',
      'pendente': 'waiting_payment',
      'cancelado': 'refused',
      'reembolsado': 'refunded'
    };
    return statusMap[status.toLowerCase()] || 'waiting_payment';
  }

  getSignatureHeaders(): string[] {
    return ['x-suaplataforma-signature'];
  }

  validateSignature(payload: any, signature: string, secret: string): boolean {
    // Implementar validação se a plataforma suportar
    return true;
  }
}
```

### Passo 2: Registrar no Registry

Edite `src/lib/platforms/registry.ts`:

```typescript
import { SuaPlataformaAdapter } from './suaplataforma.adapter';

constructor() {
  this.register(new KiwifyAdapter());
  this.register(new HotmartAdapter());
  this.register(new EduzzAdapter());
  this.register(new MonetizzeAdapter());
  this.register(new SuaPlataformaAdapter()); // ✅ Adicione aqui
}
```

### Passo 3: Adicionar ao Banco

```sql
INSERT INTO supported_platforms (name, display_name, documentation_url) 
VALUES ('suaplataforma', 'Sua Plataforma', 'https://docs.suaplataforma.com');
```

### Passo 4: Testar

```bash
curl -X POST "https://seu-dominio.com/api/webhook/unified?user_id=SEU_UUID" \
  -H "Content-Type: application/json" \
  -d '{ "campo_unico_da_plataforma": "valor" }'
```

---

## 📊 Comparação de Plataformas

| Recurso | Kiwify | Hotmart | Eduzz | Monetizze |
|---------|--------|---------|-------|-----------|
| Validação de Assinatura | ❌ | ✅ | ❌ | ❌ |
| Valores em Centavos | ✅ | ❌ | ❌ | ❌ |
| Suporte a Recorrência | ✅ | ✅ | ✅ | ✅ |
| Dados de Afiliado | ✅ | ✅ | ✅ | ✅ |
| Webhooks em Tempo Real | ✅ | ✅ | ⚠️ | ⚠️ |
| Documentação Completa | ✅ | ✅ | ⚠️ | ⚠️ |

**Legenda**:
- ✅ Suportado/Bom
- ⚠️ Parcial/Limitado
- ❌ Não suportado

---

## 🔍 Debugging

### Ver Payload Recebido

```sql
SELECT 
  platform,
  payload,
  created_at
FROM webhooks_log
WHERE status = 'received'
ORDER BY created_at DESC
LIMIT 10;
```

### Ver Erros de Normalização

```sql
SELECT 
  platform,
  error_message,
  payload,
  created_at
FROM webhooks_log
WHERE status = 'error'
ORDER BY created_at DESC;
```

---

**Desenvolvido com ❤️ para o InsightHub AI**
