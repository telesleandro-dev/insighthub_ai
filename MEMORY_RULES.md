# 📜 InsightHub AI - MEMORY_RULES.md

Este documento serve como a **Constituição de Desenvolvimento** do InsightHub AI. Estas regras são obrigatórias e devem ser consultadas antes de iniciar qualquer tarefa para garantir a estabilidade e escalabilidade do projeto.

---

## 🏗️ 1. Preservação do Core (Backend)
- **Regra:** Antes de alterar qualquer função no backend, realize uma busca profunda por usos (*find usages*).
- **Objetivo:** Garantir que mudanças em funções core não quebrem integrações ou processos dependentes.

## 🎯 2. Integridade do Status de Serviço
- **Regra:** Nunca altere a lógica de `service_status` (ex: de `pending` para `processed`) sem sincronização.
- **Obrigação:** Os filtros do **Sniper Mode** no Frontend e as queries do **Dashboard** devem ser validados e atualizados em conjunto com a mudança de lógica.

## 🧩 3. Consistência de Tipagem (Fullstack)
- **Regra:** Toda alteração em interfaces TypeScript no Backend (ex: `LeadProfile`, `UserConfig`) obriga a atualização imediata do Frontend correspondente.
- **Objetivo:** Manter a integridade do contrato de dados entre cliente e servidor.

## 🛡️ 4. Padrão Multi-tenant (Segurança)
- **Regra:** Toda e qualquer query ao banco de dados **DEVE** conter o filtro de `user_id`.
- **Proibição:** É terminantemente proibido remover este filtro para facilitar testes ou debugs. A separação de dados entre usuários é sagrada.

## 🔌 5. Proteção de Infraestrutura e n8n
- **Regra:** Não altere nomes de variáveis de ambiente no `.env` ou `.env.local` sem consentimento explícito.
- **Motivo:** Alterações em nomes de variáveis quebram a conexão com o **n8n** e outros webhooks críticos.

## 📊 6. Análise de Impacto Obrigatória
Antes de sugerir ou aplicar qualquer mudança significativa, deve-se listar:
1. **O que isso resolve:** O problema específico sendo atacado.
2. **O que isso pode impactar:** Possíveis efeitos colaterais em outras partes do sistema.

---

> [!IMPORTANT]
> **Compromisso do Agente:** Eu confirmo que lerei e seguirei estas regras em todas as interações. Cada bloco de código enviado será validado contra esta constituição.
