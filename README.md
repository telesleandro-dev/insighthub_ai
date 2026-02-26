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

### 📚 Regras de Negócio (Sniper Mode)

O sistema opera com regras estritas de admissão e cálculo de ROI. Para detalhes sobre a lógica de **"Porteiro"** (Webhook) e **"Lista Limpa"** (Frontend), consulte:

👉 **[REGRAS_DE_NEGOCIO.md](./REGRAS_DE_NEGOCIO.md)**

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

## 🏗️ Arquitetura e Dados

Para detalhes técnicos profundos sobre a infraestrutura de dados e contratos de integração, consulte nossos documentos de referência:

- 📑 **[ESPECIFICACOES_TECNICAS.md](./ESPECIFICACOES_TECNICAS.md)**: Schema SQL completo, Contratos JSON e fluxos de API.
- 🕒 **[CHANGELOG.md](./CHANGELOG.md)**: Histórico completo de versões e mudanças notáveis.
- 🎯 **[REGRAS_DE_NEGOCIO.md](./REGRAS_DE_NEGOCIO.md)**: Lógica do Sniper Flow e motor de IA.

---

## 🛠️ Stack Tecnológico

### Frontend
- **Framework**: Next.js 14.2.0 (App Router)
- **UI Library**: React 18.2.0
- **Styling**: TailwindCSS + Vanilla CSS (Glassmorphism)
- **Componentes**: Radix UI + Lucide React
- **Gráficos**: Recharts

### Backend & Cloud
- **Database**: Supabase (PostgreSQL) com Row Level Security (RLS)
- **IA**: Google Gemini AI (1.5 Flash/Pro)
- **Notificações**: Telegram Bot API
- **Arquitetura**: Sistema de Adapters Multi-Plataforma

---

## 📦 Instalação e Configuração

### Passo 1: Clone e Instale
```bash
git clone <url-do-repositorio>
npm install
```

### Passo 2: Variáveis de Ambiente
Crie um arquivo `.env.local` na raiz. A lista completa de variáveis obrigatórias está disponível em **[ESPECIFICACOES_TECNICAS.md](./ESPECIFICACOES_TECNICAS.md#variáveis-de-ambiente)**.

### Passo 3: Banco de Dados
O schema é gerenciado via migrações no diretório `database/migrations`. Para o schema consolidado e dicionário de dados, veja o documento de especificações técnicas.

---

## 🔌 API Endpoints (Resumo)

### Webhooks
`POST /api/webhook/unified?user_id={uuid}`
Recebe e processa automaticamente eventos de Kiwify, Hotmart, Eduzz e Monetizze. Requer `x-api-key`.

### Recuperação IA
`POST /api/ai/recuperar`
Gera dossiês estratégicos e mensagens de abordagem personalizadas via Bruna IA.

### Enriquecimento
`POST /api/leads/update-profile`
Endpoint de idempotência para enriquecimento de dados via ferramentas externas (n8n/Make).

---

## 🚢 Deploy

O projeto é otimizado para **Vercel**. Certifique-se de configurar as variáveis de ambiente e a `SUPABASE_SERVICE_ROLE_KEY` para o correto funcionamento dos webhooks.

---

## 🤝 Contribuição e Versões

Este projeto segue o padrão **Semantic Versioning**. Todas as mudanças notáveis devem ser registradas no `CHANGELOG.md`.

**Versão Atual**: v0.3.2  
**Status**: Estabilizado (Sniper Flow & AI Protection)

---

**Desenvolvido com ❤️ para maximizar suas vendas com inteligência artificial**
