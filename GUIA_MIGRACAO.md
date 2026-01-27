# 🔄 Guia de Migração - Sistema Multi-Plataforma

**Data**: 2026-01-27  
**Versão**: 2.0.0  
**Autor**: Leandro Teles

---

## 📋 Visão Geral

Este guia documenta a migração do sistema de webhooks para suportar múltiplas plataformas de pagamento usando o padrão **Adapter**.

### O que mudou?

- ✅ **Antes**: Webhooks separados para cada plataforma
- ✅ **Depois**: Webhook unificado com detecção automática

### Plataformas Suportadas

1. **Kiwify** ✅ (já funcionando)
2. **Hotmart** ✅ (novo)
3. **Eduzz** ✅ (novo)
4. **Monetizze** ✅ (novo)

---

## 🗂️ Arquivos Criados

### 1. Sistema de Adapters (`src/lib/platforms/`)

```
src/lib/platforms/
├── index.ts                    # Interfaces e tipos base
├── registry.ts                 # Registro de plataformas
├── kiwify.adapter.ts          # Adapter Kiwify
├── hotmart.adapter.ts         # Adapter Hotmart
├── eduzz.adapter.ts           # Adapter Eduzz
└── monetizze.adapter.ts       # Adapter Monetizze
```

### 2. Webhook Unificado

```
src/app/api/webhook/unified/route.ts
```

### 3. Migration SQL

```
database/migrations/001_multi_platform_support.sql
```

---

## 🚀 Passo a Passo da Migração

### Passo 1: Executar Migration no Banco de Dados

Execute o arquivo SQL no Supabase:

```sql
-- Copie e cole o conteúdo de:
database/migrations/001_multi_platform_support.sql
```

**O que será criado:**
- ✅ Campos `external_transaction_id` e `platform_metadata` em `sales_events`
- ✅ Tabela `supported_platforms`
- ✅ Tabela `user_platform_configs`
- ✅ Índices para performance
- ✅ View `platform_statistics`
- ✅ Função `register_webhook_received()`

### Passo 2: Testar o Webhook Unificado

#### 2.1 Verificar Status

```bash
curl https://seu-dominio.com/api/webhook/unified
```

**Resposta esperada:**
```json
{
  "status": "online",
  "version": "2.0.0",
  "supportedPlatforms": [
    { "name": "kiwify", "displayName": "Kiwify" },
    { "name": "hotmart", "displayName": "Hotmart" },
    { "name": "eduzz", "displayName": "Eduzz" },
    { "name": "monetizze", "displayName": "Monetizze" }
  ],
  "totalPlatforms": 4
}
```

#### 2.2 Testar com Payload Kiwify

```bash
curl -X POST "https://seu-dominio.com/api/webhook/unified?user_id=SEU_UUID" \
  -H "Content-Type: application/json" \
  -d '{
    "product_name": "Produto Teste",
    "product_id": "123",
    "order_amount": 9900,
    "status": "paid",
    "Customer": {
      "full_name": "João Silva",
      "email": "joao@exemplo.com",
      "mobile": "11999999999"
    }
  }'
```

### Passo 3: Configurar URLs nas Plataformas

#### Kiwify
```
https://seu-dominio.com/api/webhook/unified?user_id=SEU_UUID
```

#### Hotmart
```
https://seu-dominio.com/api/webhook/unified?user_id=SEU_UUID
```

#### Eduzz
```
https://seu-dominio.com/api/webhook/unified?user_id=SEU_UUID
```

#### Monetizze
```
https://seu-dominio.com/api/webhook/unified?user_id=SEU_UUID
```

**Importante**: Todas as plataformas usam a **mesma URL**! O sistema detecta automaticamente.

### Passo 4: Migrar Webhooks Existentes (Opcional)

Se você já tem webhooks configurados:

1. **Mantenha o webhook antigo** funcionando
2. **Adicione o novo webhook** em paralelo
3. **Teste por 1 semana**
4. **Remova o webhook antigo**

Ou simplesmente **substitua a URL** diretamente.

---

## 🔍 Como Funciona

### Fluxo de Detecção Automática

```
1. Webhook recebe payload
   ↓
2. PlatformRegistry tenta detectar plataforma
   ↓
3. Cada adapter verifica se reconhece o payload
   ↓
4. Primeiro adapter que reconhecer é usado
   ↓
5. Adapter normaliza dados para formato padrão
   ↓
6. Sistema processa normalmente
```

### Exemplo de Detecção

```typescript
// Kiwify envia:
{
  "product_name": "...",
  "Customer": { ... }
}
// ✅ KiwifyAdapter.detectPayload() retorna true

// Hotmart envia:
{
  "hottok": "...",
  "data": { ... }
}
// ✅ HotmartAdapter.detectPayload() retorna true
```

---

## 📊 Monitoramento

### Ver Logs de Webhooks

```sql
SELECT 
  platform,
  status,
  created_at,
  error_message
FROM webhooks_log
ORDER BY created_at DESC
LIMIT 50;
```

### Estatísticas por Plataforma

```sql
SELECT * FROM platform_statistics;
```

### Últimos Webhooks por Usuário

```sql
SELECT 
  platform_name,
  last_webhook_at,
  webhook_count,
  is_active
FROM user_platform_configs
WHERE user_id = 'SEU_UUID';
```

---

## 🐛 Troubleshooting

### Problema: "Plataforma não reconhecida"

**Causa**: Payload não corresponde a nenhum adapter

**Solução**:
1. Verifique os logs: `webhooks_log` com `status = 'error'`
2. Copie o payload
3. Verifique qual plataforma deveria ser
4. Ajuste o método `detectPayload()` do adapter correspondente

### Problema: "Dados obrigatórios ausentes"

**Causa**: Email do cliente não encontrado no payload

**Solução**:
1. Verifique o payload no log
2. Identifique onde está o email
3. Ajuste o método `normalizeData()` do adapter

### Problema: Webhook duplicado

**Causa**: Algumas plataformas enviam o mesmo evento múltiplas vezes

**Solução**:
Use `external_transaction_id` para deduplicação:

```sql
-- Adicionar constraint de unicidade
ALTER TABLE sales_events
ADD CONSTRAINT unique_transaction_per_user
UNIQUE (user_id, external_transaction_id);
```

---

## 🔒 Segurança

### Validação de Assinatura

Atualmente implementado para:
- ✅ Hotmart (via hottok)
- ⚠️ Kiwify (não suportado pela plataforma)
- ⚠️ Eduzz (não documentado)
- ⚠️ Monetizze (não documentado)

### Recomendações

1. **Sempre use HTTPS**
2. **Mantenha user_id secreto** (não compartilhe a URL)
3. **Monitore logs** regularmente
4. **Configure IP whitelist** se a plataforma suportar

---

## 📈 Próximos Passos

### Curto Prazo
- [ ] Testar com webhooks reais de cada plataforma
- [ ] Ajustar adapters conforme necessário
- [ ] Configurar alertas de erro

### Médio Prazo
- [ ] Adicionar retry automático para webhooks falhados
- [ ] Implementar deduplicação por transaction_id
- [ ] Criar dashboard de status de integrações

### Longo Prazo
- [ ] Adicionar mais plataformas (Stripe, PagSeguro, etc)
- [ ] Implementar validação de assinatura robusta
- [ ] Criar testes automatizados

---

## 🆘 Suporte

### Logs Importantes

```typescript
// Ativar logs detalhados (desenvolvimento)
console.log('[Webhook] Payload recebido:', body);
console.log('[Webhook] Plataforma detectada:', adapter.name);
console.log('[Webhook] Dados normalizados:', normalizedData);
```

### Contatos

- **Desenvolvedor**: Leandro Teles
- **Documentação**: Ver `ANALISE_MULTI_PLATAFORMA.md`
- **Código**: `src/lib/platforms/`

---

## ✅ Checklist de Migração

- [ ] Executar migration SQL no Supabase
- [ ] Verificar que tabelas foram criadas
- [ ] Testar endpoint GET do webhook unificado
- [ ] Testar com payload de teste (Kiwify)
- [ ] Configurar URL na Kiwify
- [ ] Configurar URL na Hotmart (se usar)
- [ ] Configurar URL na Eduzz (se usar)
- [ ] Configurar URL na Monetizze (se usar)
- [ ] Monitorar logs por 24h
- [ ] Verificar que vendas estão sendo registradas
- [ ] Verificar que Telegram está funcionando
- [ ] Remover webhooks antigos (se aplicável)

---

**Última atualização**: 2026-01-27  
**Status**: ✅ Pronto para produção
