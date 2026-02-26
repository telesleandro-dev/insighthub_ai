# 🎯 Regras de Negócio - InsightHub AI (Modo Sniper)

Este documento detalha as regras de negócio fundamentais do sistema, implementadas para garantir que o InsightHub funcione como uma ferramenta especializada em **Recuperação de Vendas** com cálculo de **ROI Puro**.

---

## 🧠 Filosofia do Sistema

O sistema opera sob a filosofia **"Sniper de Recuperação"**.
- **Foco Absoluto**: Não gastamos recursos com quem compra sozinho.
- **ROI Puro**: Apenas faturamento que teve intervenção humana é contabilizado como mérito do sistema.
- **Lista Limpa**: O usuário só vê quem precisa de ação imediata.

---

## 🛡️ O Porteiro (Webhook Gatekeeper)

O processamento de webhooks (`/api/webhook/unified`) segue regras estritas de admissão.

### 1. Venda Direta (`Paid`, `Approved`)
*   **Cenário**: O webhook informa que uma venda foi aprovada.
*   **Regra**:
    *   **Se o lead NÃO existe**: O evento é **IGNORADO**. (Assumimos que é tráfego direto/orgânico).
    *   **Se o lead JÁ existe**:
        *   Status muda para `Converted`.
        *   Score zera.
        *   **Validação de ROI**:
            *   Se o status anterior era `Contacted`, o status muda para `Converted` e registra a venda em `sales_events` (Conta no Gráfico).
            *   Se o status anterior NÃO era `Contacted`, o status muda para `Direct_Sale`. A venda é ignorada no ROI e não aparece na aba de Convertidos (Venda Orgânica).

### 2. Limbo / Boleto Novo (`Waiting Payment`)
*   **Cenário**: Cliente gerou um pix ou boleto.
*   **Regra**:
    *   **Se o lead NÃO existe**: O evento é **IGNORADO**. (Não sujamos a base com boletos frios).
    *   **Se o lead JÁ existe**:
        *   Atualizamos `last_interaction_at` e `last_platform`.
        *   **NÃO** mudamos o status para `Pending` (para não poluir a lista de quem já está sendo trabalhado ou já abandonou).

### 3. Falhas / Entrada (`Abandoned`, `Refused`, `Expired`)
*   **Cenário**: Abandono de carrinho ou recusa de cartão.
*   **Regra**:
    *   O lead é **CRIADO** ou **ATUALIZADO**.
    *   Status definido como `Pending`.
    *   **Exceção**: Se o status já era `Contacted` ou `Processed` (IA já analisou), ele **PERMANECE** no status atual (para não perder a marcação de ROI humano ou evitar re-processamento desnecessário da IA).
    *   Lead entra na lista de recuperação.
    *   Score de propensão é calculado.

---

## 💻 Frontend (A Lista Inteligente)

### 1. Filtro de Exibição
A lista de leads (`InteligenciaLeadsView`) exibe **apenas**:
*   Status `Processed` (Análise da IA/N8N concluída, pronto para abordagem)
*   Status `Contacted` (Em negociação iniciada pelo humano)

**Ocultos Automaticamente**:
*   Status `Pending` (Aguardando análise da IA/Sistema) -> Invisível para não poluir a lista.

**Excluídos Automaticamente**:
*   Leads convertidos (`Paid`) -> Somem da lista imediatamente.
*   Leads em `Waiting Payment` (que não vieram de uma falha anterior).

### 2. Gatilhos de Ação
*   **Botão WhatsApp**: Ao clicar em "Chamar no Zap", o sistema altera o status imediatamente para `Contacted`.
    *   Isso "marca" o lead. Se ele comprar depois, o ROI será atribuído à recuperação.

---

## 📊 Métricas e ROI

*   **Faturamento Recuperado**: Soma das vendas onde `recovery_status = 'converted'` (apenas leads que foram `Contacted` antes da compra).
*   **Vendas Orgânicas**: Vendas que ocorreram sem status `Contacted` não aparecem nos gráficos de receita recuperada.

---

## 🔄 Ciclo de Vida do Lead (Fluxo Sniper)

O InsightHub AI opera em três estágios para garantir foco total e baixo ruído:

1.  **Estágio 1: Entrada Silenciosa (`Pending`)**
    *   Ocorre quando o Webhook recebe uma falha (Abandono, Recusa).
    *   O Lead é criado/atualizado e o **Score é calculado matematicamente** pelo back-end.
    *   **Invisível**: O lead NÃO aparece em nenhuma listagem do frontend.

2.  **Estágio 2: Processamento e Enriquecimento (`Processed`)**
    *   O sistema aguarda o sinal do **n8n** (ou IA externa).
    *   O n8n chama o endpoint `/api/leads/update-profile` enviando o **Dossiê da IA (`lead_summary`)**.
    *   O status muda para `Processed`.
    *   **Visível**: O lead aparece instantaneamente na tela de "Inteligência de Vendas" e no Dashboard como "Lead Pronto".

3.  **Estágio 3: Atendimento Humano (`Contacted`)**
    *   Ao clicar para abordar, o status muda para `Contacted`.
    *   O lead é "marcado" para atribuição de ROI. Se comprar, o mérito será do sistema.

---

**Última Atualização**: 12/02/2026
**Versão da Lógica**: 2.5 (Sniper Flow Edition)
