# 🔍 Análise de Preparação Multi-Plataforma - InsightHub AI

**Data da Análise**: 2026-01-27  
**Analista**: Antigravity AI  
**Solicitante**: Leandro Teles

---

## 📊 Resumo Executivo

### ✅ Pontos Fortes (O que já está pronto)

O código **JÁ ESTÁ PARCIALMENTE PREPARADO** para integração com múltiplas plataformas de pagamento. Você tem uma base sólida com:

1. ✅ **Campo `platform_origin`** no banco de dados
2. ✅ **Webhook genérico** com lógica de detecção de plataforma (`/api/webhook/route.ts`)
3. ✅ **Filtros por plataforma** no Dashboard e Recuperação
4. ✅ **Normalização de dados** já implementada
5. ✅ **Suporte a Hotmart** parcialmente implementado

### ⚠️ Pontos de Atenção (O que precisa melhorar)

1. ❌ **Código duplicado** entre webhooks
2. ❌ **Hardcoded platform strings** espalhados pelo código
3. ❌ **Falta de abstração** para normalização de dados
4. ❌ **Inconsistência** entre webhook Kiwify e webhook genérico
5. ❌ **Falta de validação** de assinaturas de webhook
6. ❌ **Sem tratamento** para campos específicos de cada plataforma

---

## 🏗️ Análise Detalhada por Componente

### 1. **Banco de Dados** ✅ (80% Pronto)

#### O que está bom:
```sql
-- Tabela products
platform TEXT DEFAULT 'kiwify'  -- ✅ Suporta múltiplas plataformas

-- Tabela sales_events
platform_origin TEXT  -- ✅ Identifica origem da venda
```

#### O que precisa:
```sql
-- ❌ Falta constraint para validar plataformas permitidas
-- ❌ Falta tabela de configuração de plataformas
-- ❌ Falta campo para armazenar ID externo da transação
```

**Recomendação**:
```sql
-- Adicionar à tabela sales_events
ALTER TABLE sales_events 
ADD COLUMN external_transaction_id TEXT,
ADD COLUMN platform_metadata JSONB;

-- Criar tabela de plataformas suportadas
CREATE TABLE supported_platforms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  webhook_signature_key TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Criar tabela de configuração por usuário/plataforma
CREATE TABLE user_platform_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  platform_name TEXT NOT NULL,
  api_key TEXT,
  webhook_secret TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, platform_name)
);
```

---

### 2. **Webhooks** ⚠️ (50% Pronto)

#### Análise do Webhook Kiwify (`/api/webhook/kiwify/route.ts`)

**Pontos Fortes**:
- ✅ Validação de `user_id`
- ✅ Logs de auditoria
- ✅ Normalização de dados
- ✅ Notificação Telegram
- ✅ Tratamento de erros

**Pontos Fracos**:
- ❌ **Hardcoded** para Kiwify apenas
- ❌ Lógica de negócio misturada com lógica de webhook
- ❌ Sem validação de assinatura do webhook
- ❌ Código duplicado com webhook genérico

#### Análise do Webhook Genérico (`/api/webhook/route.ts`)

**Pontos Fortes**:
- ✅ Detecção automática de plataforma (Kiwify e Hotmart)
- ✅ Validação de segurança com `x-hub-token`
- ✅ Normalização por plataforma

**Pontos Fracos**:
- ❌ Lógica de detecção frágil (baseada em campos específicos)
- ❌ Não usa `user_id` como o webhook Kiwify
- ❌ Sem upsert de produtos
- ❌ Usa cliente Supabase diferente (anon key vs service role)

**Inconsistências Críticas**:
```typescript
// ❌ PROBLEMA: Dois webhooks fazem coisas diferentes!

// Webhook Kiwify:
- Usa user_id da URL
- Faz upsert de produtos
- Usa service_role_key
- Mais robusto

// Webhook Genérico:
- Usa token de segurança no header
- NÃO faz upsert de produtos
- Usa anon_key
- Menos seguro
```

---

### 3. **Normalização de Dados** ⚠️ (40% Pronto)

#### Código Atual (Webhook Genérico):

```typescript
// ❌ PROBLEMA: Lógica espalhada e não reutilizável
if (payload.product_name) { // Kiwify
  platform = 'kiwify';
  customerData = {
    name: payload.Customer?.full_name || 'Cliente',
    email: payload.Customer?.email,
    // ...
  };
} else if (payload.hottok) { // Hotmart
  platform = 'hotmart';
  customerData = {
    name: payload.name || 'Cliente',
    email: payload.email,
    // ...
  };
}
```

**Problemas**:
1. ❌ Não é escalável (precisa adicionar if/else para cada plataforma)
2. ❌ Lógica de detecção frágil
3. ❌ Sem tipagem TypeScript
4. ❌ Sem validação de campos obrigatórios

---

### 4. **Frontend** ✅ (90% Pronto)

#### Dashboard e Recuperação:

**Pontos Fortes**:
- ✅ Filtros por plataforma já implementados
- ✅ Detecção automática de plataformas disponíveis
- ✅ UI preparada para múltiplas origens
- ✅ Badge visual de plataforma

```typescript
// ✅ BOM: Código genérico e reutilizável
const plataformasDisponiveis = Array.from(
  new Set(leads.map(l => l.platform_origin).filter(Boolean))
);
```

**Pontos de Melhoria**:
- ⚠️ Poderia ter ícones específicos por plataforma
- ⚠️ Poderia ter cores diferentes por plataforma

---

### 5. **Configurações** ✅ (70% Pronto)

**Pontos Fortes**:
- ✅ UI para adicionar múltiplas API keys
- ✅ Sistema de nome + valor para plataformas
- ✅ Salvamento no banco

**Pontos Fracos**:
- ❌ Não valida se a plataforma é suportada
- ❌ Não testa a conexão com a API
- ❌ Não mostra status de cada integração

---

## 🎯 Plano de Ação para Multi-Plataforma

### Fase 1: Refatoração (Crítico) 🔴

#### 1.1 Criar Camada de Abstração

**Arquivo**: `src/lib/platforms/index.ts`

```typescript
// Interface comum para todas as plataformas
export interface PlatformAdapter {
  name: string;
  detectPayload(payload: any): boolean;
  normalizeData(payload: any): NormalizedSaleData;
  validateSignature?(payload: any, signature: string, secret: string): boolean;
}

export interface NormalizedSaleData {
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  productName: string;
  productId: string;
  amount: number;
  status: 'paid' | 'waiting_payment' | 'refused' | 'refunded';
  transactionId: string;
  metadata?: Record<string, any>;
}
```

#### 1.2 Implementar Adapters por Plataforma

**Arquivo**: `src/lib/platforms/kiwify.adapter.ts`

```typescript
import { PlatformAdapter, NormalizedSaleData } from './index';

export class KiwifyAdapter implements PlatformAdapter {
  name = 'kiwify';

  detectPayload(payload: any): boolean {
    return !!(payload.product_name && payload.Customer);
  }

  normalizeData(payload: any): NormalizedSaleData {
    const customer = payload.Customer || {};
    
    return {
      customerName: customer.full_name || 'Cliente Sem Nome',
      customerEmail: customer.email,
      customerPhone: customer.mobile || '',
      productName: payload.product_name || 'Produto Desconhecido',
      productId: String(payload.product_id || '000'),
      amount: (payload.order_amount / 100) || 0,
      status: this.normalizeStatus(payload.status),
      transactionId: payload.order_id || payload.transaction_id || '',
      metadata: {
        commission_as: payload.commission_as,
        order_ref: payload.order_ref
      }
    };
  }

  private normalizeStatus(status: string): NormalizedSaleData['status'] {
    const statusMap: Record<string, NormalizedSaleData['status']> = {
      'paid': 'paid',
      'approved': 'paid',
      'waiting_payment': 'waiting_payment',
      'refused': 'refused',
      'refunded': 'refunded'
    };
    return statusMap[status] || 'waiting_payment';
  }

  validateSignature(payload: any, signature: string, secret: string): boolean {
    // Implementar validação específica da Kiwify
    return true; // Placeholder
  }
}
```

**Arquivo**: `src/lib/platforms/hotmart.adapter.ts`

```typescript
import { PlatformAdapter, NormalizedSaleData } from './index';

export class HotmartAdapter implements PlatformAdapter {
  name = 'hotmart';

  detectPayload(payload: any): boolean {
    return !!(payload.hottok || payload.event === 'PURCHASE_COMPLETE');
  }

  normalizeData(payload: any): NormalizedSaleData {
    const data = payload.data || payload;
    const buyer = data.buyer || {};
    const product = data.product || {};
    const purchase = data.purchase || {};

    return {
      customerName: buyer.name || 'Cliente Sem Nome',
      customerEmail: buyer.email,
      customerPhone: buyer.phone || '',
      productName: product.name || 'Produto Desconhecido',
      productId: String(product.id || '000'),
      amount: purchase.price?.value || 0,
      status: this.normalizeStatus(purchase.status),
      transactionId: purchase.transaction || '',
      metadata: {
        hottok: payload.hottok,
        commission_as: purchase.commission_as
      }
    };
  }

  private normalizeStatus(status: string): NormalizedSaleData['status'] {
    const statusMap: Record<string, NormalizedSaleData['status']> = {
      'approved': 'paid',
      'complete': 'paid',
      'waiting_payment': 'waiting_payment',
      'refunded': 'refunded',
      'cancelled': 'refused'
    };
    return statusMap[status] || 'waiting_payment';
  }

  validateSignature(payload: any, signature: string, secret: string): boolean {
    // Implementar validação HMAC da Hotmart
    return true; // Placeholder
  }
}
```

#### 1.3 Criar Registry de Plataformas

**Arquivo**: `src/lib/platforms/registry.ts`

```typescript
import { PlatformAdapter } from './index';
import { KiwifyAdapter } from './kiwify.adapter';
import { HotmartAdapter } from './hotmart.adapter';
import { EduzzAdapter } from './eduzz.adapter';
import { MonetizzeAdapter } from './monetizze.adapter';

class PlatformRegistry {
  private adapters: Map<string, PlatformAdapter> = new Map();

  constructor() {
    this.register(new KiwifyAdapter());
    this.register(new HotmartAdapter());
    // this.register(new EduzzAdapter());
    // this.register(new MonetizzeAdapter());
  }

  register(adapter: PlatformAdapter) {
    this.adapters.set(adapter.name, adapter);
  }

  detect(payload: any): PlatformAdapter | null {
    for (const adapter of this.adapters.values()) {
      if (adapter.detectPayload(payload)) {
        return adapter;
      }
    }
    return null;
  }

  get(name: string): PlatformAdapter | undefined {
    return this.adapters.get(name);
  }

  getAll(): PlatformAdapter[] {
    return Array.from(this.adapters.values());
  }
}

export const platformRegistry = new PlatformRegistry();
```

#### 1.4 Refatorar Webhook Unificado

**Arquivo**: `src/app/api/webhook/unified/route.ts`

```typescript
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import TelegramBot from 'node-telegram-bot-api';
import { platformRegistry } from '@/lib/platforms/registry';

export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl || '', supabaseKey || '');

export async function POST(req: Request) {
  let body: any;

  try {
    body = await req.json();

    // 1. IDENTIFICAÇÃO DO USUÁRIO
    const { searchParams } = new URL(req.url);
    const userIdFromUrl = searchParams.get('user_id');

    if (!userIdFromUrl) {
      return NextResponse.json({ error: 'user_id ausente na URL' }, { status: 400 });
    }

    // 2. DETECÇÃO AUTOMÁTICA DA PLATAFORMA
    const adapter = platformRegistry.detect(body);
    
    if (!adapter) {
      await supabase.from('webhooks_log').insert({
        platform: 'unknown',
        payload: body,
        status: 'error',
        error_message: 'Plataforma não reconhecida',
        user_id: userIdFromUrl
      });
      return NextResponse.json({ error: 'Plataforma não suportada' }, { status: 400 });
    }

    // 3. LOG DE AUDITORIA
    await supabase.from('webhooks_log').insert({
      platform: adapter.name,
      payload: body,
      status: 'received',
      user_id: userIdFromUrl
    });

    // 4. BUSCAR CONFIGURAÇÃO DO USUÁRIO
    const { data: userConfig, error: configError } = await supabase
      .from('user_configs')
      .select('user_id, telegram_token, telegram_chat_id')
      .eq('user_id', userIdFromUrl.trim())
      .maybeSingle();

    if (configError || !userConfig) {
      return NextResponse.json({ error: 'Usuário não localizado' }, { status: 401 });
    }

    // 5. NORMALIZAR DADOS
    const normalizedData = adapter.normalizeData(body);

    // 6. VALIDAR DADOS OBRIGATÓRIOS
    if (!normalizedData.customerEmail) {
      throw new Error('E-mail do cliente ausente');
    }

    // 7. UPSERT DO PRODUTO
    const { data: productRecord, error: prodError } = await supabase
      .from('products')
      .upsert({ 
        external_id: normalizedData.productId,
        name: normalizedData.productName, 
        user_id: userConfig.user_id,
        platform: adapter.name
      }, { onConflict: 'external_id, user_id' })
      .select()
      .single();

    if (prodError) throw prodError;

    // 8. REGISTRAR VENDA
    const { error: dbError } = await supabase.from('sales_events').insert({
      user_id: userConfig.user_id,
      product_id: productRecord.id,
      customer_name: normalizedData.customerName,
      customer_email: normalizedData.customerEmail,
      customer_phone: normalizedData.customerPhone,
      status: normalizedData.status,
      value: normalizedData.amount,
      platform_origin: adapter.name,
      external_transaction_id: normalizedData.transactionId,
      platform_metadata: normalizedData.metadata
    });

    if (dbError) throw dbError;

    // 9. NOTIFICAÇÃO TELEGRAM
    if (userConfig.telegram_token && userConfig.telegram_chat_id) {
      const userBot = new TelegramBot(userConfig.telegram_token);
      const isAbandonment = !['paid'].includes(normalizedData.status);
      
      const msg = `🚀 *InsightHub AI*\\n\\n${
        isAbandonment ? '⚠️ *CARRINHO ABANDONADO*' : '✅ *VENDA APROVADA*'
      }\\n👤 *Cliente:* ${normalizedData.customerName}\\n💰 *Valor:* R$ ${normalizedData.amount.toFixed(2)}\\n📦 *Produto:* ${normalizedData.productName}\\n🏷️ *Plataforma:* ${adapter.name.toUpperCase()}`;

      await userBot.sendMessage(userConfig.telegram_chat_id, msg, {
        parse_mode: 'Markdown',
        reply_markup: isAbandonment && normalizedData.customerPhone ? {
          inline_keyboard: [[{ 
            text: '📱 Recuperar no WhatsApp', 
            url: `https://wa.me/55${normalizedData.customerPhone.replace(/\\D/g, '')}` 
          }]]
        } : undefined
      });
    }

    return NextResponse.json({ 
      success: true, 
      platform: adapter.name,
      transactionId: normalizedData.transactionId 
    }, { status: 200 });

  } catch (error: any) {
    await supabase.from('webhooks_log').insert({
      platform: 'error',
      payload: body || {},
      status: 'error',
      error_message: error.message
    });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
```

---

### Fase 2: Adicionar Novas Plataformas (Fácil) 🟢

Com a arquitetura refatorada, adicionar uma nova plataforma é simples:

#### Exemplo: Eduzz

**Arquivo**: `src/lib/platforms/eduzz.adapter.ts`

```typescript
import { PlatformAdapter, NormalizedSaleData } from './index';

export class EduzzAdapter implements PlatformAdapter {
  name = 'eduzz';

  detectPayload(payload: any): boolean {
    return !!(payload.eduzz_api_key || payload.sale_id);
  }

  normalizeData(payload: any): NormalizedSaleData {
    return {
      customerName: payload.client_name || 'Cliente Sem Nome',
      customerEmail: payload.client_email,
      customerPhone: payload.client_cel || '',
      productName: payload.product_name || 'Produto Desconhecido',
      productId: String(payload.product_id || '000'),
      amount: parseFloat(payload.sale_value) || 0,
      status: this.normalizeStatus(payload.sale_status_name),
      transactionId: payload.sale_id || '',
      metadata: {
        contract_id: payload.contract_id,
        invoice_id: payload.invoice_id
      }
    };
  }

  private normalizeStatus(status: string): NormalizedSaleData['status'] {
    const statusMap: Record<string, NormalizedSaleData['status']> = {
      'Finalizada': 'paid',
      'Aguardando pagamento': 'waiting_payment',
      'Cancelada': 'refused',
      'Reembolsada': 'refunded'
    };
    return statusMap[status] || 'waiting_payment';
  }
}
```

Depois, apenas registre no `registry.ts`:

```typescript
import { EduzzAdapter } from './eduzz.adapter';

constructor() {
  this.register(new KiwifyAdapter());
  this.register(new HotmartAdapter());
  this.register(new EduzzAdapter()); // ✅ Pronto!
}
```

---

### Fase 3: Melhorias de UX (Opcional) 🟡

#### 3.1 Ícones por Plataforma

**Arquivo**: `src/lib/platforms/icons.tsx`

```typescript
import { LucideIcon } from 'lucide-react';

export const platformIcons: Record<string, { icon: LucideIcon; color: string }> = {
  kiwify: { icon: Leaf, color: 'text-green-600' },
  hotmart: { icon: Flame, color: 'text-orange-600' },
  eduzz: { icon: Zap, color: 'text-blue-600' },
  monetizze: { icon: DollarSign, color: 'text-purple-600' }
};
```

#### 3.2 Status de Integração

Adicionar na tela de Configurações:

```typescript
// Testar conexão com cada plataforma configurada
const testPlatformConnection = async (platform: string, apiKey: string) => {
  const response = await fetch(`/api/platforms/${platform}/test`, {
    method: 'POST',
    body: JSON.stringify({ apiKey })
  });
  return response.ok;
};
```

---

## 📋 Checklist de Implementação

### Prioridade Alta 🔴

- [ ] Criar camada de abstração (`PlatformAdapter`)
- [ ] Implementar `KiwifyAdapter`
- [ ] Implementar `HotmartAdapter`
- [ ] Criar `PlatformRegistry`
- [ ] Refatorar webhook para usar adapters
- [ ] Adicionar campos `external_transaction_id` e `platform_metadata` no banco
- [ ] Migrar webhook Kiwify para usar adapter
- [ ] Remover código duplicado

### Prioridade Média 🟡

- [ ] Implementar `EduzzAdapter`
- [ ] Implementar `MonetizzeAdapter`
- [ ] Adicionar validação de assinatura de webhook
- [ ] Criar tabela `user_platform_configs`
- [ ] Adicionar testes de conexão na UI
- [ ] Melhorar tratamento de erros

### Prioridade Baixa 🟢

- [ ] Adicionar ícones por plataforma
- [ ] Criar dashboard de status de integrações
- [ ] Implementar retry automático de webhooks falhados
- [ ] Adicionar logs estruturados
- [ ] Criar documentação de cada adapter

---

## 🎯 Conclusão

### Nota Geral: **6.5/10** para Multi-Plataforma

**Resumo**:
- ✅ **Banco de dados**: Pronto (80%)
- ⚠️ **Webhooks**: Precisa refatoração (50%)
- ⚠️ **Normalização**: Precisa abstração (40%)
- ✅ **Frontend**: Praticamente pronto (90%)
- ✅ **Configurações**: Funcional (70%)

### Tempo Estimado de Implementação

- **Fase 1 (Refatoração)**: 8-12 horas
- **Fase 2 (Novas Plataformas)**: 2-3 horas por plataforma
- **Fase 3 (Melhorias UX)**: 4-6 horas

### Recomendação Final

Leandro, seu código **tem uma base sólida**, mas precisa de **refatoração urgente** antes de adicionar mais plataformas. A arquitetura atual funciona para 1-2 plataformas, mas vai se tornar um pesadelo de manutenção com 4-5 plataformas.

**Minha sugestão**:
1. 🔴 **Priorize a Fase 1** (refatoração com adapters)
2. 🟡 Depois adicione Hotmart, Eduzz e Monetizze facilmente
3. 🟢 Por último, melhore a UX

Com a arquitetura de adapters, você poderá adicionar uma nova plataforma em **menos de 2 horas** e com **zero risco** de quebrar as existentes.

---

**Precisa de ajuda para implementar? Posso começar pela Fase 1 agora mesmo!** 🚀
