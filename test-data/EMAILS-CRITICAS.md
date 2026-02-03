# 📧 Emails de Teste - Críticas Negativas

## Arquivos Criados

### 1. [`email-critica-forte.json`](file:///c:/Users/leandro.teles/Desktop/projetos/insighthub_%20ai/test-data/email-critica-forte.json)
**Cenário:** Cliente extremamente insatisfeito, ameaçando avaliação negativa
- **Sentimento:** Negativo (forte)
- **Intenção:** Reclamação + Reembolso
- **Probabilidade Conversão:** ~0%
- **Produto:** Bíblia Negra da Sedução

**Dores:**
- Produto não funciona
- Material superficial
- Preço alto
- Falta de resultados

---

### 2. [`email-reclamacao-produto.json`](file:///c:/Users/leandro.teles/Desktop/projetos/insighthub_%20ai/test-data/email-reclamacao-produto.json)
**Cenário:** Reclamação estruturada com lista de problemas
- **Sentimento:** Negativo (moderado)
- **Intenção:** Reclamação + Suporte
- **Probabilidade Conversão:** ~10%
- **Produto:** Bíblia Negra da Sedução

**Dores:**
- Expectativas não atendidas
- Suporte inexistente
- Preço alto
- Conteúdo desatualizado

---

## 🧪 Como Testar

### Enviar Crítica Forte
```powershell
$headers = @{ "Content-Type" = "application/json" }
$body = Get-Content "test-data\email-critica-forte.json" -Raw
Invoke-WebRequest -Uri "http://localhost:3000/api/emails/inbound" `
  -Method POST -Headers $headers -Body $body -UseBasicParsing
```

### Enviar Reclamação Estruturada
```powershell
$headers = @{ "Content-Type" = "application/json" }
$body = Get-Content "test-data\email-reclamacao-produto.json" -Raw
Invoke-WebRequest -Uri "http://localhost:3000/api/emails/inbound" `
  -Method POST -Headers $headers -Body $body -UseBasicParsing
```

---

## 📊 Resultado Esperado

Após enviar, verifique em **Inteligência de Produtos**:

**Indicadores esperados:**
- ✅ Sentimento: **Negativo** (badge vermelho)
- ✅ Termômetro: Score baixo (0-25)
- ✅ Dores identificadas no card
- ✅ Sugestão de IA para recuperação
- ✅ `produto_identificado`: "Bíblia Negra da Sedução"
- ✅ `product_id`: 39d44200-ce1d-11ef-8947-f71889bde439

---

## 🎯 Filtrar por Produto

1. Vá em **Inteligência de Produtos**
2. Selecione **"A Bíblia Negra da Sedução e Poder"** no dropdown
3. Deve mostrar apenas emails deste produto
4. Termômetro reflete reputação deste produto específico
