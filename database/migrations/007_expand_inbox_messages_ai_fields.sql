-- Expand inbox_messages table with AI analysis fields
-- Run this after 004_create_inbox_messages.sql

alter table inbox_messages 
  add column if not exists analise_sentimento varchar(20), -- 'Positivo', 'Neutro', 'Negativo'
  add column if not exists intencao varchar(50), -- 'Dúvida', 'Suporte', 'Venda', 'Reclamação', 'Elogio'
  add column if not exists resumo_executivo text,
  add column if not exists dores_identificadas jsonb default '[]'::jsonb,
  add column if not exists probabilidade_conversao int check (probabilidade_conversao >= 0 and probabilidade_conversao <= 100),
  add column if not exists sugestao_resposta text,
  add column if not exists raw_analysis jsonb; -- Full JSON from AI

-- Update existing records to have empty arrays for dores_identificadas
update inbox_messages set dores_identificadas = '[]'::jsonb where dores_identificadas is null;
