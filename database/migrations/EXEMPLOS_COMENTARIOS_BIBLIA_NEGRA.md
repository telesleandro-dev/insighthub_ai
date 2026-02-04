# 📧 Exemplos de Comentários de Email - Bíblia Negra da Sedução e Poder

## Para inserir estes dados, use o endpoint de emails ou insira direto no Supabase na tabela `inbox_messages`

---

## ✅ Comentário Positivo 1

```json
{
  "customer_email": "rodrigo.silva@gmail.com",
  "customer_name": "Rodrigo Silva",
  "product_id": "fe898fa8-d84e-498e-8742-ecf2103afec6",
  "subject": "Produto excepcional!",
  "body": "Comprei a Bíblia Negra da Sedução e Poder há 2 semanas e já vi resultados incríveis. O conteúdo é muito direto e prático. Recomendo demais!",
  "sentiment": "positive",
  "received_at": "2026-02-01T10:30:00Z"
}
```

---

## ✅ Comentário Positivo 2

```json
{
  "customer_email": "carlos.mendes@hotmail.com",
  "customer_name": "Carlos Mendes",
  "product_id": "fe898fa8-d84e-498e-8742-ecf2103afec6",
  "subject": "Valeu muito a pena",
  "body": "Estava em dúvida se comprava, mas depois de ler a Bíblia Negra minha confiança aumentou muito. O módulo sobre linguagem corporal é sensacional. Melhor investimento que fiz este ano.",
  "sentiment": "positive",
  "received_at": "2026-02-02T14:15:00Z"
}
```

---

## ⚠️ Comentário Neutro 1

```json
{
  "customer_email": "paula.costa@yahoo.com",
  "customer_name": "Paula Costa",
  "product_id": "fe898fa8-d84e-498e-8742-ecf2103afec6",
  "subject": "Bom, mas esperava mais",
  "body": "O produto é bom, tem bastante conteúdo. Achei algumas partes um pouco repetitivas, mas no geral vale a pena. Queria mais exemplos práticos de casos reais.",
  "sentiment": "neutral",
  "received_at": "2026-01-30T16:45:00Z"
}
```

---

## ⚠️ Comentário Neutro 2

```json
{
  "customer_email": "fernando.alves@outlook.com",
  "customer_name": "Fernando Alves",
  "product_id": "fe898fa8-d84e-498e-8742-ecf2103afec6",
  "subject": "Interessante mas longo",
  "body": "Comprei a Bíblia Negra e estou lendo aos poucos. O conteúdo é denso, são muitas páginas. Ainda não terminei, mas até agora está interessante. Espero que compense o tempo de leitura.",
  "sentiment": "neutral",
  "received_at": "2026-01-29T11:20:00Z"
}
```

---

## ❌ Comentário Negativo 1

```json
{
  "customer_email": "lucas.pereira@gmail.com",
  "customer_name": "Lucas Pereira",
  "product_id": "fe898fa8-d84e-498e-8742-ecf2103afec6",
  "subject": "Não é o que esperava",
  "body": "Comprei achando que teria técnicas mais avançadas. Achei muito básico para quem já tem alguma experiência. Talvez seja bom para iniciantes, mas não para mim.",
  "sentiment": "negative",
  "received_at": "2026-01-28T09:00:00Z"
}
```

---

## ✅ Comentário Positivo 3 - Cliente Recuperado

```json
{
  "customer_email": "mariana.lopes@yahoo.com.br",
  "customer_name": "Mariana Lopes",
  "product_id": "fe898fa8-d84e-498e-8742-ecf2103afec6",
  "subject": "Valeu a pena esperar!",
  "body": "Fiquei com o PIX pendente por quase 24h mas finalmente consegui pagar. E valeu muito a pena! A Bíblia Negra superou minhas expectativas. Os capítulos sobre poder pessoal são transformadores.",
  "sentiment": "positive",
  "received_at": "2026-02-03T12:00:00Z"
}
```

---

## ✅ Comentário Positivo 4 - Destaca Benefício Específico

```json
{
  "customer_email": "andre.santos@gmail.com",
  "customer_name": "André Santos",
  "product_id": "fe898fa8-d84e-498e-8742-ecf2103afec6",
  "subject": "Capítulo 7 mudou minha vida",
  "body": "O capítulo sobre frame control na Bíblia Negra foi um divisor de águas. Apliquei as técnicas no trabalho e já consegui uma promoção. Produto top demais!",
  "sentiment": "positive",
  "received_at": "2026-01-31T18:30:00Z"
}
```

---

## ⚠️ Comentário com Dúvida

```json
{
  "customer_email": "rafael.bc@gmail.com",
  "customer_name": "Rafael BC",
  "product_id": "fe898fa8-d84e-498e-8742-ecf2103afec6",
  "subject": "Dúvida sobre bônus",
  "body": "Comprei a Bíblia Negra mas não recebi os bônus prometidos. Onde estão os áudios extras? Preciso de ajuda para acessar o material complementar.",
  "sentiment": "neutral",
  "received_at": "2026-02-03T15:50:00Z"
}
```

---

## 📊 SQL para Inserir Diretamente no Supabase

```sql
-- Inserir comentários de exemplo na tabela inbox_messages
INSERT INTO inbox_messages (
  user_id,
  customer_email,
  customer_name,
  product_id,
  subject,
  body,
  sentiment,
  received_at
) VALUES
-- Comentário Positivo 1
(
  'c048be53-fff6-4446-a8b8-6abf79fce171',
  'rodrigo.silva@gmail.com',
  'Rodrigo Silva',
  'fe898fa8-d84e-498e-8742-ecf2103afec6',
  'Produto excepcional!',
  'Comprei a Bíblia Negra da Sedução e Poder há 2 semanas e já vi resultados incríveis. O conteúdo é muito direto e prático. Recomendo demais!',
  'positive',
  '2026-02-01T10:30:00Z'
),
-- Comentário Positivo 2
(
  'c048be53-fff6-4446-a8b8-6abf79fce171',
  'carlos.mendes@hotmail.com',
  'Carlos Mendes',
  'fe898fa8-d84e-498e-8742-ecf2103afec6',
  'Valeu muito a pena',
  'Estava em dúvida se comprava, mas depois de ler a Bíblia Negra minha confiança aumentou muito. O módulo sobre linguagem corporal é sensacional. Melhor investimento que fiz este ano.',
  'positive',
  '2026-02-02T14:15:00Z'
),
-- Comentário Neutro 1
(
  'c048be53-fff6-4446-a8b8-6abf79fce171',
  'paula.costa@yahoo.com',
  'Paula Costa',
  'fe898fa8-d84e-498e-8742-ecf2103afec6',
  'Bom, mas esperava mais',
  'O produto é bom, tem bastante conteúdo. Achei algumas partes um pouco repetitivas, mas no geral vale a pena. Queria mais exemplos práticos de casos reais.',
  'neutral',
  '2026-01-30T16:45:00Z'
),
-- Comentário Negativo 1
(
  'c048be53-fff6-4446-a8b8-6abf79fce171',
  'lucas.pereira@gmail.com',
  'Lucas Pereira',
  'fe898fa8-d84e-498e-8742-ecf2103afec6',
  'Não é o que esperava',
  'Comprei achando que teria técnicas mais avançadas. Achei muito básico para quem já tem alguma experiência. Talvez seja bom para iniciantes, mas não para mim.',
  'negative',
  '2026-01-28T09:00:00Z'
),
-- Comentário Positivo 3
(
  'c048be53-fff6-4446-a8b8-6abf79fce171',
  'mariana.lopes@yahoo.com.br',
  'Mariana Lopes',
  'fe898fa8-d84e-498e-8742-ecf2103afec6',
  'Valeu a pena esperar!',
  'Fiquei com o PIX pendente por quase 24h mas finalmente consegui pagar. E valeu muito a pena! A Bíblia Negra superou minhas expectativas. Os capítulos sobre poder pessoal são transformadores.',
  'positive',
  '2026-02-03T12:00:00Z'
),
-- Comentário Positivo 4
(
  'c048be53-fff6-4446-a8b8-6abf79fce171',
  'andre.santos@gmail.com',
  'André Santos',
  'fe898fa8-d84e-498e-8742-ecf2103afec6',
  'Capítulo 7 mudou minha vida',
  'O capítulo sobre frame control na Bíblia Negra foi um divisor de águas. Apliquei as técnicas no trabalho e já consegui uma promoção. Produto top demais!',
  'positive',
  '2026-01-31T18:30:00Z'
),
-- Comentário com Dúvida
(
  'c048be53-fff6-4446-a8b8-6abf79fce171',
  'rafael.bc@gmail.com',
  'Rafael BC',
  'fe898fa8-d84e-498e-8742-ecf2103afec6',
  'Dúvida sobre bônus',
  'Comprei a Bíblia Negra mas não recebi os bônus prometidos. Onde estão os áudios extras? Preciso de ajuda para acessar o material complementar.',
  'neutral',
  '2026-02-03T15:50:00Z'
),
-- Comentário Neutro 2
(
  'c048be53-fff6-4446-a8b8-6abf79fce171',
  'fernando.alves@outlook.com',
  'Fernando Alves',
  'fe898fa8-d84e-498e-8742-ecf2103afec6',
  'Interessante mas longo',
  'Comprei a Bíblia Negra e estou lendo aos poucos. O conteúdo é denso, são muitas páginas. Ainda não terminei, mas até agora está interessante. Espero que compense o tempo de leitura.',
  'neutral',
  '2026-01-29T11:20:00Z'
);

-- Verificar se foram inseridos
SELECT 
  customer_name,
  subject,
  sentiment,
  received_at
FROM inbox_messages
WHERE product_id = 'fe898fa8-d84e-498e-8742-ecf2103afec6'
ORDER BY received_at DESC;
```

---

## 🎯 Como Usar

### **Opção 1: Via Supabase SQL Editor**
1. Copie o SQL acima
2. Cole no Supabase SQL Editor
3. Execute
4. Vá em "Inteligência de Produtos"
5. Veja os comentários aparecendo!

### **Opção 2: Via API (se houver endpoint)**
Use os JSONs individuais para enviar via POST.

---

## 📊 Distribuição dos Comentários

- ✅ **Positivos:** 4 (50%)
- ⚠️ **Neutros:** 3 (37.5%)
- ❌ **Negativos:** 1 (12.5%)

**Termômetro esperado:** ~60-70% 🔥
