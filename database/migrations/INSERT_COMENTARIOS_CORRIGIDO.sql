-- ✅ SQL CORRIGIDO - Inserir Comentários de Teste

-- IMPORTANTE: Use as colunas corretas da tabela inbox_messages:
-- - sender (ao invés de customer_email)
-- - body_text (ao invés de body)
-- - product_id (se existir na tabela)

INSERT INTO inbox_messages (
  user_id,
  sender,
  subject,
  body_text,
  product_id,
  analise_sentimento,
  received_at
) VALUES
-- Comentário Positivo 1
(
  'c048be53-fff6-4446-a8b8-6abf79fce171',
  'Rodrigo Silva <rodrigo.silva@gmail.com>',
  'Produto excepcional!',
  'Comprei a Bíblia Negra da Sedução e Poder há 2 semanas e já vi resultados incríveis. O conteúdo é muito direto e prático. Recomendo demais!',
  'fe898fa8-d84e-498e-8742-ecf2103afec6',
  'Positivo',
  '2026-02-01T10:30:00Z'
),
-- Comentário Positivo 2
(
  'c048be53-fff6-4446-a8b8-6abf79fce171',
  'Carlos Mendes <carlos.mendes@hotmail.com>',
  'Valeu muito a pena',
  'Estava em dúvida se comprava, mas depois de ler a Bíblia Negra minha confiança aumentou muito. O módulo sobre linguagem corporal é sensacional. Melhor investimento que fiz este ano.',
  'fe898fa8-d84e-498e-8742-ecf2103afec6',
  'Positivo',
  '2026-02-02T14:15:00Z'
),
-- Comentário Neutro 1
(
  'c048be53-fff6-4446-a8b8-6abf79fce171',
  'Paula Costa <paula.costa@yahoo.com>',
  'Bom, mas esperava mais',
  'O produto é bom, tem bastante conteúdo. Achei algumas partes um pouco repetitivas, mas no geral vale a pena. Queria mais exemplos práticos de casos reais.',
  'fe898fa8-d84e-498e-8742-ecf2103afec6',
  'Neutro',
  '2026-01-30T16:45:00Z'
),
-- Comentário Negativo 1
(
  'c048be53-fff6-4446-a8b8-6abf79fce171',
  'Lucas Pereira <lucas.pereira@gmail.com>',
  'Não é o que esperava',
  'Comprei achando que teria técnicas mais avançadas. Achei muito básico para quem já tem alguma experiência. Talvez seja bom para iniciantes, mas não para mim.',
  'fe898fa8-d84e-498e-8742-ecf2103afec6',
  'Negativo',
  '2026-01-28T09:00:00Z'
),
-- Comentário Positivo 3
(
  'c048be53-fff6-4446-a8b8-6abf79fce171',
  'Mariana Lopes <mariana.lopes@yahoo.com.br>',
  'Valeu a pena esperar!',
  'Fiquei com o PIX pendente por quase 24h mas finalmente consegui pagar. E valeu muito a pena! A Bíblia Negra superou minhas expectativas. Os capítulos sobre poder pessoal são transformadores.',
  'fe898fa8-d84e-498e-8742-ecf2103afec6',
  'Positivo',
  '2026-02-03T12:00:00Z'
),
-- Comentário Positivo 4
(
  'c048be53-fff6-4446-a8b8-6abf79fce171',
  'André Santos <andre.santos@gmail.com>',
  'Capítulo 7 mudou minha vida',
  'O capítulo sobre frame control na Bíblia Negra foi um divisor de águas. Apliquei as técnicas no trabalho e já consegui uma promoção. Produto top demais!',
  'fe898fa8-d84e-498e-8742-ecf2103afec6',
  'Positivo',
  '2026-01-31T18:30:00Z'
),
-- Comentário com Dúvida
(
  'c048be53-fff6-4446-a8b8-6abf79fce171',
  'Rafael BC <rafael.bc@gmail.com>',
  'Dúvida sobre bônus',
  'Comprei a Bíblia Negra mas não recebi os bônus prometidos. Onde estão os áudios extras? Preciso de ajuda para acessar o material complementar.',
  'fe898fa8-d84e-498e-8742-ecf2103afec6',
  'Neutro',
  '2026-02-03T15:50:00Z'
),
-- Comentário Neutro 2
(
  'c048be53-fff6-4446-a8b8-6abf79fce171',
  'Fernando Alves <fernando.alves@outlook.com>',
  'Interessante mas longo',
  'Comprei a Bíblia Negra e estou lendo aos poucos. O conteúdo é denso, são muitas páginas. Ainda não terminei, mas até agora está interessante. Espero que compense o tempo de leitura.',
  'fe898fa8-d84e-498e-8742-ecf2103afec6',
  'Neutro',
  '2026-01-29T11:20:00Z'
);

-- Verificar se foram inseridos
SELECT 
  sender,
  subject,
  analise_sentimento,
  received_at
FROM inbox_messages
WHERE product_id = 'fe898fa8-d84e-498e-8742-ecf2103afec6'
ORDER BY received_at DESC;
