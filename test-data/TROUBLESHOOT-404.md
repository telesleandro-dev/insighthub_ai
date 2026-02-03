# 🔧 Testando API de Email Inbound

## ⚠️ Se estiver dando erro 404

### Solução 1: Reiniciar o Servidor

O Next.js pode não ter reconhecido as mudanças na API. Reinicie:

```powershell
# No terminal onde está rodando npm run dev:
# Pressione Ctrl+C para parar

# Depois execute novamente:
npm run dev
```

Aguarde aparecer:
```
✓ Ready in Xms
```

---

### Solução 2: Verificar se a Rota Existe

```powershell
Get-ChildItem -Path "src\app\api\emails\inbound" -Recurse
```

Deve mostrar:
```
route.ts
```

---

### Solução 3: Testar com Navegador

Abra o navegador e vá para:
```
http://localhost:3000/api/emails/analytics?userId=c048be53-fff6-4446-a8b8-6abf79fce171&timeFilter=7d
```

Se funcionar, o servidor está OK. O problema é só com a rota `/inbound`.

---

## 🧪 Comando de Teste Correto

**Após reiniciar o servidor**, use:

```powershell
$headers = @{ "Content-Type" = "application/json" }
$body = Get-Content "test-data\email-critica-negativa.json" -Raw
$response = Invoke-WebRequest -Uri "http://localhost:3000/api/emails/inbound" -Method POST -Headers $headers -Body $body -UseBasicParsing
$response.Content | ConvertFrom-Json | ConvertTo-Json -Depth 10
```

---

## 📊 Resultado Esperado

```json
{
  "success": true,
  "analysis": {
    "analise_sentimento": "Negativo",
    "intencao": "Reclamação",
    "resumo_executivo": "Lead insatisfeito ameaçando denúncia",
    "dores_identificadas": ["Crítica ao conteúdo", "Questões éticas"],
    "probabilidade_conversao": 5,
    "sugestao_resposta": "Responder com empatia explicando...",
    "produto_identificado": "Bíblia Negra da Sedução"
  }
}
```

---

## 🆘 Se Continuar com 404

Execute este diagnóstico:

```powershell
# Ver todas as rotas da API
Get-ChildItem -Path "src\app\api" -Recurse -Filter "route.ts" | Select-Object FullName

# Testar porta
Test-NetConnection -ComputerName localhost -Port 3000

# Ver logs do servidor
# Vá no terminal do npm run dev e procure por erros em vermelho
```

**Envie os logs se precisar de ajuda!**
