# 🧪 Como Testar a API de Email Inbound

## Endpoint
```
POST http://localhost:3000/api/emails/inbound
```

---

## Usando cURL

```bash
curl -X POST http://localhost:3000/api/emails/inbound \
  -H "Content-Type: application/json" \
  -d @test-data/webhook-biblia-negra.json
```

---

## Usando Postman/Insomnia

1. **Method:** POST
2. **URL:** `http://localhost:3000/api/emails/inbound`
3. **Headers:**
   - `Content-Type: application/json`
4. **Body (raw JSON):**

```json
{
  "type": "email.received",
  "created_at": "2026-02-03T14:35:00.000Z",
  "data": {
    "to": ["insight@insighthubai.com"],
    "from": "joao.silva@gmail.com",
    "subject": "Dúvida sobre a Bíblia Negra da Sedução",
    "html": "<p>Olá! Vi o anúncio da <strong>Bíblia Negra da Sedução</strong> e fiquei muito interessado.</p><p>Gostaria de saber se o conteúdo realmente funciona para melhorar habilidades sociais e conquistar pessoas. O preço está um pouco alto, vocês têm alguma garantia ou período de teste?</p><p>Também queria saber se tem suporte após a compra. Estou com receio de comprar e não conseguir aplicar as técnicas.</p><p>Aguardo retorno!</p>",
    "text": "Olá! Vi o anúncio da Bíblia Negra da Sedução e fiquei muito interessado.\n\nGostaria de saber se o conteúdo realmente funciona para melhorar habilidades sociais e conquistar pessoas. O preço está um pouco alto, vocês têm alguma garantia ou período de teste?\n\nTambém queria saber se tem suporte após a compra. Estou com receio de comprar e não conseguir aplicar as técnicas.\n\nAguardo retorno!",
    "reply_to": "joao.silva@gmail.com",
    "message_id": "<biblia-negra-test-001@gmail.com>",
    "date": "2026-02-03T14:35:00.000Z"
  }
}
```

---

## Usando PowerShell (Windows)

```powershell
$body = Get-Content -Path "test-data\webhook-biblia-negra.json" -Raw

Invoke-RestMethod -Uri "http://localhost:3000/api/emails/inbound" `
  -Method POST `
  -ContentType "application/json" `
  -Body $body
```

---

## ⚠️ IMPORTANTE - Antes de Testar

### 1. Certifique-se que o email existe no seu perfil

Execute no Supabase SQL Editor:

```sql
-- Ver seu insighthub_email atual
SELECT id, email, insighthub_email FROM profiles 
WHERE email = 'seu-email@exemplo.com';

-- Se necessário, atualizar o insighthub_email para 'insight@insighthubai.com'
UPDATE profiles 
SET insighthub_email = 'insight@insighthubai.com'
WHERE email = 'seu-email@exemplo.com';
```

### 2. Certifique-se que tem GEMINI_API_KEY configurada

Verifique no arquivo `.env.local`:
```
GEMINI_API_KEY=sua-chave-aqui
```

---

## O que acontece ao enviar

1. ✅ API recebe o webhook
2. ✅ Busca usuário pelo email `insight@insighthubai.com`
3. ✅ Chama API Gemini para analisar o email
4. ✅ Extrai:
   - Sentimento
   - Intenção
   - Dores identificadas
   - Probabilidade de conversão
   - Sugestão de resposta
   - **Produto identificado** → "Bíblia Negra da Sedução"
5. ✅ Salva tudo na tabela `inbox_messages`
6. ✅ Retorna JSON com análise

---

## Resposta Esperada

```json
{
  "success": true,
  "analysis": {
    "analise_sentimento": "Neutro",
    "intencao": "Dúvida sobre produto",
    "resumo_executivo": "Lead interessado...",
    "dores_identificadas": ["Receio de não saber aplicar", "Preço alto"],
    "probabilidade_conversao": 65,
    "sugestao_resposta": "Olá João! Que ótimo...",
    "produto_identificado": "Bíblia Negra da Sedução"
  }
}
```

---

## Verificar no Dashboard

Após enviar, vá em:
- **Dashboard** → **Inteligência de Produtos**
- Você verá o card do email com todas as análises
- O campo `produto_identificado` estará preenchido

🚀 **Pronto para testar!**
