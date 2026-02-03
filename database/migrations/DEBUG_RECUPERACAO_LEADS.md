# 🔍 Debug: Recuperação de Leads - Produto e Valor Não Aparecem

## Verificação no Banco de Dados

Execute estas queries no **Supabase SQL Editor** para diagnosticar:

### 1. Ver dados da tabela sales_events

```sql
SELECT 
  id,
  customer_name,
  product_id,
  value,
  status,
  created_at
FROM sales_events
WHERE user_id = 'c048be53-fff6-4446-a8b8-6abf79fce171'
  AND status != 'paid'
ORDER BY created_at DESC
LIMIT 5;
```

**Oque verificar:**
- ✅ `product_id` deve ter UUID (não NULL)
- ✅ `value` deve ter número (não 0)

---

### 2. Ver produtos cadastrados

```sql
SELECT 
  id,
  name,
  external_id,
  price,
  platform
FROM products
WHERE user_id = 'c048be53-fff6-4446-a8b8-6abf79fce171'
ORDER BY created_at DESC;
```

**O que verificar:**
- ✅ Produto existe
- ✅ Campo `price` está preenchido
- ✅ Campo `name` está preenchido

---

### 3. Ver join completo (como a tela busca)

```sql
SELECT 
  se.id,
  se.customer_name,
  se.value,
  se.product_id,
  p.name as product_name,
  p.price as product_price
FROM sales_events se
LEFT JOIN products p ON se.product_id = p.id
WHERE se.user_id = 'c048be53-fff6-4446-a8b8-6abf79fce171'
  AND se.status != 'paid'
ORDER BY se.created_at DESC
LIMIT 5;
```

**O que verificar:**
- ✅ `product_name` deve aparecer (não NULL)
- ✅ `value` deve ter número

---

## Cenários Possíveis

### ❌ Cenário 1: product_id é NULL

```
product_id | product_name | value
-----------|--------------|------
NULL       | NULL         | 0.00
```

**Causa:** Webhook não associou o produto  
**Solução:** Reprocessar webhook ou atualizar manualmente

---

### ❌ Cenário 2: Produto não existe

```
product_id                           | product_name | value
-------------------------------------|--------------|------
39d44200-ce1d-11ef-8947-f71889bde439 | NULL         | 0.00
```

**Causa:** `product_id` aponta para produto inexistente  
**Solução:** Verificar se produto foi deletado

---

### ❌ Cenário 3: Produto sem preço

```
product_id                           | product_name     | value
-------------------------------------|------------------|------
39d44200-ce1d-11ef-8947-f71889bde439 | Example Product  | 0.00
```

**Causa:** Produto existe mas campo `price` está NULL  
**Solução:** Editar produto e adicionar preço

---

### ✅ Cenário 4: Dados corretos

```
product_id                           | product_name     | value
-------------------------------------|------------------|-------
39d44200-ce1d-11ef-8947-f71889bde439 | Example Product  | 197.00
```

**OK:** Dados corretos, problema pode ser no frontend

---

## 🛠️ Soluções por Cenário

### Se product_id é NULL (Cenário 1):

```sql
-- Atualizar sales_events com product_id correto
UPDATE sales_events
SET product_id = (
  SELECT id FROM products 
  WHERE external_id = 'EXTERNAL-ID-DO-PRODUTO'
  AND user_id = 'c048be53-fff6-4446-a8b8-6abf79fce171'
  LIMIT 1
)
WHERE id = 'ID-DO-SALES-EVENT';
```

---

### Se produto não tem preço (Cenário 3):

1. Vá em **Dashboard → Produtos**
2. Edite o produto
3. Adicione o preço (ex: 197.00)
4. Salve

Ou via SQL:
```sql
UPDATE products
SET price = 197.00
WHERE id = '39d44200-ce1d-11ef-8947-f71889bde439';
```

---

### Se produto não existe (Cenário 2):

Criar produto manualmente ou reenviar webhook.

---

## 📊 Execute e me envie os resultados!

Execute as 3 queries acima e **cole os resultados aqui**.

Com isso, vou identificar exatamente qual o problema e te dar a solução específica! 🎯
