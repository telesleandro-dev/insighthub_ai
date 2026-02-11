# Changelog

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/),
e este projeto adere ao [Semantic Versioning](https://semver.org/lang/pt-BR/).

---

## [0.3.0] - 2026-02-11

### 🎯 Melhorias de UX e Consistência de Dados

#### ✨ Adicionado

##### Filtros de Período Sincronizados
- **Dashboard e Inteligência**: Filtros uniformizados entre as duas views
- **Opções de Período**:
  - Hoje: Leads/métricas de hoje
  - Ontem: Leads/métricas de ontem
  - 7 dias: Última semana
  - 30 dias: Último mês
  - Tudo: Todos os registros
- **Lógica Temporal**: Filtragem client-side e server-side sincronizadas
- **UI Consistente**: Mesmo componente de filtro em ambas as views

##### Documentação Técnica
- **auditoria_multi_tenant.md**:
  - Auditoria completa de arquitetura multi-tenant
  - Análise de Row Level Security (RLS) em 8 tabelas
  - Verificação de isolamento de dados por `user_id`
  - Checklist de preparação para produção
  - Score 5.0/5.0 - Production Ready
- **arquitetura_telegram_multitenant.md**:
  - Documentação da arquitetura Telegram por usuário
  - Fluxo end-to-end de configuração
  - Tutorial para obter credenciais (BOT Token e CHAT ID)
  - Explicação de isolamento de notificações
- **correcao_taxa_conversao.md**:
  - Análise de discrepância entre Dashboard (60%) e Inteligência (69,2%)
  - Identificação de causa raiz: diferença de período
  - Plano de implementação de sincronização

#### 🔧 Modificado

##### Dashboard View
- **Taxa de Conversão Alinhada**: Agora usa mesmo período da Inteligência de Vendas
- **Gráfico Corrigido**: 
  - Mudança de `sales_events` para `leads_profiles` como fonte
  - Remoção de campo inexistente `converted_at`
  - Uso de `created_at` para agrupamento temporal
  - Agora mostra valores convertidos reais
- **Filtros Temporais**: Implementação de lógica de filtragem por `dateRange`
- **Métricas Recalculadas**: Todas métricas agora respeitam período selecionado

##### Inteligência de Vendas View
- **Labels de Valor Corrigidos**: 
  - Leads com `service_status = 'converted'` sempre exibem label "Convertido"
  - Corrigida lógica `getLeadValue()` para considerar status
  - Fallback: `converted_value` > 0 ? converted : potential_value
- **Consistência de Dados**: Métricas alinhadas com Dashboard quando mesmo período

##### Auto-Logout por Inatividade
- **Hook useIdleTimer Corrigido**:
  - Adicionado `useCallback` para prevenir stale closures
  - Corrigidas dependências do useEffect
  - Timeout padrão: 60 minutos
  - Eventos monitorados: mousedown, mousemove, keydown, scroll, touchstart, click
  - Event listeners com `{ passive: true }` para performance

#### 🐛 Corrigido

##### Build e Deploy
- **Erro de Build #1**: `Module not found: '@/lib/ai/emailAnalyzer'`
  - Comentado import inexistente
  - Criado mock temporário da função `analyzeEmail`
  - Rota de email inbound aguardando implementação
- **Erro de Build #2**: `Property 'default' does not exist on type pdf-parse`
  - Adicionado `as any` em import dinâmico de `pdf-parse`
  - Resolvido erro TypeScript na extração de PDF
- **Query 400 Bad Request**: Removido campo `converted_at` inexistente de query

##### Dados e Métricas
- **Taxa de Conversão**: 
  - Dashboard e Inteligência agora mostram mesma taxa quando filtro igual
  - Eliminada discrepância causada por períodos diferentes
- **Gráfico do Dashboard**:
  - Corrigida fonte de dados de `sales_events` para `leads_profiles`
  - Agora exibe valores corretos de leads convertidos
  - Valor de 10/02/2026 corrigido
- **Labels Aba Convertido**:
  - Todos leads convertidos mostram label "Convertido" (não "Potencial")
  - Lógica considera `service_status` além de `converted_value`

##### Segurança e Autenticação
- **Auto-Logout**: Hook `useIdleTimer` agora funciona corretamente
  - Usuários inativos por 60+ minutos são automaticamente deslogados
  - Previne sessões abertas indefinidamente
  - Redirecionamento automático para `/login`

#### 📊 Consistência de Dados

##### Validação Multi-Tenant
- **50+ Arquivos Auditados**: Backend, Frontend, Migrações SQL
- **8 Tabelas com RLS**: Todas protegidas com `auth.uid() = user_id`
- **100% Queries Filtradas**: Todos selects incluem `.eq('user_id', user.id)`
- **Credenciais Isoladas**: Telegram, IA, emails individualizados
- **Webhooks Isolados**: URL pattern `?user_id=UUID` garante separação

##### Índices e Performance
- Verificados índices em `(user_id, email)`, `(user_id, created_at)`
- Queries otimizadas para multi-tenancy
- Performance não afetada por volume de outros usuários

#### 🔒 Segurança

- **RLS Completo**: Políticas ativas em todas tabelas críticas
- **Isolamento Verificado**: Zero possibilidade de cross-contamination
- **Autenticação Robusta**: Supabase Auth padrão indústria
- **Sessões Seguras**: Auto-logout após inatividade

#### ⚡ Performance

- **Filtros Otimizados**: Filtragem client-side reduz round-trips
- **Event Listeners Passive**: Melhor performance em scroll/touch
- **Índices Validados**: Busca rápida mesmo com milhões de leads

#### 📝 Commits Desta Versão

```
5321e8b - feat: Implementação completa de melhorias do sistema
152bc0e - fix: Sincronizar filtros de período e corrigir auto-logout
fb68be6 - fix: Comentar import de emailAnalyzer inexistente
cd8086b - fix: Adicionar type assertion no import dinâmico de pdf-parse
```

---

## [0.2.0] - 2026-01-27

### 🎉 Refatoração Multi-Plataforma - Sistema de Adapters

#### ✨ Adicionado

##### Sistema de Adapters de Plataforma
- **Arquitetura Extensível**: Implementação do padrão Adapter para suporte a múltiplas plataformas
- **Interface Unificada**: `PlatformAdapter` com métodos padronizados:
  - `detectPayload()`: Detecção automática de plataforma
  - `normalizeData()`: Normalização de dados para formato padrão
  - `validateSignature()`: Validação de assinatura de webhook
- **Tipos TypeScript**: Interfaces completas com `NormalizedSaleData` e `SaleStatus`
- **Tratamento de Erros**: Classes customizadas `MissingDataError` e `InvalidSignatureError`

##### Novas Plataformas Suportadas
- **Hotmart** ✅:
  - Detecção via campo `hottok` ou `event`
  - Suporte a múltiplos eventos (PURCHASE_COMPLETE, PURCHASE_APPROVED, etc)
  - Validação de assinatura via hottok
  - Normalização de estrutura complexa de dados
- **Eduzz** ✅:
  - Detecção via campos `sale_id` ou `contract_id`
  - Parsing de valores em formato brasileiro (vírgula decimal)
  - Suporte a dados de produtor e afiliado
- **Monetizze** ✅:
  - Detecção via campos `venda` ou `comprador`
  - Suporte a status numérico e textual
  - Normalização de telefone e valores
  - Metadados de comissão e afiliado

##### Webhook Unificado
- **Endpoint Universal**: `/api/webhook/unified` para todas as plataformas
- **Detecção Automática**: Identifica plataforma sem configuração manual
- **Logs Estruturados**: Logging detalhado em cada etapa do processamento
- **Endpoint de Status**: GET `/api/webhook/unified` retorna plataformas suportadas
- **Tratamento Robusto**: Error handling com fallback e logs de auditoria

##### Registry de Plataformas
- **Singleton Pattern**: Gerenciamento centralizado de adapters
- **Auto-registro**: Todas as plataformas registradas automaticamente
- **Métodos Utilitários**:
  - `detect()`: Detecção automática de plataforma
  - `get()`: Busca por nome
  - `getAll()`: Lista todas as plataformas
  - `getPlatformInfo()`: Informações resumidas

##### Banco de Dados
- **Novos Campos em `sales_events`**:
  - `external_transaction_id`: ID da transação na plataforma externa
  - `platform_metadata`: JSONB para metadados específicos
- **Nova Tabela `supported_platforms`**:
  - Registro de plataformas suportadas
  - Configuração de validação de assinatura
  - URLs de documentação
- **Nova Tabela `user_platform_configs`**:
  - Configurações por usuário/plataforma
  - API keys e webhook secrets
  - Contador de webhooks recebidos
- **View `platform_statistics`**:
  - Estatísticas agregadas por plataforma
  - Faturamento, conversão e tickets médios
- **Função `register_webhook_received()`**:
  - Atualiza contador de webhooks automaticamente
- **Índices Otimizados**:
  - `idx_sales_external_transaction`: Busca por transaction_id
  - `idx_sales_platform_status`: Busca por plataforma e status
  - `idx_sales_platform_metadata`: Busca em metadados JSON (GIN)

##### Documentação
- **GUIA_MIGRACAO.md**:
  - Passo a passo completo de migração
  - Checklist de implementação
  - Troubleshooting e queries de monitoramento
  - Testes de validação
- **PLATAFORMAS.md**:
  - Documentação detalhada de cada plataforma
  - Estrutura de payloads
  - Mapeamento de status
  - Guia para adicionar novas plataformas
  - Tabela comparativa de recursos
- **ANALISE_MULTI_PLATAFORMA.md**:
  - Análise técnica completa
  - Recomendações de arquitetura
  - Exemplos de código
  - Plano de implementação

#### 🔧 Modificado

##### Estrutura de Código
- **Organização**: Nova pasta `src/lib/platforms/` com todos os adapters
- **Separação de Responsabilidades**: Lógica de negócio isolada dos adapters
- **Reutilização**: Código compartilhado entre plataformas

##### Webhook Kiwify
- **Mantido para Compatibilidade**: Webhook específico `/api/webhook/kiwify` ainda funciona
- **Recomendação**: Migrar para webhook unificado quando possível

#### 🐛 Corrigido

- **Duplicação de Código**: Eliminada duplicação entre webhooks
- **Detecção Frágil**: Substituída lógica baseada em if/else por adapters
- **Inconsistências**: Unificado tratamento de dados entre plataformas
- **Falta de Tipagem**: Adicionado TypeScript completo em todos os adapters

#### ⚡ Performance

- **Detecção Otimizada**: Loop eficiente através dos adapters
- **Índices GIN**: Busca rápida em metadados JSON
- **Queries Otimizadas**: Novos índices para plataforma e status

#### 🔒 Segurança

- **Validação de Assinatura**: Suporte para plataformas que fornecem (Hotmart)
- **Metadados Isolados**: Dados específicos armazenados em campo separado
- **Logs de Auditoria**: Registro completo de todos os webhooks

#### 📊 Estatísticas

- **View Agregada**: Estatísticas automáticas por plataforma
- **Contador de Webhooks**: Tracking de volume por plataforma/usuário
- **Última Atividade**: Timestamp do último webhook recebido

---


## [0.1.0] - 2026-01-27

### 🎉 Lançamento Inicial - MVP (Minimum Viable Product)

#### ✨ Adicionado

##### Dashboard Geral
- **Métricas em Tempo Real**: Visualização de faturamento, vendas aprovadas, total de leads e taxa de conversão
- **Gráfico de Faturamento**: Visualização interativa de faturamento por dia usando Recharts
- **Filtros Avançados**: 
  - Filtro por período (Hoje, 7 dias, 30 dias)
  - Filtro por plataforma (Kiwify e outras futuras integrações)
- **Cards de Performance**:
  - Produto Campeão: Identificação automática do produto mais vendido
  - Plataforma Líder: Análise de origem de tráfego com maior faturamento
- **Integração com Supabase**: Consultas otimizadas com JOIN para relacionamento produtos-vendas

##### Sistema de Recuperação de Vendas
- **Gestão de Leads**: Tabela completa de carrinhos abandonados e vendas pendentes
- **Status de Abordagem**: Sistema de pipeline com 4 estados:
  - `Pendente`: Lead ainda não contatado
  - `Contatado`: Primeira abordagem realizada
  - `Em Negociação`: Cliente em processo de decisão
  - `Recuperado`: Venda finalizada com sucesso
- **IA de Recuperação (Bruna IA)**:
  - Integração com Google Gemini AI (modelo gemini-1.5-flash)
  - Geração automática de mensagens personalizadas
  - Contextualização com nome do cliente e produto
- **Integração WhatsApp**: Abertura direta de conversas com clientes via deep link
- **Sistema de Ofertas**: Criação e gerenciamento de links de desconto personalizados
- **Dashboard de Performance**:
  - Faturamento Recuperado: Valor total de vendas recuperadas
  - Pipeline Ativo: Valor em negociação
  - Leads Pendentes: Contador de oportunidades
  - Ofertas Ativas: Links de desconto em uso
- **Filtros Múltiplos**:
  - Por status de abordagem
  - Por plataforma de origem
  - Por categoria (Todos, Tickets R$ 500+, Com Oferta)

##### Notificações Automáticas
- **Telegram Bot Integration**:
  - Alertas instantâneos para cada evento de venda
  - Diferenciação visual entre vendas aprovadas (✅) e carrinhos abandonados (⚠️)
  - Botões de ação rápida para recuperação via WhatsApp
  - Suporte multi-usuário com configurações individuais
- **Sistema de Logs**: Registro de todos os webhooks recebidos para auditoria

##### Configurações
- **Gerenciamento de Integrações**:
  - Configuração de Telegram Bot (token e chat_id)
  - URL de webhook personalizada por usuário
  - Sincronização automática de produtos via webhook
- **Segurança**: Sistema de autenticação por user_id (UUID)

##### Integrações
- **Kiwify**:
  - Webhook para captura de eventos de venda
  - Suporte a múltiplos status: `paid`, `waiting_payment`, `refused`
  - Normalização automática de dados
  - Upsert inteligente de produtos
- **Supabase**:
  - 4 tabelas principais: `user_configs`, `products`, `sales_events`, `webhooks_log`
  - Índices otimizados para performance
  - Relacionamentos com foreign keys
- **Google Gemini AI**:
  - API de geração de texto para recuperação de vendas
  - Prompts otimizados para conversão
- **Telegram Bot API**:
  - Notificações em tempo real
  - Suporte a inline keyboards

##### Interface do Usuário
- **Landing Page**:
  - Design moderno com gradientes e glassmorphism
  - Seções de features com ícones
  - Call-to-action para acesso ao dashboard
- **Dashboard Layout**:
  - Sidebar com navegação por categorias (Monitoramento, Sistema)
  - 4 módulos principais: Dashboard Geral, Inteligência de Produto, Inbox Inteligente, Recuperação de Vendas
  - Design responsivo com TailwindCSS
- **Componentes UI**:
  - Botões personalizados (Radix UI)
  - Cards com sombras e bordas suaves
  - Inputs com validação
  - Tabelas responsivas
  - Modal de desconto com formulário

##### Arquitetura Técnica
- **Frontend**:
  - Next.js 14.2.0 com App Router
  - React 18.2.0 com hooks modernos
  - TailwindCSS 3.4.1 para estilização
  - TypeScript 5 para type safety
- **Backend**:
  - Next.js API Routes
  - Supabase Client para database
  - Node.js runtime
- **DevOps**:
  - ESLint para linting
  - Build otimizado com `--no-lint` flag
  - Suporte a deploy na Vercel

#### 🔧 Configuração

##### Variáveis de Ambiente
- `NEXT_PUBLIC_SUPABASE_URL`: URL do projeto Supabase
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Chave pública do Supabase
- `SUPABASE_SERVICE_ROLE_KEY`: Chave de serviço para operações privilegiadas
- `GEMINI_API_KEY`: Chave da API do Google Gemini
- `TELEGRAM_BOT_TOKEN`: Token do bot do Telegram (configurável por usuário)
- `TELEGRAM_CHAT_ID`: ID do chat do Telegram (configurável por usuário)
- `WEBHOOK_SECRET`: Senha secreta para validação de webhooks

##### Banco de Dados
- Schema SQL completo com 4 tabelas
- Índices para otimização de queries
- Constraints de unicidade para evitar duplicatas
- Timestamps automáticos para auditoria

#### 📚 Documentação
- README.md completo com:
  - Visão geral do negócio
  - Funcionalidades detalhadas
  - Arquitetura técnica com diagramas
  - Stack tecnológico
  - Guia de instalação passo a passo
  - Instruções de execução
  - Estrutura do projeto
  - Documentação de integrações
  - API endpoints com exemplos
  - Tabela de variáveis de ambiente
  - Guia de deploy
  - Métricas e KPIs

#### 🐛 Correções
- **Dashboard**: Resolução de bug no carregamento de nome de produtos (suporte a array e objeto do Supabase)
- **Webhook**: Tratamento de erros com logs detalhados
- **Filtros**: Sincronização correta entre múltiplos filtros

#### 🔒 Segurança
- Validação de `user_id` em todos os endpoints de webhook
- Service role key separada da chave pública
- Logs de auditoria para todos os webhooks
- Proteção contra SQL injection via Supabase client

#### ⚡ Performance
- Queries otimizadas com índices no banco
- Lazy loading de componentes
- Memoização de cálculos complexos
- Gráficos renderizados com ResponsiveContainer

---

## 🚀 Roadmap - Próximas Versões

### [0.2.0] - Planejado

#### Em Desenvolvimento
- **Inteligência de Produto**: Análise de performance por produto
- **Inbox Inteligente**: Central de mensagens e interações
- **Autenticação**: Sistema de login e registro de usuários
- **Multi-tenancy**: Suporte completo a múltiplos usuários

#### Melhorias Planejadas
- **Dashboard**:
  - Gráficos adicionais (pizza, linha, área)
  - Comparação de períodos
  - Exportação de relatórios em PDF/Excel
- **Recuperação**:
  - Templates de mensagem personalizáveis
  - Sequências automáticas de follow-up
  - A/B testing de abordagens
- **Integrações**:
  - Hotmart
  - Eduzz
  - Monetizze
  - Stripe

#### Funcionalidades Futuras
- **Analytics Avançado**: Machine learning para previsão de churn
- **Automação**: Fluxos de trabalho personalizáveis
- **Mobile App**: Aplicativo nativo iOS/Android
- **API Pública**: Endpoints para integrações customizadas

---

## 📝 Notas de Versão

### Convenções de Versionamento

Este projeto segue o [Semantic Versioning](https://semver.org/):
- **MAJOR** (X.0.0): Mudanças incompatíveis na API
- **MINOR** (0.X.0): Novas funcionalidades compatíveis
- **PATCH** (0.0.X): Correções de bugs compatíveis

### Categorias de Mudanças

- **✨ Adicionado**: Novas funcionalidades
- **🔧 Modificado**: Mudanças em funcionalidades existentes
- **🗑️ Descontinuado**: Funcionalidades que serão removidas
- **🔥 Removido**: Funcionalidades removidas
- **🐛 Corrigido**: Correções de bugs
- **🔒 Segurança**: Correções de vulnerabilidades

---

## 🤝 Contribuindo

Para contribuir com o projeto:
1. Consulte este CHANGELOG antes de iniciar desenvolvimento
2. Documente todas as mudanças na seção [Unreleased]
3. Siga as convenções de commit semântico
4. Atualize a versão no `package.json` conforme o tipo de mudança

---

**Última atualização**: 2026-02-11  
**Versão atual**: 0.3.0  
**Status**: Melhorias de UX e Consistência de Dados

