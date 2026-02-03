-- Script SQL para inserir email de teste no Supabase
-- Execute no SQL Editor do Supabase

INSERT INTO inbox_messages (
  user_id,
  sender,
  sender_name,
  "to",
  subject,
  body,
  received_at,
  message_id,
  analise_sentimento,
  intencao,
  resumo_executivo,
  dores_identificadas,
  probabilidade_conversao,
  sugestao_resposta,
  produto_identificado,
  created_at
) VALUES (
  'c048be53-fff6-4446-a8b8-6abf79fce171', -- Substitua pelo seu user_id real
  'joao.silva@gmail.com',
  'João Silva',
  'insight@insighthubai.com',
  'Dúvida sobre a Bíblia Negra da Sedução',
  'Olá! Vi o anúncio da Bíblia Negra da Sedução e fiquei muito interessado. Gostaria de saber se o conteúdo realmente funciona para melhorar habilidades sociais e conquistar pessoas. O preço está um pouco alto, vocês têm alguma garantia ou período de teste? Também queria saber se tem suporte após a compra. Estou com receio de comprar e não conseguir aplicar as técnicas. Aguardo retorno!',
  '2026-02-03T14:30:00.000Z',
  'msg_biblia_negra_test_' || gen_random_uuid()::text,
  'Neutro',
  'Dúvida sobre produto',
  'Lead interessado na Bíblia Negra da Sedução mas com objeções sobre preço e eficácia. Busca garantias e suporte.',
  ARRAY['Receio de não saber aplicar as técnicas', 'Preço alto', 'Falta de confiança no produto'],
  65,
  'Olá João! Que ótimo que você se interessou pela Bíblia Negra da Sedução! Sim, o método funciona e temos milhares de alunos com resultados comprovados. Oferecemos garantia de 7 dias - se você não gostar, devolvemos 100% do seu dinheiro. Além disso, você terá acesso ao nosso grupo de suporte exclusivo com mentores para tirar dúvidas. As técnicas são explicadas passo a passo, bem práticas e fáceis de aplicar no dia a dia. Posso te enviar alguns depoimentos de alunos que estavam na mesma situação que você?',
  'Bíblia Negra da Sedução',
  now()
);

-- Verificar se foi inserido
SELECT 
  id, 
  sender, 
  subject, 
  produto_identificado,
  analise_sentimento,
  probabilidade_conversao,
  created_at
FROM inbox_messages 
WHERE produto_identificado = 'Bíblia Negra da Sedução'
ORDER BY created_at DESC
LIMIT 1;
