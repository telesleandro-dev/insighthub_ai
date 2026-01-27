# 🚀 InsightHub AI

**Plataforma inteligente de monitoramento e recuperação de vendas com IA**

InsightHub AI é uma solução completa para empreendedores digitais que desejam maximizar suas conversões através de monitoramento em tempo real, análise de dados e recuperação inteligente de carrinhos abandonados.

---

## 📋 Sumário

- [Visão Geral do Negócio](#-visão-geral-do-negócio)
- [Funcionalidades Principais](#-funcionalidades-principais)
- [Arquitetura Técnica](#-arquitetura-técnica)
- [Stack Tecnológico](#-stack-tecnológico)
- [Instalação e Configuração](#-instalação-e-configuração)
- [Execução do Projeto](#-execução-do-projeto)
- [Estrutura do Projeto](#-estrutura-do-projeto)
- [Integrações](#-integrações)
- [API Endpoints](#-api-endpoints)
- [Variáveis de Ambiente](#-variáveis-de-ambiente)
- [Deploy](#-deploy)

---

## 💼 Visão Geral do Negócio

### Problema Resolvido

Empreendedores digitais perdem em média **70% das vendas** devido a carrinhos abandonados e falta de acompanhamento adequado. O InsightHub AI resolve esse problema através de:

- **Monitoramento em tempo real** de todas as transações
- **Alertas automáticos** via Telegram para cada evento de venda
- **Recuperação inteligente** com sugestões de abordagem geradas por IA
- **Dashboard analítico** com métricas de performance e conversão

### Proposta de Valor

1. **Aumento de Receita**: Recupere vendas perdidas com abordagens personalizadas
2. **Automação Inteligente**: Notificações instantâneas e sugestões de IA
3. **Visibilidade Total**: Acompanhe métricas em tempo real
4. **ROI Mensurável**: Visualize o faturamento recuperado e taxa de conversão

---

## ✨ Funcionalidades Principais

### 1. Dashboard Geral
- **Métricas em Tempo Real**: Faturamento, vendas aprovadas, leads e taxa de conversão
- **Gráficos Interativos**: Visualização de faturamento por dia
- **Filtros Avançados**: Por plataforma (Kiwify, etc.) e período (hoje, 7 dias, 30 dias)
- **Produto Campeão**: Identificação automática do produto mais vendido
- **Plataforma Líder**: Análise de performance por origem de tráfego

### 2. Recuperação de Vendas
- **Gestão de Leads**: Visualização de todos os carrinhos abandonados
- **Status de Abordagem**: Pendente, Contatado, Em Negociação, Recuperado
- **IA de Recuperação (Bruna IA)**: Geração automática de mensagens personalizadas
- **Integração WhatsApp**: Abertura direta de conversas com clientes
- **Sistema de Ofertas**: Criação de links de desconto personalizados
- **Dashboard de Performance**: 
  - Faturamento recuperado
  - Pipeline ativo
  - Leads pendentes
  - Ofertas ativas

### 3. Notificações Automáticas
- **Telegram Bot**: Alertas instantâneos para cada evento
- **Diferenciação de Status**: Vendas aprovadas vs. carrinhos abandonados
- **Botões de Ação**: Recuperação rápida via WhatsApp
- **Multi-usuário**: Suporte a múltiplos usuários com configurações individuais

### 4. Configurações
- **Integração Telegram**: Configuração de bot e chat ID
- **Webhook Kiwify**: URL personalizada por usuário
- **Gerenciamento de Produtos**: Sincronização automática via webhook

---

## 🏗️ Arquitetura Técnica

### Arquitetura de Sistema

```
┌─────────────────┐
│   Kiwify API    │ (Webhook de Vendas)
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────┐
│   Next.js API Routes (Webhook)      │
│   - /api/webhook/kiwify             │
│   - Validação e normalização        │
└────────┬────────────────────────────┘
         │
         ├──────────────┬──────────────┐
         ▼              ▼              ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│   Supabase   │ │ Telegram Bot │ │  Gemini AI   │
│  (Database)  │ │ (Notificações)│ │ (Recuperação)│
└──────────────┘ └──────────────┘ └──────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│   Frontend (Next.js + React)        │
│   - Dashboard View                  │
│   - Recuperação View                │
│   - Configurações View              │
└─────────────────────────────────────┘
```

### Fluxo de Dados

1. **Captura de Evento**: Kiwify envia webhook para `/api/webhook/kiwify?user_id={uuid}`
2. **Processamento**: 
   - Validação de segurança (user_id)
   - Normalização de dados
   - Upsert de produto
   - Registro de evento de venda
3. **Notificação**: Envio automático via Telegram Bot
4. **Visualização**: Atualização em tempo real no dashboard
5. **Recuperação**: IA gera mensagem personalizada para abordagem

---

## 🛠️ Stack Tecnológico

### Frontend
- **Framework**: Next.js 14.2.0 (App Router)
- **UI Library**: React 18.2.0
- **Styling**: TailwindCSS 3.4.1
- **Componentes**: Radix UI (Headless Components)
- **Ícones**: Lucide React
- **Gráficos**: Recharts

### Backend
- **Runtime**: Node.js
- **Framework**: Next.js API Routes
- **Database**: Supabase (PostgreSQL)
- **ORM**: Supabase Client

### Integrações
- **IA**: Google Gemini AI (@google/generative-ai)
- **Notificações**: Telegram Bot API (node-telegram-bot-api)
- **Pagamentos**: Kiwify (Webhook)

### DevOps
- **Linguagem**: TypeScript 5
- **Linting**: ESLint 8
- **Build**: Next.js Build System
- **Deploy**: Vercel (recomendado)

---

## 📦 Instalação e Configuração

### Pré-requisitos

- Node.js 20+ instalado
- Conta no Supabase
- Conta no Google AI Studio (para Gemini API)
- Bot do Telegram criado (via @BotFather)
- Conta na Kiwify

### Passo 1: Clone o Repositório

```bash
git clone <url-do-repositorio>
cd insighthub_ai
```

### Passo 2: Instale as Dependências

```bash
npm install
```

### Passo 3: Configure as Variáveis de Ambiente

Crie um arquivo `.env.local` na raiz do projeto:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anon
SUPABASE_SERVICE_ROLE_KEY=sua-chave-service-role

# Google Gemini AI
GEMINI_API_KEY=sua-chave-gemini

# Telegram (Configuração Padrão - pode ser sobrescrita por usuário)
TELEGRAM_BOT_TOKEN=seu-token-do-bot
TELEGRAM_CHAT_ID=seu-chat-id

# Segurança
WEBHOOK_SECRET=sua-senha-secreta
```

### Passo 4: Configure o Banco de Dados

Execute os seguintes comandos SQL no Supabase:

```sql
-- Tabela de configurações de usuário
CREATE TABLE user_configs (
  user_id UUID PRIMARY KEY,
  telegram_token TEXT,
  telegram_chat_id TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de produtos
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id TEXT NOT NULL,
  name TEXT NOT NULL,
  user_id UUID NOT NULL,
  platform TEXT DEFAULT 'kiwify',
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(external_id, user_id)
);

-- Tabela de eventos de venda
CREATE TABLE sales_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  product_id UUID REFERENCES products(id),
  customer_name TEXT,
  customer_email TEXT,
  customer_phone TEXT,
  status TEXT,
  value DECIMAL(10,2),
  platform_origin TEXT,
  status_abordagem TEXT DEFAULT 'pendente',
  custom_discount_link TEXT,
  checkout_url TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de logs de webhook
CREATE TABLE webhooks_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform TEXT,
  payload JSONB,
  status TEXT,
  error_message TEXT,
  user_id UUID,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_sales_user ON sales_events(user_id);
CREATE INDEX idx_sales_status ON sales_events(status);
CREATE INDEX idx_products_user ON products(user_id);
```

### Passo 5: Configure o Webhook na Kiwify

1. Acesse sua conta Kiwify
2. Vá em Configurações > Webhooks
3. Adicione a URL: `https://seu-dominio.com/api/webhook/kiwify?user_id=SEU_UUID`
4. Selecione os eventos: `order.paid`, `order.waiting_payment`, `order.refused`

---

## 🚀 Execução do Projeto

### Modo Desenvolvimento

```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000) no navegador.

### Build de Produção

```bash
npm run build
npm run start
```

### Linting

```bash
npm run lint
```

---

## 📁 Estrutura do Projeto

```
insighthub_ai/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── webhook/
│   │   │   │   ├── kiwify/
│   │   │   │   │   └── route.ts          # Webhook Kiwify
│   │   │   │   └── route.ts              # Webhook genérico
│   │   │   ├── ai/
│   │   │   │   └── recuperar/
│   │   │   │       └── route.ts          # IA de recuperação
│   │   │   ├── leads/
│   │   │   │   └── update-link/
│   │   │   │       └── route.ts          # Atualização de links
│   │   │   ├── settings/
│   │   │   │   └── update/
│   │   │   │       └── route.ts          # Atualização de configs
│   │   │   └── update-discount/
│   │   │       └── route.ts              # Sistema de descontos
│   │   ├── dashboard/
│   │   │   ├── layout.tsx                # Layout do dashboard
│   │   │   └── page.tsx                  # Página principal
│   │   ├── login/
│   │   │   └── page.tsx                  # Página de login
│   │   ├── globals.css                   # Estilos globais
│   │   ├── layout.tsx                    # Layout raiz
│   │   └── page.tsx                      # Landing page
│   ├── components/
│   │   ├── ui/
│   │   │   ├── button.tsx                # Componente de botão
│   │   │   ├── card.tsx                  # Componente de card
│   │   │   ├── input.tsx                 # Componente de input
│   │   │   ├── table.tsx                 # Componente de tabela
│   │   │   └── modalls/
│   │   │       └── DiscountModal.tsx     # Modal de desconto
│   │   └── views/
│   │       ├── DashboardView.tsx         # View do dashboard
│   │       ├── RecuperacaoView.tsx       # View de recuperação
│   │       └── ConfiguracoesView.tsx     # View de configurações
│   └── lib/
│       └── supabase.ts                   # Cliente Supabase
├── public/                               # Arquivos estáticos
├── .env.local                            # Variáveis de ambiente
├── next.config.mjs                       # Configuração Next.js
├── tailwind.config.js                    # Configuração Tailwind
├── tsconfig.json                         # Configuração TypeScript
└── package.json                          # Dependências
```

---

## 🔌 Integrações

### Kiwify (Plataforma de Pagamentos)

**Webhook URL**: `/api/webhook/kiwify?user_id={uuid}`

**Eventos Suportados**:
- `order.paid` - Venda aprovada
- `order.waiting_payment` - Aguardando pagamento
- `order.refused` - Pagamento recusado

**Payload Esperado**:
```json
{
  "Customer": {
    "full_name": "Nome do Cliente",
    "email": "email@exemplo.com",
    "mobile": "11999999999"
  },
  "product_name": "Nome do Produto",
  "product_id": "123",
  "order_amount": 9900,
  "status": "paid"
}
```

### Telegram Bot

**Configuração**:
1. Crie um bot via @BotFather
2. Obtenha o token do bot
3. Inicie conversa com o bot
4. Use @userinfobot para obter seu chat_id

**Mensagens Enviadas**:
- Vendas aprovadas: ✅ com detalhes do cliente e valor
- Carrinhos abandonados: ⚠️ com botão de recuperação WhatsApp

### Google Gemini AI

**Modelo**: gemini-1.5-flash

**Uso**: Geração de mensagens personalizadas para recuperação de vendas

**Prompt**: Contextualizado com nome do cliente e produto

---

## 🌐 API Endpoints

### Webhooks

#### `POST /api/webhook/kiwify?user_id={uuid}`
Recebe eventos de venda da Kiwify

**Query Params**:
- `user_id` (obrigatório): UUID do usuário

**Response**:
```json
{
  "success": true
}
```

### IA

#### `POST /api/ai/recuperar`
Gera mensagem de recuperação com IA

**Body**:
```json
{
  "leadId": "uuid",
  "productName": "Nome do Produto",
  "customerName": "Nome do Cliente"
}
```

**Response**:
```json
{
  "message": "Mensagem personalizada gerada pela IA"
}
```

### Leads

#### `POST /api/leads/update-link`
Atualiza link de desconto de um lead

**Body**:
```json
{
  "leadId": "uuid",
  "discountLink": "https://checkout.com/desconto"
}
```

### Configurações

#### `POST /api/settings/update`
Atualiza configurações do usuário

**Body**:
```json
{
  "userId": "uuid",
  "telegramToken": "token",
  "telegramChatId": "chat_id"
}
```

---

## 🔐 Variáveis de Ambiente

| Variável | Descrição | Obrigatória |
|----------|-----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL do projeto Supabase | ✅ |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Chave anônima do Supabase | ✅ |
| `SUPABASE_SERVICE_ROLE_KEY` | Chave de serviço do Supabase | ✅ |
| `GEMINI_API_KEY` | Chave da API do Google Gemini | ✅ |
| `TELEGRAM_BOT_TOKEN` | Token do bot do Telegram | ⚠️ |
| `TELEGRAM_CHAT_ID` | ID do chat do Telegram | ⚠️ |
| `WEBHOOK_SECRET` | Senha secreta para webhooks | ⚠️ |

⚠️ = Pode ser configurado por usuário no sistema

---

## 🚢 Deploy

### Vercel (Recomendado)

1. Faça push do código para GitHub/GitLab/Bitbucket
2. Importe o projeto na Vercel
3. Configure as variáveis de ambiente
4. Deploy automático!

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/seu-usuario/insighthub-ai)

### Outras Plataformas

O projeto é compatível com qualquer plataforma que suporte Next.js:
- Netlify
- Railway
- Render
- AWS Amplify

---

## 📊 Métricas e KPIs

O sistema rastreia automaticamente:

- **Faturamento Total**: Soma de todas as vendas aprovadas
- **Faturamento Recuperado**: Vendas marcadas como "recuperado"
- **Taxa de Conversão**: (Vendas / Total de Leads) × 100
- **Pipeline Ativo**: Valor total de leads em negociação
- **Produto Campeão**: Produto com mais vendas
- **Plataforma Líder**: Origem com maior faturamento

---

## 🤝 Suporte

Para dúvidas ou problemas:
1. Verifique a documentação
2. Consulte os logs no Supabase (`webhooks_log`)
3. Entre em contato com o suporte técnico

---

## 📝 Licença

Este projeto é proprietário e confidencial.

---

**Desenvolvido com ❤️ para maximizar suas vendas com inteligência artificial**
